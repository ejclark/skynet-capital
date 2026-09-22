# Treasury International Capital (TIC) monthly release (November 2026 data) — the revision edition, measured — tic-monthly-2027-01-19

**Kind:** macro-print · **Date:** 2027-01-19 (confirmed, TSY: home.treasury.gov/data/treasury-international-capital-tic-system/release-dates-of-tic-data, fetched direct 2026-09-09, promoted from estimate this session — see leg 1) · **Impact:** low
**Last assessed:** 2026-09-09
<!-- probe-ref: {"symbols":{},"vix":15.72,"daysBand":"low:15+","adjacentIds":["boj-decision-2027-01-22","fomc-blackout-start-2027-01-16","japan-cpi-2027-01-22","mlk-market-closure-2027-01-18","opex-2027-01-15","treasury-10y-tips-2027-01-21","vix-expiration-2027-01-20","wef-davos-annual-meeting-2027-01-18"],"screenStreak":0,"blocked":[]} -->

## At a glance

**TL;DR.** **Four sibling ledgers asserted that a TIC "revision edition" restates the past year without
ever measuring it, and this session measured it — then found that the number is small, that the
measurement only works once you separate a bigger mechanism nobody had named, and that the tape claim
those siblings built on does not survive tripling its sample.** Three results, in order of how much they
cost. **First, the revision is real and now has a size.** Diffing **29 archived press-notice PDF
vintages** (2024-01 → 2026-08) cell by cell, a Jan/Apr/Jul/Oct edition restates an overlapping monthly
cell by a mean **$5.01bn** against **$1.67bn** for an ordinary edition (**t=+3.93**, n=6 vs 10) — but
against a **median monthly value of $102.8bn** on the lines it moves, that is ~**5%**, real and nowhere
near enough to flip a sign. **Second, and this is the load-bearing correction: the exclusion that makes
that test work is itself the finding.** The largest restatements in the whole panel are **not** the
revision editions — they are the **February/March** vintages, which moved a *closed calendar year* by up
to **$745.9bn**, where no revision edition exceeded **$54.8bn**. That is the annual-survey benchmark
feeding back, and it has never been on this calendar; it is proposed here as a new event. Leave Feb/Mar
in and the revision test is a flat null (**p=0.78**). Both readings are on the record, and this event's
own edition adjudicates. **Third, the tape claim breaks.** Extending the release sample from the
December sibling's **n=41** to **n=143** — every release since **2014-09-16**, when TIC moved to 16:00
ET and the next-session test first became the right test — the finding that "TIC next-sessions are
quieter than an ordinary session" **fails**: **3.51bp vs 3.99bp, p=0.087**, and **p=0.41** against a
mid-month control. Its "plain months" survivor degrades from p=0.008/0.038 to **p=0.044/0.178**. My own
bucket is a clean null (revision months **3.83bp, p=0.69/0.88**; January alone **3.92bp, p=0.90**). One
new thing did appear: next-session 10-year yields **rise +1.14bp** on average after a TIC release against
**+0.07bp** for all sessions (**t=+2.64, p=0.008**, every drop-one-year jackknife under p=0.04) — which
is **p=0.058 against the mid-month control** and is **~1bp**, so it is a statistic, not a trade. The date
is now **`confirmed`**, on unusually strong corroboration: January 2027 has two federal holidays, so the
holiday-aware 11th-business-day rule lands on **01-19 exactly** where a holiday-blind reading lands on
01-15 — the single cleanest test of that convention on the published schedule, and Treasury sides with
it. `symbols: []`, `low` tier, no macro-keyed playbook. Nothing here is a trade.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-497) | **Stand aside** | High | `symbols: []`, `low` tier, no macro-keyed playbook, and the release's own next-session effect is now measured on **n=143** as *indistinguishable from an ordinary session* (3.51bp vs 3.99bp, **p=0.087**; **p=0.41** vs a mid-month control) — the December sibling's quiet-null does not survive tripling its sample | Any TIC release between now and **2027-01-19** whose next session moves the 10-year more than **11bp** — ~3σ of the n=143 distribution (sd 3.61bp). Sixteen releases fall in that window, the first being **2026-09-16** |
| This week | **Stand aside; nothing about this print resolves inside 497 days** | High | The reference month begins **2026-11-01**, 53 days out, and closes **2026-11-30** — every content claim here is conditional on an input that does not exist. The corridor's live forks this week are CPI **2026-09-11** and the FOMC **2026-09-16** | The 30-year closing **above 5.40%** on the Treasury par curve on or before **2026-09-16** — 15bp above 09-08's **5.25%** and 9bp above the 2026 high (5.31%, 08-17) — which would mean the long end is repricing term premium hard enough that foreign-demand prints get read live |
| This month | **Watch the December sibling's lapse branch, because this date is its destination — not its subject** | Medium | `FT-tic-monthly-2026-12-15-2` predicts a lapse-hit December release publishes late rather than merging into **this** slot, on 22 business days of runway. That test scores **on 2027-01-20**, in this document's ledger, and it is the only way the funding fight touches this print | An FY2027 appropriation or a further CR enacted **on or before 2026-12-11**, which retires the branch entirely and leaves 2027-01-19 an ordinary single-cut release |
| This quarter | **Treat "revision edition" as a ~5% nudge with a stated size, not as a reason to distrust a scored month** | Medium | Measured, not assumed: **$5.01bn** mean restatement at a revision vintage vs **$1.67bn** ordinary (t=+3.93), against a **$102.8bn** median monthly value. The premise this event was proposed under is sharpened rather than refuted | The **2027-01-19** edition restating an overlapping monthly cell by a mean **above $15bn** (**FT-tic-monthly-2027-01-19-3**) — three times the measured revision-edition mean — which would say the annual revision is materially bigger than this panel found and that a scored month is genuinely unsafe |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never initiate on this print.** `symbols: []`, `low` tier, no macro-keyed playbook (S1/S2/E1/S3/S4 + G1 are symbol/earnings-keyed), 16:00 ET publication after the cash close, six-week-old data.
- **The date is `confirmed`, and January 2027 is where the convention gets tested.** Two federal holidays (01-01, MLK 01-18) push the 11th business day to **01-19 exactly (offset +0)**; a holiday-blind reading lands on **01-15**. Treasury published 01-19. Registered **FT-tic-monthly-2027-01-19-1**.
- **The tape null, on the honest sample.** n=143 releases since 2014-09-16 (the 16:00 ET era): |Δ10Y| **3.51bp** vs **3.99bp** all sessions (**p=0.087**) and **3.76bp** mid-month (**p=0.41**). The December sibling's n=41 result (p=0.005/0.09) **does not survive**. Registered **FT-tic-monthly-2027-01-19-2** at an 11bp kill.
- **My own bucket is the cleanest null on the board.** Revision months **3.83bp (n=46)**, p=0.69 vs all sessions and **p=0.88** vs the control; January alone **3.92bp (n=12)**, p=0.90. A release that restates a year of data is indistinguishable from one that does not.
- **The new observation, stated with its own deflation.** Signed next-session Δ10Y is **+1.14bp** (n=142) against **+0.07bp** for all sessions, **t=+2.64, p=0.008**, robust to dropping any single year (p 0.005–0.039) and same-signed in both halves. Against the mid-month control it is **p=0.058**. At ~1bp it is a statistic and not a trade, and it is recorded that way.
- **The revision, quantified for the first time in this series.** **$5.01bn** mean absolute restatement of an overlapping monthly cell at a Jan/Apr/Jul/Oct vintage vs **$1.67bn** ordinary (t=+3.93, n=6 vs 10) — ~**5%** of a **$102.8bn** median monthly value. Registered **FT-tic-monthly-2027-01-19-3**.
- **The exclusion that makes it work is the bigger finding, and it becomes a calendar entry.** Feb/Mar vintages moved a closed calendar year by up to **$745.9bn** — the annual-survey benchmark feed. Proposed as `tic-annual-survey-prelim-2027-02-26`, overturning three siblings' decline on evidence.
- **This print is cleanly testable, which almost none of them are.** Eight tracked events within ±5 days (December's had 27), no CPI/PPI/retail-sales cluster tracked in the window, and the scored session **2027-01-20** carries only a VIX expiration. Second such release on this calendar after 2026-10-16.
- **The content call is withheld, deliberately.** The model reproduces (`valchg% = 0.0833 − 0.04138 × Δ10Y`, **R² 0.9466**, n=40, duration **4.14**, base **$7,873bn**), but November 2026 has not begun.
- **The structural gauge, next observation (registered).** Official bills vs bonds & notes, y/y against the **November 2025** baselines **$385.6bn** and **$3,526.8bn** — **FT-tic-monthly-2027-01-19-4**, the sequel to 12-15's FT-4 on a later month.

## Initial research

### The question

Does the "annual revision edition" label this event was proposed under mean anything measurable — and
does the tape story four sibling ledgers have been refining survive being tested on the sample it should
always have been tested on?

### One-line verdict

Both premises move: the revision is real but small and only visible once the February/March
annual-survey benchmark is separated out as a larger and previously unnamed mechanism, and the sibling
series' central tape claim — that TIC next-sessions are quieter than ordinary sessions — **fails on the
full 16:00-ET-era sample**, leaving a ~1bp signed drift that is statistically clean and economically
nothing.

### Method

Sourced web research per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) (macro-print mode — no
symbol instruments exist for this kind; `symbols: []`). Primaries fetched **direct** this session
(2026-09-09, plain curl, HTTP 200 unless noted): Treasury's TIC release-dates table; the TIC
press-releases-by-topic index with its **per-year archive back to 2003**; **29 archived press-notice
PDFs** from `home.treasury.gov/system/files/136/`, decompressed from their raw PDF streams and parsed to
the numbered table lines — the source no ledger in this series had opened, and where legs 3 and 4 come
from; the live data files `slt_table1.txt` and `slt_table5.txt`; Treasury's daily par yield curve CSVs
for **2014–2026**; and CBOE's `VIX_History.csv` and `VIX3M_History.csv`. Every statistic was
**recomputed from those files**. Where a figure matches a sibling ledger it is an independent
reproduction and is stated as one; where it differs, the difference is the finding. `probe-ref.blocked`
is empty: no cited source failed.

### Leg 1 — the date · **SUPPORTED**, and promoted `estimate` → `confirmed`

Treasury's release-dates table puts January 2027's row at **19** in the *Monthly* column, with the
*Quarterly*, *gross external debt* and both *Annual* columns **empty** — so unlike 2026-12-15 this is a
**single-cut** release, the monthly press release alone. Reference month **November 2026** by the page's
stated 1.5-month lag, under the header *"All data releases occur at 4 p.m. Washington, D.C. time"*.

The mechanical corroboration is stronger here than on any sibling date, and for a reason specific to
this month. The page's published rule is *"the 11th business day plus 0 to 3 days"*. January 2027
carries **two** federal holidays — New Year's Day (01-01, a Friday) and MLK (01-18). Computed with
5 U.S.C. 6103 holidays **excluded**, the 11th business day of January 2027 is **2027-01-19 exactly**
(offset **+0**). Computed **without** excluding holidays, the 11th weekday is **2027-01-15** — four
calendar days earlier. Treasury published **01-19**.

That makes this date the single cleanest discriminator on the published schedule between the two
readings of Treasury's own rule, and it **sides with holiday-aware** — the convention every sibling
ledger in this series has assumed without a date that could separate them. Recomputed across all **24**
published 2026 and 2027 dates, the holiday-aware convention lands in-window **22** times and hits **9**
exactly, reproducing the December sibling's count.

One correction to my own arithmetic, made mid-session and stated because the number would otherwise be
wrong: measuring the offset in *unsigned* business days made the rule appear to score 24/24, because a
date published *earlier* than the 11th business day was collapsed to offset +0. With the sign restored,
the two known misses reappear — **2026-01-15** (−1 bd) and **2026-07-14** (−2 bd). Both are **early**
publications, and both are **revision months**, which is a caution worth stating: January is one of the
two months where the published date has drifted off the rule's floor. It does not touch this date, whose
published value and computed value agree exactly, but it means the rule alone would not have been
sufficient here — the published table is the primary and the rule is the check, not the other way round.

Promotion follows [`mts-october-2026-11-12`](mts-october-2026-11-12.md) and the four TIC siblings: one
named Treasury primary plus independent mechanical corroboration. The `estimate` ground the proposal
cited was this lane's **no-self-confirm** limit — the entry was discovered by the
`tic-monthly-2026-11-18` sweep, not researched. That is cleared here. As on every sibling, `confirmed`
describes **the published schedule and nothing else**; the same page carries the closure-revision
notice.

### Leg 2 — does the release quiet the tape? · **REFUTED** (the sibling series' central claim)

Reproduced before extended, in both directions. The December sibling's window (2024-03-19 → 2026-08-17,
n=29) gives next-session **Δ10Y +0.86bp, sd 3.41, t=+1.36** and **Δ30Y +0.79bp** — its figures to the
decimal, from an independent rebuild of the release list off the press-release archive and an
independent pull of the par curve. The reproduction is exact.

The extension is the finding. Every sibling has sampled from **2023-03-15** or later, giving n=29 to
n=41. But the natural boundary is documented on Treasury's own page: *"Beginning September 16, 2014, the
monthly Treasury International Capital (TIC) data are released at 4:00 PM Eastern time. Previously, the
release time was normally at 09:00 a.m."* Before that date a TIC release landed **during** the session,
so the next-session test is measuring the wrong day. From **2014-09-16** forward it is the right test,
and it gives **n=143** — three and a half times the largest sample any sibling used.

| Sample (|Δ10Y| on the session after a release) | n | mean | vs all sessions (3.99bp) | vs mid-month control (3.76bp) |
|---|---|---|---|---|
| **All TIC releases, 16:00-ET era** | **143** | **3.51bp** | t=−1.71, **p=0.087** | t=−0.83, **p=0.41** |
| Revision (Jan/Apr/Jul/Oct) | 46 | 3.83bp | p=0.69 | **p=0.88** |
| Quarterly cut (Mar/Jun/Sep/Dec) | 48 | 3.48bp | p=0.41 | p=0.66 |
| Plain (Feb/May/Aug/Nov) | 48 | 3.23bp | **p=0.044** | p=0.18 |
| January alone | 12 | 3.92bp | p=0.90 | — |

Three readings, in order of what they cost:

1. **The headline claim does not survive.** The December sibling's *"TIC next-sessions are somewhat
   quieter than an ordinary session"* was p=0.005 against all sessions on n=41 and already only p=0.09
   against a mid-month control. On n=143 it is **p=0.087** and **p=0.41**. The effect shrank as the
   sample grew, which is the signature of a small-sample artifact rather than a mechanism.
2. **Its surviving half degrades too.** The "plain months" bucket that carried the result at
   **p=0.008 / p=0.038** on n=14 runs **p=0.044 / p=0.178** on n=48. It clears 0.05 against the wrong
   baseline and fails against the right one. That is not a refutation of the sibling's arithmetic —
   which reproduces — but of the inference drawn from it.
3. **My own bucket is the cleanest null available.** Revision editions run **3.83bp**, p=0.69 against an
   ordinary session and **p=0.88** against a matched control; January alone **3.92bp**, p=0.90. A
   release that restates twelve months of data moves the next session exactly as much as one that does
   not.

**The one new thing, and its deflation in the same breath.** Every ledger in this series measured
|Δ| — magnitude. Nobody tested **sign** at a sample that could see it. On n=142 the signed next-session
Δ10Y is **+1.14bp** against **+0.072bp** for all 2,990 sessions in the window: **t=+2.64, p=0.008**. It
is robust — drop-one-year jackknife gives p between **0.005 and 0.039** for all thirteen years, and both
halves carry the same sign (+0.96bp then +1.32bp). Two things keep it from being a finding worth acting
on. Against the **mid-month control** (day-of-month 15–21, mean +0.311bp) it is **t=+1.90, p=0.058** —
it does not clear the bar against the baseline that matters, so a mid-month calendar effect is not
excluded. And the effect is **~1 basis point**: below the tick this ledger records, unhedgeable, and
smaller than the bid-ask on anything that could express it. It is registered as an observation, not a
signal.

### Leg 3 — is a "revision edition" measurably different? · **SUPPORTED**, with a number and a caveat

This is the claim this event was proposed under and nobody had opened the source that tests it.
Treasury's note (c), verbatim from the release-dates page: *"The January, April, July, and October
releases reflect revised data for the past year. For significant revisions, the release will reflect
revised data beyond the past year. All other releases reflect revised data for the prior 3 months."*

Each monthly press notice is a PDF carrying the summary table with **four monthly columns** and two
fixed calendar-year columns. Consecutive notices therefore **overlap by three monthly columns**, and the
difference between two vintages on an overlapping cell **is** the revision. Twenty-nine notices were
fetched (2024-01 → 2026-08; four months' notices use a different filename and were resolved through
their press-release pages, and **2025-10 does not exist because that release was cancelled** — an
independent corroboration of the December sibling's leg 2), decompressed from raw PDF streams, and
parsed to the numbered lines. The parse was verified cell-by-cell against the raw text of four
consecutive 2024 notices before any statistic was computed.

| Overlapping monthly cells, lines 3/19/21/23/30 | n vintages | mean \|revision\| | median |
|---|---|---|---|
| **Revision-month vintages (Jan/Apr/Jul/Oct)** | 6 | **$5.01bn** | $5.4bn |
| **Ordinary vintages** | 10 | **$1.67bn** | $0.9bn |
| Welch | | **t=+3.93** | **p<0.001** |

**The claim holds, at a size.** A revision edition restates a monthly cell about **three times** as much
as an ordinary edition does. And the scale is what makes it usable rather than alarming: the **median
absolute monthly value** on the lines being moved is **$102.8bn**, so a $5bn revision is roughly **5%**
— enough to matter to a decimal, never enough to flip the sign of a flow or move the leg-5 valuation
model beyond its own **0.249pp** residual.

**Two honesty items that belong in the result, not in a footnote.**

The **February/March vintages are excluded**, and that exclusion is a judgment made *after* seeing the
data. Left in, the same test is a **flat null: revision $5.01bn vs ordinary $4.46bn, p=0.78** — because
three Feb/Mar vintages carry restatements an order of magnitude larger than anything else in the panel
(2024-02 moved the closed 2021 and 2022 totals on line 30 by **+$515.0bn** and **−$745.9bn**; 2025-03 by
**+$127.9bn**; 2026-03 by **+$68.5bn**). Both readings are stated because the exclusion is contestable,
and the falsifier is this event's own edition (**FT-tic-monthly-2027-01-19-3**).

The **grounds for excluding them are not convenience** — they are that Feb/Mar is a different and
documented mechanism. Treasury's own footnote 9 records a *"Series break at February 2023"*, and the
preliminary annual survey publishes on the **last business day of February** with the final on the last
business day of April, feeding the benchmark back into the monthly series. That is leg 4.

**The clean visual, verified by hand.** Line 19 (Net Long-Term Securities Transactions), the closed
**2023** calendar-year total, across four consecutive 2024 vintages:

```
Aug-2024   986.8
Sep-2024   986.7      (−0.1)
Oct-2024   931.9      (−54.8)   <- the October revision edition, −5.6% on a closed year
Nov-2024   931.0      (−0.9)
```

That is the mechanism visible in four numbers: the revision edition cut a settled year by **$54.8bn**
while its neighbours moved it by under **$1bn**. Two further points keep it from being over-read. The
**2022** column did not move at all across the same span, so the annual revision reaches back about one
year and no further, exactly as note (c) says. And the two **January** editions in the panel are the
**smallest** revision editions observed (2025-01: max $7.5bn on a closed year; 2026-01: **$0.0bn** on
the 2024 total, max $3.5bn across five lines) — so on n=2, the big restatement lands in **October**, not
January. Stated as a hypothesis with a falsifier, not a result.

### Leg 4 — where the real restatement lives · **MIXED**, and it becomes a calendar entry

The panel's largest movements are not where note (c) points. Ranked by the largest absolute change to a
**closed** calendar-year total across the five tracked lines, adjacent same-label vintages only:

| Vintage | Kind | max \|Δ closed-year\| |
|---|---|---|
| 2024-02 | ordinary (**Feb**) | **$745.9bn** |
| 2025-03 | ordinary (**Mar**) | **$127.9bn** |
| 2026-03 | ordinary (**Mar**) | **$68.5bn** |
| **2024-10** | **revision** | **$54.8bn** |
| 2026-07 | revision | $35.9bn |
| 2025-06 | ordinary | $18.7bn |
| every other vintage | — | ≤ $14.3bn |

The three largest are all February or March. That window is where the **preliminary annual survey**
(*Report on Foreign Portfolio Holdings of U.S. Securities at end-June*, last business day of February)
and footnote 9's series break both sit. Three sibling ledgers — `tic-monthly-2026-09-16`, `-10-16` and
`-12-15` — each met this survey's October counterpart in their own adjacency sweeps and each declined it
with the same sentence, *"a different series on a yearly cadence."*

That decline is overturned here, on evidence rather than preference. The survey is not a parallel series
that shares a website: it is the **largest single input to the revisions of the monthly series this
calendar already tracks**, and the monthly ledgers have been reading vintage changes without it on the
board. It is proposed as `tic-annual-survey-prelim-2027-02-26` (2027-02-26 is the last business day of
February 2027 — 02-28 is a Sunday — matching the page's own stated rule at offset +0).

Two limits, plainly. The 2024-02 figure sits on the 2021/2022 columns across the documented series
break, so part of that **$745.9bn** is a definitional change and not a data revision; the ranking is
robust to dropping it, since 2025-03 and 2026-03 still lead every revision edition. And n=3 February/
March vintages is a small basis for a mechanism claim, which is precisely why the answer is *put it on
the calendar and let the next sweep read it* rather than *assert it*.

### Leg 5 — what November will show, and why this session declines to say · **MIXED**

The model reproduces independently. Regressing the Grand Total reported long-term Treasury valuation
change (as a percent of the prior month's long-term holdings) on the month-end Δ10Y:

```
valchg% = 0.0833 − 0.04138 × Δ10Y(bp)      n=40 (2023-03 → 2026-06)   R² = 0.9466
                                           residual sd = 0.249pp      t(slope) = −26.0
```

Against the December sibling's `0.0806 − 0.04156 × Δ10Y`, R² 0.9496, sd 0.250pp — the same fit to
within a one-month difference in sample start, implied duration **4.14** against its 4.16. Its
**$7,873bn** June-2026 long-term Treasury base is confirmed exactly, and its drift finding reproduces:
last-twelve-month residuals average **−0.218pp** and are negative in **10 of 12**.

**And that is where the content call stops, for a stronger reason than the December sibling had.** Its
reference month was open with 22 days to run. Mine has not **begun** — November 2026 starts in 53 days
and closes **2026-11-30** — and the Δ it would be keyed to is drawn from a distribution with sd
**25.4bp**. The map is published and nothing is registered from it:

| Month-end Δ10Y for November 2026 | model |
|---|---|
| −20bp | +0.91% |
| −10bp | +0.50% |
| 0bp | +0.08% |
| +10bp | −0.33% |
| +20bp | −0.74% |

The first pulse landing after 2026-11-30 should register the band against a fixed Δ. Today's cannot, and
saying so is the call.

### Leg 6 — the structural read · **SUPPORTED**, unchanged and stated as unchanged

The data tip has not moved since the December sibling: `slt_table5`'s latest column is still **June
2026**, because the next release is 2026-09-16. Its decomposition is confirmed against the live file
rather than inherited — official bills **$457.3bn** at the April 2026 peak → **$396.2bn** (May) →
**$360.6bn** (June), the −$61.1bn and −$35.6bn the sibling recorded, and June's level is now **below**
the year-ago **$402.6bn**. No new observation exists, and this ledger adds none; it records the baseline
its own forward test will be scored against.

For reference month **November 2026** the y/y comparison is against **November 2025**: official Treasury
bills **$385.6bn**, official bonds & notes **$3,526.8bn** (grand total $9,349.6bn, foreign official
$3,912.3bn). Registered as **FT-tic-monthly-2027-01-19-4** — the relative test, a direct sequel to
12-15's FT-4 on October baselines.

### Leg 7 — honest limits

- **The vintage panel is 29 notices over 32 months.** Legs 3 and 4 rest on **6 revision-month** and
  **10 ordinary** adjacent vintage pairs after exclusions. The t-statistic is clean; the n is not large,
  and a single unusual edition would move it. It is written as a forward test, never as a probability.
- **The Feb/Mar exclusion is post-hoc and is the single most contestable choice here.** It flips leg 3
  from p=0.78 to p<0.001. The grounds are documented (footnote 9's series break, the annual-survey
  feed), the un-excluded result is printed beside the excluded one, and the falsifier is this event's
  own edition. A reader who rejects the exclusion should read leg 3 as a null.
- **A press-notice table is not the full dataset.** It carries four monthly columns on ~32 lines. A
  revision to a month older than four vintages, or to a line the notice does not print, is invisible to
  this method — so **$5.01bn is a floor on the revision, not a measurement of all of it**.
- **One vintage is missing from the panel by absence of an attachment**, not by a blocked fetch: the
  2025-04 press release (sb0091) returned HTTP 200 with no notice PDF linked. Non-adjacent pairs were
  dropped rather than bridged, so no revision is attributed to the wrong month; the cost is one lost
  April revision edition.
- **The signed-drift result is one test among several I ran.** It clears p=0.008 against all sessions
  and fails at p=0.058 against the control. On a multiple-comparison basis it should be treated as
  hypothesis-generating, and its ~1bp size settles the question of whether it matters either way.
- **The reference month does not exist yet.** Every November-2026 figure in leg 5 is a map, and nothing
  here keys an action to one.
- **Custodial mis-attribution.** Treasury's Table 5 note: securities in overseas custody accounts *"may
  not be attributed to the actual owners"*. The official/private and bills/coupons splits are more
  robust than any country line; no country-level claim is made.
- **A primary's own typo, corrected by sequence and stated.** The press archive lists *"01/19/2023 — TIC
  Data for November 2023"*; the real date is **2024-01-19**. It was corrected in the release list before
  any statistic was computed — uncorrected it would have inserted a phantom 2023 release and dropped a
  real 2024 one. The December sibling documented the same typo.
- **No consensus, no whisper.** Searched, not asserted — TIC carries no sell-side forecast
  distribution, which is part of why a surprise cannot be priced.
- **`confirmed` covers the date and nothing else.** Not the occurrence, not the content, not the
  revision size. No house playbook is macro-keyed in any case.

## Stance & kill switches

**Stance (initial, 2026-09-09).** **Stand aside on every horizon; this document's output is two
corrections and a number, not a position.** The date is `confirmed` off Treasury's own January row, with
the strongest mechanical corroboration in this series — January 2027's two federal holidays make
**01-19** the one published date that separates the holiday-aware 11th-business-day convention from the
holiday-blind one, and Treasury sides with the convention every sibling assumed. On the tape, the
sibling series' central claim is **withdrawn**: extended to the full 16:00-ET era (**n=143** from
2014-09-16, the boundary at which the next-session test first became the right test), TIC next-sessions
are **not** measurably quieter than ordinary sessions (**p=0.087**, and **p=0.41** against a mid-month
control), and the "plain months" survivor degrades to p=0.044/0.178. This event's own bucket is a clean
null (**p=0.88** against the control). One new observation — a **+1.14bp** signed next-session drift,
t=+2.64 and robust to any single year's removal — is recorded and explicitly **not** promoted: it fails
against the right control at p=0.058 and is one basis point. On the revision question this event was
created to answer, the answer is now a measured number rather than an assertion: a revision edition
restates an overlapping monthly cell by **$5.01bn** against **$1.67bn** for an ordinary edition
(t=+3.93), which is ~**5%** of a $102.8bn median month — and the largest restatements in the panel turn
out to belong to **February/March**, not to the revision editions at all, which puts the annual survey
on this calendar for the first time. The content call is withheld on purpose: November 2026 has not
begun.

**Kill switches** — any one of these forces a re-assessment, not a trade:

1. **The release does not publish on 2027-01-19** (**FT-tic-monthly-2027-01-19-1**), whether from a
   Washington D.C. closure or a schedule revision. Treasury's own notice is the mechanism.
2. **The tape null breaks.** |Δ10Y| on **2027-01-20** exceeds **11bp** (**FT-tic-monthly-2027-01-19-2**)
   — ~3σ of the n=143 distribution (sd 3.61bp). Unlike every sibling's version of this test, this one is
   **not contaminated**: the scored session carries only a VIX expiration.
3. **The revision is bigger than measured.** The 2027-01-19 edition restates an overlapping monthly cell
   by a mean **above $15bn** (**FT-tic-monthly-2027-01-19-3**) — three times the panel's revision-edition
   mean — which would say a scored month is genuinely unsafe and that leg 3's number is too small.
4. **The revision is smaller than measured, or absent.** The same edition restates by **under $1.67bn**
   (the ordinary-vintage mean), which would say the Feb/Mar exclusion manufactured leg 3's effect and the
   un-excluded null (p=0.78) was right. Both directions are pre-stated so neither can be read as
   confirmation after the fact.
5. **The December release merges forward into this slot.** October-2026 data arriving inside the
   2027-01-19 release rather than under its own date kills
   [`FT-tic-monthly-2026-12-15-2`](../forward-tests/tic-monthly-2026-12-15.md) at its first real test,
   and this ledger is where that gets observed. It also makes 2027-01-19 a double release, which no part
   of this document assumes.
6. **The bill drawdown reverses.** Official **bonds & notes** fall faster in y/y percentage terms than
   official **bills** for reference month November 2026 (**FT-tic-monthly-2027-01-19-4**), measured
   against the November 2025 baselines **$385.6bn** and **$3,526.8bn**.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-09 | D-497 | Initial research banked (above). **Canonical `<id>.json` written from the one existing proposal** (`from-tic-monthly-2026-11-18`), which it now shadows. **Date PROMOTED `estimate` → `confirmed` (`TSY:`)**: Treasury's January 2027 row reads **19 monthly** with quarterly, external-debt and annual columns **empty** — a single-cut release, unlike 12-15's double. Corroboration is the strongest in this series: January 2027 has **two** federal holidays (01-01, MLK 01-18), so the holiday-aware 11th-business-day rule lands on **01-19 exactly (+0)** where a holiday-BLIND reading lands on **01-15** — the one published date that discriminates the two conventions, and Treasury sides with holiday-aware. Convention scores **22/24 in-window, 9/24 exact** across 2026-27, reproducing 12-15. Self-correction recorded: an unsigned business-day offset made the rule look like 24/24; with the sign restored the two known misses reappear (**2026-01-15 −1bd, 2026-07-14 −2bd**), and both are **early** publications in **revision months** — a caution that the rule alone is not sufficient for a January. **Finding 1 — the sibling series' central tape claim is REFUTED.** Treasury's own page documents that TIC moved to **16:00 ET on 2014-09-16** (previously 09:00), which is the boundary at which the next-session test first became the right test; every sibling sampled from 2023 or later. Extended to **n=143 (2014-09-16 → 2026-08-17)**, |Δ10Y| **3.51bp** vs **3.99bp** all sessions (**p=0.087**) and **3.76bp** mid-month control (**p=0.41**) — 12-15's n=41 result (p=0.005/0.09) does **not** survive, and its surviving "plain months" bucket degrades **p=0.008/0.038 → p=0.044/0.178 (n=48)**. Sibling window reproduced exactly first (**n=29, +0.86bp, sd 3.41, t=+1.36**; Δ30Y +0.79). Buckets: revision **3.83bp (n=46, p=0.69/0.88)**, qtr **3.48bp (n=48)**, plain **3.23bp (n=48)**, January alone **3.92bp (n=12, p=0.90)**. **This event's own bucket is the cleanest null on the board.** **Finding 2 — one new observation, deflated in the same breath.** Nobody had tested **sign**: signed next-session Δ10Y **+1.14bp (n=142)** vs **+0.072bp** all sessions, **t=+2.64, p=0.008**, drop-one-year jackknife p=**0.005–0.039** for all 13 years, both halves same-signed. But **p=0.058** against the mid-month control and the effect is **~1bp** — recorded as a statistic, explicitly not promoted to a signal. **Finding 3 — the revision edition finally has a number, from a source nobody in this series had opened.** **29 archived press-notice PDFs** (2024-01 → 2026-08) fetched from `home.treasury.gov/system/files/136/`, decompressed from raw streams, parsed to the numbered lines and **verified cell-by-cell against raw text** before any statistic. Consecutive notices overlap by 3 monthly columns, so the vintage difference **is** the revision. Revision-month vintages restate an overlapping cell by a mean **$5.01bn** vs **$1.67bn** ordinary (**t=+3.93**, n=6 vs 10) — ~**5%** of the **$102.8bn** median monthly value on those lines, so real but never enough to flip a sign. Note (c) quoted verbatim. Clean visual, hand-verified: line 19's closed **2023** total ran 986.8 → 986.7 → **931.9 (Oct-2024 revision edition, −$54.8bn, −5.6%)** → 931.0, with the **2022** column unmoved throughout (the revision reaches back ~1 year, as note (c) says). The two **January** editions observed are the **smallest** revision editions ($7.5bn, $3.5bn) — on n=2, the big restatement is October's, stated as a hypothesis. **Finding 4 — the load-bearing caveat, which becomes a calendar entry.** Leg 3's result depends on excluding **February/March** vintages, a post-hoc choice: left in, the test is a **flat null (p=0.78)**. Grounds are documented, not convenient — the three largest restatements in the whole panel are Feb/Mar (**2024-02 $745.9bn**, 2025-03 $127.9bn, 2026-03 $68.5bn) against a max **$54.8bn** for any revision edition, and Feb/Mar is where footnote 9's series break and the **preliminary annual survey**'s benchmark feed both sit. Both readings printed side by side; **FT-…-3** and **-4-style pre-statement in both directions** so neither can be read as post-hoc confirmation. **Finding 5 — model reproduced independently, content call withheld.** `valchg% = 0.0833 − 0.04138 × Δ10Y`, **R² 0.9466, n=40**, sd 0.249pp, duration **4.14**; 12-15's **$7,873bn** June-2026 base confirmed exactly; last-12 residual **−0.218pp**, negative 10/12. But November 2026 **has not begun** (starts in 53 days, closes 11-30, Δ sd **25.4bp**) so leg 5 publishes a map and registers **nothing**; the first pulse after 11-30 should register the band. **Finding 6 — structural read unchanged and stated as unchanged.** `slt_table5` tip is still **June 2026** (next release 09-16); the April→June bill path **457.3 → 396.2 → 360.6** confirms 12-15's decomposition against the live file, with June now **below** the year-ago 402.6. **Adjacency sweep.** *Peers:* n/a (`symbols: []`). *Macro:* **the corridor is THIN — 8 tracked events within ±5 days against 27 for 2026-12-15**: opex 01-15, FOMC blackout start 01-16, MLK closure 01-18, WEF Davos 01-18, VIX expiration 01-20, 10Y TIPS 01-21, BoJ decision 01-22, Japan CPI 01-22. **No CPI/PPI/retail-sales cluster is tracked in the window and the scored session 2027-01-20 carries only a VIX expiration** — so this is the **second cleanly testable TIC release** on the calendar after 2026-10-16, and the first whose kill switch is not contaminated. *Vol:* **VIX 15.72**, VIX3M **18.39** (2026-09-08 CBOE cash closes — fresher than 12-15's 09-04 readings of 14.53/17.61, so **VIX +1.19 since**). 10Y **4.80%**, 30Y **5.25%**, 2Y **4.39%** (09-08 par curve). Baseline set; nothing to diff against yet. *Geopolitical/policy:* this date sits inside the `fomc-blackout-start-2027-01-16` window ahead of `fomc-2027-01-27`, and is the **destination slot** `FT-tic-monthly-2026-12-15-2` names if a lapse merges the December release forward — that test scores **2027-01-20**, in this ledger. *Event tape:* no consensus distribution exists for TIC. **New dated adjacencies: TWO proposed.** (1) **`tic-monthly-2027-02-18`** — the next unclaimed monthly slot, and the **control observation** finding 3 needs: the ordinary edition standing immediately after this revision edition (11th bd 02-16, published offset +2 bd, in-window). (2) **`tic-annual-survey-prelim-2027-02-26`** — the preliminary annual survey, last business day of February 2027 at offset **+0** (02-28 is a Sunday). **This OVERTURNS a decline three siblings made** (`09-16`, `10-16`, `12-15` each called the survey "a different series on a yearly cadence"), on the evidence in finding 4: it is the **largest single input to the revisions of the monthly series this calendar already tracks**, and the monthly ledgers have been reading vintage changes without it on the board. Declined on precedent, unchanged: the 2026-12-31 gross external debt cut (no press release, outside the corridor). **Blocked fetches:** none — `probe-ref.blocked` is empty. Two absences recorded and *not* counted as blocks: the **2025-10 notice does not exist** (that release was cancelled — an independent corroboration of 12-15's leg 2), and the **2025-04 press release returned HTTP 200 with no notice PDF attached**, costing the panel one April revision edition; non-adjacent vintage pairs were dropped rather than bridged, so no revision is attributed to the wrong month. | — (stance set) | 2026-10-09 (`low:15+`, every 30d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-<this-event-id>.json` (`status: "estimate"`) in the
same PR — your own file, never another event's canonical one (#1717). Close-out fills `## Outcome` below from re-run instrument
data (cache busted first), never from memory — after which this doc goes quiet.
