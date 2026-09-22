# Treasury International Capital (TIC) monthly release (October 2026 data) + the quarterly cut — the shutdown-exposed edition — tic-monthly-2026-12-15

**Kind:** macro-print · **Date:** 2026-12-15 (confirmed, TSY: home.treasury.gov/data/treasury-international-capital-tic-system/release-dates-of-tic-data, fetched direct 2026-09-08, promoted from estimate this session — see leg 1) · **Impact:** low
**Last assessed:** 2026-09-08
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"low:15+","adjacentIds":["boj-decision-2026-12-18","boj-tankan-2026-12-14","cpi-2026-12-10","cr-expiry-2026-12-11","ecb-decision-2026-12-17","ercot-data-center-audit-filing-2026-12-10","g20-miami-2026-12-14","g20-sherpa-iv-miami-2026-12-10","government-funding-deadline-2026-12-11","housing-starts-2026-12-17","import-export-prices-2026-12-17","industrial-production-2026-12-16","intl-transactions-q3-2026-12-18","japan-cgpi-2026-12-10","japan-cpi-2026-12-18","mtis-2026-12-16","mts-november-2026-12-10","nahb-hmi-2026-12-16","opex-2026-12-18","pending-home-sales-2026-12-17","pjm-capacity-auction-2026-12","ppi-2026-12-15","puct-batch-zero-report-open-meeting-2026-12-17","qss-q3-2026-12-10","retail-sales-2026-12-16","russell-reconstitution-2026-12-11","sp-rebalance-reference-close-2026-12-11"],"screenStreak":0,"blocked":[]} -->

## At a glance

**TL;DR.** **This is the one TIC print on the calendar that might not happen, and the useful output of
this session is that the risk is now measured instead of feared — and it is smaller and differently
shaped than the proposal that filed this event believed.** Treasury's own press-release archive, read
back to 2010, gives **three appropriations lapses that covered a TIC release date, and all three moved
it — none published on schedule.** But they did not move it the same way, and the thing that separates
delay from cancellation is **runway to the next scheduled slot**, not lapse length and not position
relative to the lapse start: 2013 reopened with **22** business days left before the next slot and
published **3 business days late**; 2018-19 reopened with **15** and published **4 business days late**;
2025 reopened with **4** and the release was **cancelled outright**, folded into 11/18/2025. A missed
**2026-12-15** leaves **22 business days** before **2027-01-19** — identical to 2013's, and an ordinary
gap (9th longest of 23 on the published schedule, median 21). So the base case, *conditional on a lapse
happening at all*, is a **delayed December release, not a cancelled one**; a lapse would have to run
past roughly **2027-01-13** — 33+ days, longer than 2013's 16 — to reach the merge zone. That
**corrects the premise this event was proposed under** ("the same relative position 2025-10-16 held when
it was cancelled"): position is not the mechanism. **The date is now `confirmed`** — Treasury's December
row reads 15 for the monthly *and* 15 for the quarterly cut, and the page's own 11th-business-day rule
lands on 12-15 **exactly** (offset +0) — but `confirmed` covers the *scheduled* date only, and the same
page carries the notice that a closure revises it. On the tape, the second thing this session owns: the
**quarterly-cut bucket is December's, and it is the one bucket whose "quiet" does not replicate.**
Extending the release sample from n=29 to **n=41** (2023-03 → 2026-08, the sibling's numbers reproduced
to the decimal first), quarterly-cut months run |Δ10Y| **3.57bp vs 4.45bp for an ordinary session
(p=0.10)** and **4.18bp for a mid-month matched control (p=0.28)** — not significant either way — while
the plain months that drive the November sibling's finding hold up (**2.93bp, p=0.008 / p=0.038**). No
pair of buckets separates from another (qtr vs plain p=0.40). And this print cannot test any of it: PPI
prints the same morning and **retail sales lands on the scored session, 12-16**. `symbols: []`, `low`
tier, no macro-keyed house playbook. Nothing here is a trade.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-98) | **Stand aside** | High | `symbols: []`, `low` tier, no macro-keyed playbook, and the release's own next-session effect is a *quieting* that this session's extended sample (n=41) weakens rather than strengthens — 3.54bp vs 4.45bp all-sessions, but only 4.18bp against a mid-month control (p=0.09) | Any TIC release between now and **2026-12-15** whose next session moves the 10-year more than **12bp** — ~3σ of the extended distribution (sd 3.93bp); the three such releases in the window are **2026-09-16**, **2026-10-16** and **2026-11-18** |
| This week | **Stand aside; nothing about this print resolves inside 98 days** | High | The reference month has not even *begun* — October 2026 closes 2026-10-30, 52 days out — so every content claim here is conditional on an input that does not exist yet; the corridor's live forks this week are CPI **2026-09-11** and the FOMC **2026-09-16** | The 30-year closing **above 5.40%** on the Treasury par curve on or before **2026-09-16** — 15bp above 09-08's **5.25%** and 9bp above the 2026 high (5.31%, 08-17) — which would mean the long end is repricing term premium hard enough that foreign-demand prints get read live |
| This month | **Watch the funding fight, not the print — and watch it for a date, not a direction** | Medium | The existence branch is settled by **`cr-expiry-2026-12-11`**, whose own ledger declines to inherit an aversion prior and calls the December branch genuinely open; the release's exposure is **2 business days** past the expiry, the shallowest of any precedent | An FY2027 full-year appropriation or a further CR enacted **on or before 2026-12-11** — which retires this entire leg and makes 12-15 an ordinary quiet null like its three siblings |
| This quarter | **If a lapse does run through 12-15, expect a late release rather than a cancellation, and say so before the fact** | Medium | Runway, not lapse length, separated the three precedents: ≥15 business days to the next slot ⇒ published late (2013, 2019); 4 ⇒ cancelled (2025). A missed 12-15 leaves **22**, matching 2013 exactly | October-2026 data arriving **merged into the 2027-01-19 release** rather than under its own date (**FT-tic-monthly-2026-12-15-2**), which would say runway is not the mechanism and lapse length is |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never initiate on this print.** `symbols: []`, `low` tier, no macro-keyed playbook (S1/S2/E1/S3/S4 + G1 are symbol/earnings-keyed), 16:00 ET publication after the cash close, six-week-old data.
- **The existence base rate (dated, primary, new to this calendar).** Three lapses have covered a TIC release date; **3 of 3 moved it**. 2013 → published **10/22/2013**; 2018-19 → published **01/31/2019**; 2025 → **cancelled**, merged into 11/18/2025. Read from Treasury's own per-year press archive, fetched 2026-09-08.
- **The mechanism that decides delay vs cancellation is runway.** Business days from reopening to the next scheduled slot: **22 → late**, **15 → late**, **4 → merged**. A missed 12-15 leaves **22**. Registered **FT-tic-monthly-2026-12-15-2**.
- **`confirmed` covers the schedule, not the occurrence.** Treasury's page: *"When Federal Government offices in Washington D.C. are closed on a release date, that date will be revised after offices reopen."* Registered as **FT-tic-monthly-2026-12-15-1**.
- **The quarterly-cut test, and its honest null.** December is a Mar/Jun/Sep/Dec release (derivatives + nonbanking claims). On n=41: |Δ10Y| **3.57bp (n=14)** vs other releases **3.51bp** (t=+0.08) — indistinguishable — and vs an ordinary session **4.45bp** at only **p=0.10**. The extra data buys no tape.
- **What that does to the November sibling's finding, stated rather than buried.** Its non-revision bucket (2.55bp, p=0.0002) is reproduced exactly in its own window; splitting that bucket shows the effect is carried by the **plain** months (2.93bp, p=0.008 extended), not by December's. No pair of buckets separates (qtr vs plain **p=0.40**).
- **This print cannot test the null either (structural, decided today).** 12-15 carries **PPI at 08:30**; the scored session **12-16** carries **retail sales at 08:30** plus industrial production, MTIS and NAHB. Of four TIC releases on this calendar, exactly one — **2026-10-16** — is cleanly testable. Registered anyway as **FT-tic-monthly-2026-12-15-3**, with the contamination stated in the row.
- **The content call is doubly conditional and is therefore not made.** October 2026 has not started. The model reproduces at `valchg% = 0.0806 − 0.04156 × Δ10Y`, **R² 0.9496** on n=41 months, with a last-12 residual drift of **−0.215pp**; the conditional map is in leg 5 and licenses nothing.
- **The structural gauge, next observation (registered).** Official bills vs bonds & notes, y/y against the **October 2025** baselines **$386.0bn** and **$3,480.4bn** — **FT-tic-monthly-2026-12-15-4**, the sequel to 10-16's FT-4 and 11-18's FT-4 on a later month.

## Initial research

### The question

Will the TIC monthly release publish on 2026-12-15 at all — it is the first release in this calendar
exposed to an appropriations lapse — and if it does, does the quarterly derivatives/nonbanking cut that
rides with it carry anything the three siblings' nulls did not already settle?

### One-line verdict

The date promotes to `confirmed` and the existence risk is real but smaller and differently shaped than
this event was proposed under — three-for-three, every lapse has moved a TIC release, but **runway to the
next slot**, not lapse length or calendar position, decided delay versus cancellation, and December 2026
has 2013's runway rather than 2025's — while the quarterly cut turns out to be the one release bucket
whose measured "quiet" does not survive a longer sample, which is a refinement of the November sibling's
result and still not a trade.

### Method

Sourced web research per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) (macro-print mode — no
symbol instruments exist for this kind; `symbols: []`). Primaries fetched **direct** this session
(2026-09-08, plain curl, HTTP 200 unless noted): Treasury's TIC release-dates table; the TIC
press-releases-by-topic index **including its per-year archive blocks back to 2010**, which is the source
nobody in this series had opened and is where legs 2 and 3 come from; the live data files
`slt_table1.txt`, `slt_table3.txt` and `slt_table5.txt` from `ticdata.treasury.gov`; Treasury's daily par
yield curve CSVs for 2023–2026; and CBOE's own `VIX_History.csv` and `VIX3M_History.csv`. Every statistic
was **recomputed from those files**. Where a figure matches a sibling ledger it is an independent
reproduction and is stated as one; where it differs, the difference is the finding. Shutdown start/end
dates are cited to this repo's own funding ledgers rather than re-derived. `probe-ref.blocked` is empty:
no cited source failed.

### Leg 1 — the date · **SUPPORTED**, and promoted `estimate` → `confirmed`

Treasury's release-dates table puts December's row at **15** in the *Monthly* column and **15** again in
the *Quarterly* column — "data on nonfinancial firms, derivatives, portfolio claims and liabilities at
end of previous quarter" — with **31** in the separate gross-external-debt column, all under the page
header *"All data releases occur at 4 p.m. Washington, D.C. time"*. Reference month **October 2026** by
the page's stated 1.5-month lag. So unlike the November sibling, this is a *double* release: the monthly
press release plus the Q3-2026 derivatives and nonbanking cut, which the page's own notes place in
"March, June, September, and December".

The mechanical corroboration is the strongest available. The page's published rule is *"the 11th business
day plus 0 to 3 days"*. Computed with **federal holidays excluded** — the convention Treasury's own
closure notice implies — the 11th business day of December 2026 is **2026-12-15 exactly**, offset **+0**.
Recomputed across all **24** published 2026 and 2027 dates, that convention lands in-window **22** times
and hits **9** exactly; the two violations (2026-01-15 and 2026-07-14) both fall *earlier* than the rule's
floor, so a date sitting inside the window is never one of the failure modes.

Promotion follows [`mts-october-2026-11-12`](mts-october-2026-11-12.md) and the three TIC siblings: one
named Treasury primary plus independent mechanical corroboration. The `estimate` ground the proposal cited
was this lane's **no-self-confirm** limit — the entry was discovered by the `tic-monthly-2026-10-16`
sweep, not researched. That is cleared here.

**One caveat that this event, uniquely, has to state out loud.** `confirmed` means *this is Treasury's
published date*. The same page carries the standing notice *"When Federal Government offices in
Washington D.C. are closed on a release date, that date will be revised after offices reopen"* — and legs
2 and 3 are about exactly that. The label describes the sourcing, not the occurrence; the occurrence has
its own forward test.

### Leg 2 — has a funding lapse ever actually moved a TIC release? · **SUPPORTED**, three for three

This is what the event was created to answer, and nobody had opened the source that answers it. The TIC
press-releases page carries, below the recent list, a **per-year archive** giving every monthly release
date back to 2010, laid out as *"Data for month of: Dec Nov Oct Sep Aug July June May Apr Mar Feb Jan"*.
Read against the three appropriations lapses in that span:

| Lapse | Length | Slot exposed | Adjacent-year slots | Actual | Outcome |
|---|---|---|---|---|---|
| 2013-10-01 → **10-17** | 16 days | Aug-2013 data, mid-October | 10/16, 10/18, 10/16 | **10/22/2013** | published **3 business days** after reopening |
| 2018-12-22 → **2019-01-25** | 35 days | Nov-2018 data, mid-January | 01/17, 01/16, 01/19 | **01/31/2019** | published **4 business days** after reopening |
| 2025-10-01 → **11-12** | 43 days | Aug-2025 data, **10/16/2025** | — | **none** | **cancelled**; folded into 11/18/2025 |

Three lapses, three moved releases, **zero on-schedule publications**. That is a stronger statement than
the October sibling's, which had only the 2025 case and read it as "worse than flagged". It is also, on
its own, the least useful half of the finding — because "it will move" says nothing about *how*.

The 2025 case is documented in Treasury's own words in press release **sb0317**, quoted by the October
sibling: *"data for August (delayed by the partial shutdown of the federal government) and September
2025."* Note what that sentence concedes — even the cancelled release's **data** survived; what vanished
was the release *date*. Lapse start and end dates are taken from this repo's
[`government-funding-deadline-2026-09-30`](government-funding-deadline-2026-09-30.md) and
[`cr-expiry-2026-12-11`](cr-expiry-2026-12-11.md) ledgers rather than re-derived here.

### Leg 3 — what actually separates a delay from a cancellation · **REFUTED** (the proposal's premise)

The proposal that created this event reasoned by **position**: 2026-12-15 "sits FOUR DAYS inside the lapse
window — the same relative position 2025-10-16 held when it was cancelled." Position is not the mechanism,
and the three precedents say so cleanly. Measure instead the **runway** — business days from the day
offices reopened to the *next already-scheduled* release slot:

| Case | Reopened | Next scheduled slot | Runway | Outcome |
|---|---|---|---|---|
| 2013 | 10-17 | 11/18/2013 | **22 bd** | published late (10/22) |
| 2018-19 | 01-25 | 02/15/2019 | **15 bd** | published late (01/31) |
| 2025 | 11-12 | 11/18/2025 | **4 bd** | **merged** into the next slot |

The reading is mechanical and needs no story: when reopening leaves enough working days before the next
slot, Treasury publishes the skipped release under its own date a few days after coming back; when it
does not, the skipped month is absorbed. Lapse *length* only matters because a longer lapse is more likely
to eat the runway — 2018-19 was the second-longest of the three and still produced a delay, because it
reopened with three weeks to spare.

**Apply it to December 2026.** A missed 12-15 leaves **22 business days** before **2027-01-19** — exactly
2013's runway, and five times 2025's. Two checks keep this honest. First, the gap is **not special**: at
22 business days it ranks 9th of the 23 consecutive gaps on the published 2026-27 schedule, median 21 —
so this is an ordinary slot, not a lucky one, which is the stronger version of the claim. Second, the
threshold is datable. A lapse beginning 2026-12-12 would have to run past roughly **2026-12-28** to cut
the runway below 2019's 15 business days, and past roughly **2027-01-13** — **33+ days**, longer than
2013's 16 and approaching 2018-19's 35 — to reach the ≤4-business-day zone where 2025's merge happened.

And the exposure itself is the shallowest on record: 12-15 is **2 business days** past the PL 119-103
expiry (12-11 Friday → 12-14 → 12-15), where every precedent slot sat 10+ business days deep in a running
lapse. That cuts both ways and is stated as such: no precedent tests a day-2 exposure, so the 3-for-3 base
rate is evidence that *a running lapse moves the release*, not evidence about how quickly one starts. A
lapse that begins and is resolved inside a weekend would leave 12-15 untouched, and there is no
observation of that either.

Whether a lapse happens at all is not this document's question. [`cr-expiry-2026-12-11`](cr-expiry-2026-12-11.md)
owns it, declines to inherit its September sibling's aversion prior, and calls the December branch
genuinely open on the 2018-19 lame-duck analogue. This ledger takes that as given and answers only the
conditional.

### Leg 4 — does the quarterly cut move the tape? · **REFUTED** (the claim that it does)

Reproduced before extended, in both directions. The sibling window (2024-03-19 → 2026-08-17, n=29) gives
next-session **Δ10Y +0.86bp, sd 3.41, t=+1.36** and **Δ30Y +0.79bp, t=+1.44** — the September and October
ledgers' figures to the decimal, from an independent rebuild of the release list off the press index.
The November sibling's sharper result reproduces too: non-revision releases **2.55bp (n=20)** against
**3.94bp** for all 617 sessions in its window (**t=−3.67, p=0.0002**) and **3.81bp** for a day-of-month
15–21 mid-month control (**t=−2.88, p=0.004**; its own control definition gave 3.78bp).

The extension this event licenses is twofold: a **longer sample** — the per-year archive plus the 2023 par
curve add twelve releases, giving **n=41 from 2023-03-15** — and a **three-way** partition instead of two,
because December belongs to neither of the buckets the siblings tested. Revision months are Jan/Apr/Jul/Oct;
the quarterly derivatives/nonbanking cut is Mar/Jun/Sep/**Dec**; Feb/May/Aug/Nov are plain.

| Cut (n=41 window) | n | mean \|Δ10Y\| | vs all sessions (4.45bp) | vs mid-month control (4.18bp) |
|---|---|---|---|---|
| Revision (Jan/Apr/Jul/Oct) | 13 | **4.15bp** | t=−0.59, p=0.56 | t=−0.05, p=0.96 |
| **Quarterly cut (Mar/Jun/Sep/Dec)** | 14 | **3.57bp** | t=−1.65, **p=0.10** | t=−1.07, **p=0.28** |
| Plain (Feb/May/Aug/Nov) | 14 | **2.93bp** | t=−2.66, **p=0.008** | t=−2.08, **p=0.038** |
| All TIC releases | 41 | 3.54bp | t=−2.78, p=0.005 | t=−1.69, p=0.09 |

Three honest readings, in order of what they cost:

1. **The quarterly cut buys no tape at all.** Against the other 27 releases it is **+0.05bp, t=+0.08** —
   about as null as a comparison gets. A release that adds a full quarter of derivatives and nonbanking
   data is indistinguishable from one that does not.
2. **The November sibling's finding survives, but it is not December's.** Its "non-revision releases are
   quiet" bucket splits into a **plain** half that holds up on the longer sample (p=0.008 / p=0.038) and a
   **quarterly-cut** half that does not (p=0.10 / p=0.28). The claim was never wrong; the bucket was just
   coarser than the mechanism it named.
3. **No pair of buckets separates from another.** qtr vs plain **p=0.40**; qtr vs rev **p=0.42**. The
   ranking rev > qtr > plain is stable across both windows, and stable is not significant on these n's.

The through-line across the four ledgers is now one sentence: **the only claim that survives both window
extension and a matched control is that TIC next-sessions are somewhat quieter than an ordinary session,
and the November sibling already named the reason — TIC is scheduled the day *after* the mid-month
CPI/PPI/retail-sales cluster.** Extending the sample halves the all-releases effect against that control
(p=0.005 → p=0.09), which is what should happen to a calendar artifact when you stop measuring it against
the wrong baseline.

**December's own three observations, for completeness and for their warning.** 2023-12-19 → **−7.0bp**,
2024-12-19 → **−5.0bp**, 2025-12-18 → **+4.0bp**: mean |Δ| **5.33bp**, the loudest month cut on the board
— on **n=3**, and 2024's scored session was **two sessions after the hawkish 2024-12-18 FOMC**. That is a
December-FOMC artifact, not a December-TIC one, and 2026 does not share it: the FOMC is **2026-12-09**,
five sessions before the scored 12-16.

### Leg 5 — what October will show, and why this session declines to say · **MIXED**

The model reproduces exactly. Regressing the Grand Total reported long-term Treasury valuation change (as
a percent of the prior month's long-term holdings) on the month-end Δ10Y across **41 months (2023-02 →
2026-06)**:

```
valchg% = 0.0806 − 0.04156 × Δ10Y(bp)      n=41   R² = 0.9496   residual sd = 0.250pp   t(slope) = −27.1
```

Identical to five decimal places to what the September, October and November ledgers each fit
independently, with an implied duration of **4.16**. The intercept instability they measured reproduces
too — **+0.0806%** (n=41) → **+0.0007%** (24) → **−0.0961%** (18) → **−0.1324%** (12) — as does the drift:
last-twelve-month residuals average **−0.215pp** and are negative in **10 of 12**. One number this session
can sharpen: June 2026's long-term Treasury base is **$7,873bn** exactly, where the October sibling worked
from an estimated ~$7,800bn.

**And that is where the content call stops, deliberately.** The November sibling registered conditional
model tests because its reference month was open with 22 days to run. Mine has not **started**: October
2026 begins 22 days from now and closes **2026-10-30**, 52 days out. A prediction keyed to a Δ that will
be drawn from a 44-month distribution with sd ~25bp, on an input that does not yet exist, is a coin flip
dressed as a forecast. So this leg publishes the **map** and registers nothing from it:

| Month-end Δ10Y for October 2026 | full-sample model | last-18 model |
|---|---|---|
| −20bp | +0.91% | +0.80% |
| −10bp | +0.50% | +0.35% |
| 0bp | +0.08% | −0.10% |
| +10bp | −0.34% | −0.54% |
| +20bp | −0.75% | −0.99% |

Three of this event's four pulses land after October closes. The first one that can read a fixed Δ should
register the band; today's cannot, and saying so is the call.

### Leg 6 — the structural read, and a correction to how it has been framed · **MIXED**

The headline figures reproduce exactly: over the twelve months to June 2026 total foreign Treasury
holdings rose **+$205.4bn** while foreign **official** holdings fell **−$114.4bn**, dropping the official
share **42.80% → 40.63%**; official **bills** fell **−$42.0bn (−10.4%)** against **bonds & notes**
**−$72.5bn (−2.1%)**. The bill line remains the only mark-free series on the page.

The correction is in the *shape* of that −10.4%, which no ledger in this series had decomposed. Read
Table 5's twelve monthly bill deltas rather than its endpoints:

```
+7.4  +1.6  −40.3  +14.7  −0.4  +2.9  +19.3  +45.5  −9.6  +13.6  −61.1  −35.6      (sum −42.0)
```

Bills **peaked at $457.3bn in April 2026** — **above** the year-ago $402.6bn — and the entire y/y decline
is three months: September 2025 (−$40.3bn) and May–June 2026 (−$96.7bn combined). The monthly delta has
**sd $29.4bn** on a mean of −$3.5bn. So "reserve managers are running down cash" is a defensible reading
of the last two prints and is **not yet a five-month trend**; the level was making new highs four months
before the window closed. This sharpens rather than contradicts the October sibling's leg 5 — its
April→June arithmetic is exactly right — and it sets the bar the next observation has to clear, which is
what a forward test is for. Recorded here, not edited there: rows are append-only and another event owns
that document.

Registered as **FT-tic-monthly-2026-12-15-4**, the relative test rather than a level test, against the
**October 2025** baselines **$386.0bn** (bills) and **$3,480.4bn** (bonds & notes) — a direct sequel to
10-16's FT-4 (August baselines) and 11-18's FT-4 (September baselines) on a later month.

### Leg 7 — honest limits

- **Three observations decide the runway model.** Legs 2 and 3 rest on n=3 lapses. The pattern is clean
  and mechanical, and it is still three points; it is written as a forward test and a kill switch, never
  as a probability. A fourth observation would be the first real test of it.
- **No precedent tests a day-2 exposure.** Every lapse-exposed slot on record sat 10+ business days into
  a running lapse. December 2026's sits at business day 2. That asymmetry cuts toward a shorter
  disruption and is unmeasured in either direction.
- **The reference month does not exist yet.** Every October-2026 figure in leg 5 is a map, not a
  forecast, and nothing in this document keys an action to one.
- **The tape test is contaminated and is registered anyway.** 12-15 carries PPI at 08:30 and the scored
  session 12-16 carries retail sales at 08:30. A >12bp move on 12-16 will more likely be retail sales
  than TIC; the row says so, and a kill on it will be read with that caveat rather than as evidence TIC
  started mattering.
- **Slot-gap arithmetic uses computed federal holidays.** Business-day counts exclude the 5 U.S.C. 6103
  holidays computed from statute (including Christmas 2026-12-25 and MLK 2027-01-18), not a published
  Treasury closure list; a Treasury-specific closure the statute does not name would shift a count by a
  day and none of the conclusions by more than that.
- **Custodial mis-attribution.** Treasury's Table 5 note: securities in overseas custody accounts *"may
  not be attributed to the actual owners"*. The official/private and bills/coupons splits are more robust
  than any country line; no country-level claim is made.
- **No consensus, no whisper.** Searched, not asserted — TIC carries no sell-side forecast distribution,
  which is part of why a surprise cannot be priced.
- **A primary's own typo, corrected by sequence.** Treasury's press index lists *"01/19/2023 — TIC Data
  for November 2023"*; the real date is **2024-01-19**, confirmed independently by the per-year archive
  block, which places Nov-2018 data at 01/31/2019 and Nov-2019 data at 01/16/2020 in the same column.
  Corrected by position and stated, as the October sibling did.
- **`confirmed` covers the date and nothing else.** Not the occurrence, not the content, not the bill
  call. No house playbook is macro-keyed in any case.

## Stance & kill switches

**Stance (initial, 2026-09-08).** **Stand aside on every horizon; the output of this document is a dated
conditional, not a position.** The date is `confirmed` off Treasury's own December row plus an
11th-business-day rule that hits it exactly and validates on 22 of 24 published dates — but `confirmed`
describes the schedule, and this is the one TIC print whose schedule has a live threat. That threat is
now **measured**: three appropriations lapses have covered a TIC release date and **all three moved it**,
yet the variable that decided *how* was runway to the next scheduled slot (22 and 15 business days →
published late; 4 → cancelled), not lapse length and not the position this event was proposed under. A
missed 2026-12-15 leaves **22 business days** before 2027-01-19, matching 2013 exactly, so the honest
conditional is **delay, not cancellation**, with a lapse needing to run past ~2027-01-13 to change that.
On the tape the print stays a null, and this session's contribution is a *narrowing* rather than a new
signal: the quarterly-cut bucket December sits in is the one bucket whose measured quiet does not survive
extending the sample to n=41 (p=0.10 against an ordinary session, p=0.28 against a mid-month control),
while the plain months carrying the November sibling's result do. The content call is withheld on
purpose — October 2026 has not begun.

**Kill switches** — any one of these forces a re-assessment, not a trade:

1. **The release does not publish on 2026-12-15** (**FT-tic-monthly-2026-12-15-1**). The primary branch
   is a funding lapse; a Washington D.C. closure for any other reason fires it too, per Treasury's own
   notice.
2. **A lapse runs through 12-15 and the October data is merged into 2027-01-19 rather than published
   under its own date** (**FT-tic-monthly-2026-12-15-2**) — which kills the runway model at its first
   real test and says lapse length, not runway, is the mechanism.
3. **Funding is resolved on or before 2026-12-11.** Legs 2 and 3 collapse to a footnote and this becomes
   an ordinary quiet null; the document should be reassessed *down*, not merely left standing.
4. **The null breaks on the contaminated date.** |Δ10Y| on **2026-12-16** exceeds **12bp**
   (**FT-tic-monthly-2026-12-15-3**) — ~3σ of the extended n=41 distribution (sd 3.93bp). Read against
   the 08:30 retail-sales print before it is read against TIC.
5. **The bill drawdown reverses.** Official **bonds & notes** fall faster in y/y percentage terms than
   official **bills** on 2026-12-15 (**FT-tic-monthly-2026-12-15-4**), or bills print back **above
   $410bn** — either would say the April-2026 peak was the level and May–June was the anomaly, which is
   the reading leg 6 opens the door to.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-08 | D-98 | Initial research banked (above). **Canonical `<id>.json` written from the one existing proposal** (`from-tic-monthly-2026-10-16`), which it now shadows. **Date PROMOTED `estimate` → `confirmed` (`TSY:`)**: Treasury's December row reads **15 monthly + 15 quarterly** (derivatives, nonbanking claims/liabilities) with gross external debt separately on the 31st, and the page's own "11th business day plus 0 to 3 days" rule with federal holidays excluded lands on **2026-12-15 exactly (offset +0)**, a convention scoring **22/24 in-window, 9/24 exact** across all published 2026-27 dates. No-self-confirm cleared by this event's own session re-fetching. `confirmed` is stated to cover the **schedule only** — the same page carries the closure-revision notice. **Finding 1 — the existence base rate, from a source nobody in this series had opened.** The press index's **per-year archive back to 2010** gives every monthly release date; against the three appropriations lapses in that span: **2013** (16d, reopened 10-17) — the mid-October slot that hit 10/16-10/18 in adjacent years landed **10/22/2013**, 3 business days after reopening; **2018-19** (35d, reopened 01-25) — the mid-January slot that hit 01/16-01/19 in adjacent years landed **01/31/2019**, 4 business days after; **2025** (43d, reopened 11-12) — **10/16/2025 cancelled**, folded into 11/18/2025 (sb0317, verbatim). **Three for three; none published on schedule.** **Finding 2 — the load-bearing one: the proposal's premise is REFUTED.** It reasoned by position ("four days inside the lapse window — the same relative position 2025-10-16 held"). The variable that actually separates the three is **runway to the next scheduled slot**: **22 bd → late**, **15 bd → late**, **4 bd → merged**. A missed 12-15 leaves **22 bd** before 2027-01-19 — 2013's exactly — and that gap is **ordinary, not lucky** (9th of 23 on the published schedule, median 21). Datable threshold: a lapse must run past ~**2026-12-28** to drop under 2019's runway and past ~**2027-01-13** (33+ days) to reach 2025's merge zone. Exposure is **2 business days** past the CR expiry, the shallowest on record, and **no precedent tests a day-2 exposure** — stated as an unmeasured asymmetry, not a comfort. Registered **FT-…-12-15-1** (publishes on 12-15) and **-2** (delay, not merge, if a lapse runs). **Finding 3 — the quarterly-cut test, and what it does to the November sibling.** Release list rebuilt from the archive and extended to **n=41 (2023-03-15 → 2026-08-17)**; the sibling window reproduces to the decimal (**+0.86bp, sd 3.41, t=+1.36**; Δ30Y +0.79, t=+1.44) as does 11-18's non-revision result (**2.55bp, n=20, t=−3.67, p=0.0002** vs all sessions; **t=−2.88, p=0.004** vs a dom-15-21 control at 3.81bp). Three-way split on n=41: revision **4.15bp (n=13)**, **quarterly-cut 3.57bp (n=14)**, plain **2.93bp (n=14)**, all sessions **4.45bp**, mid-month control **4.18bp**. Quarterly-cut vs other releases **+0.05bp, t=+0.08** — no tape at all from a full extra quarter of data; vs an ordinary session only **p=0.10** (control **p=0.28**), while plain holds at **p=0.008/0.038**. **No pair of buckets separates** (qtr vs plain p=0.40). So 11-18's bucket was coarser than the mechanism it named, and the only claim surviving both extension and control is that TIC next-sessions are mildly quiet because they sit the day *after* the mid-month cluster — all-releases p drops 0.005 → 0.09 against the control. December's own n=3 (−7.0, −5.0, +4.0; mean |Δ| 5.33bp) is the loudest month cut but is a **December-FOMC artifact** — 2024's scored session was 2 sessions after the hawkish 12-18 FOMC; 2026's FOMC is 12-09, five sessions clear. **Finding 4 — this print cannot test any of it.** 12-15 carries **PPI 08:30**, and the scored session **12-16** carries **retail sales 08:30** + industrial production + MTIS + NAHB. Of four TIC releases on this calendar exactly one (**10-16**) is cleanly testable. **FT-…-12-15-3** registered anyway at a 12bp kill (~3σ, sd 3.93) with the contamination in the row. **Finding 5 — the content call is withheld, deliberately.** Model reproduces (`valchg% = 0.0806 − 0.04156 × Δ10Y`, **R² 0.9496**, sd 0.250pp, duration 4.16; intercept +0.0806 → +0.0007 → −0.0961 → −0.1324 by window; last-12 residual **−0.215pp**, negative 10/12). June-2026 base sharpened to **$7,873bn** exactly (10-16 estimated ~$7,800bn). But October 2026 **has not begun** — it closes 2026-10-30, 52 days out, on a Δ drawn from a 44-month sd ~25bp — so leg 5 publishes a conditional map and registers **nothing**; the first pulse after 10-30 should register the band. **Finding 6 — the bill story decomposed, and it is thinner than framed.** y/y reproduces (official **bills −$42.0bn/−10.4%** vs **bonds & notes −$72.5bn/−2.1%**; share 42.80% → 40.63%), but the twelve monthly deltas show bills **peaked at $457.3bn in April 2026, above the year-ago $402.6bn**, with the whole decline in Sept-2025 (−40.3) plus May-June 2026 (−96.7); monthly sd **$29.4bn**. So "running down cash" is two prints, not a five-month trend — a sharpening of 10-16's leg 5, recorded here and not edited there. **FT-…-12-15-4** registered as the relative test vs the **October 2025** baselines **$386.0bn / $3,480.4bn**. **Adjacency sweep.** *Peers:* n/a (`symbols: []`). *Macro:* the corridor is dense — **27** tracked events within ±5 days, including **CPI 12-10**, the **CR expiry 12-11** (twice-filed), **PPI on this very date**, **retail sales 12-16** and **opex 12-18**; the FOMC (12-09) and the ECB (12-17) bracket it. *Vol:* **VIX 14.53**, VIX3M **17.61** (2026-09-04 CBOE cash closes — 09-07 was the Labor Day closure and CBOE's 15.30 row for it is a global-hours calculation, quoted as neither; no 09-08 row posted at fetch time). 10Y **4.80%**, 30Y **5.25%**, 2Y **4.39%** (09-08 par curve, this session's own fetch — fresher than the siblings' 09-04 readings). Baseline set; nothing to diff against yet. *Geopolitical/policy:* the FY2027 funding fight **is** this document's subject; the branch itself is owned by `cr-expiry-2026-12-11`, which declines to inherit an aversion prior on the 2018-19 lame-duck analogue, and this ledger answers only the conditional. *Event tape:* no consensus distribution exists for TIC. **New dated adjacencies: NONE proposed, and that is a finding.** Two candidates were found and both declined on precedent: the **2026-12-31** quarterly U.S. gross external debt cut (no press release, 16 days out — outside the corridor; the same call `tic-monthly-2026-10-16` recorded) and the **2027-02-26** preliminary Report on Foreign Portfolio Holdings of U.S. Securities (a different series on a yearly cadence — the call both 09-16 and 10-16 made about its October counterpart). `tic-monthly-2027-01-19` already exists as a proposal from the 11-18 sweep; re-proposing it would duplicate. **Blocked fetches:** none — `probe-ref.blocked` is empty; every figure is from a Treasury or CBOE primary, with shutdown start/end dates cited to this repo's own funding ledgers rather than re-derived. | — (stance set) | 2026-10-08 (`low:15+`, every 30d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-<this-event-id>.json` (`status: "estimate"`) in the
same PR — your own file, never another event's canonical one (#1717). Close-out fills `## Outcome` below from re-run instrument
data (cache busted first), never from memory — after which this doc goes quiet.
