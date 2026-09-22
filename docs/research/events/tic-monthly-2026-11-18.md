# Treasury International Capital (TIC) monthly release (September 2026 data) — the non-revision control edition — tic-monthly-2026-11-18

**Kind:** macro-print · **Date:** 2026-11-18 (confirmed, TSY: home.treasury.gov/data/treasury-international-capital-tic-system/release-dates-of-tic-data, re-fetched direct 2026-09-08, promoted from estimate this session — see leg 1) · **Impact:** low
**Last assessed:** 2026-09-08
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"low:15+","adjacentIds":["advance-services-q3-2026-11-19","apec-leaders-shenzhen-2026-11-18","fomc-minutes-2026-11-18","housing-starts-2026-11-18","import-export-prices-2026-11-17","industrial-production-2026-11-17","japan-cpi-2026-11-20","msft-ignite-2026-11-17","mtis-2026-11-17","nahb-hmi-2026-11-17","opex-2026-11-20","pending-home-sales-2026-11-18","ppi-2026-11-13","retail-sales-2026-11-17","russell-recon-preliminary-2026-11-13","treasury-10y-tips-2026-11-19","treasury-20y-bond-2026-11-18"],"screenStreak":0,"blocked":[]} -->

## At a glance

**TL;DR.** **Never a trade, and — unusually — never even a test: this is the one TIC print of the three on
this calendar that cannot check its own null, and knowing that today at D-71 is the useful output.**
2026-11-18 carries **FOMC minutes at 14:00** and a **20-Year new-issue auction at 13:00**; TIC publishes at
16:00, after the cash close, and the session that would score it — **2026-11-19** — carries a **10-Year TIPS
auction**. So of this calendar's three TIC releases, exactly one is testable on the tape (**2026-10-16**) and
it is not this one. What this edition *did* deliver is the result its October sibling set up but measured
from the wrong side. October framed the split as "revision months are the only TIC releases that are *not*
unusually quiet"; testing the **other** bucket — the one this event sits in — makes it sharp:
**non-revision TIC next-sessions run mean |Δ10Y| 2.55bp (n=20) against 3.94bp for every session in the same
window (t=−3.67, p=0.0002)** and **3.78bp for a day-of-month-matched mid-month control (t=−2.74,
p=0.0062)**, while revision months are indistinguishable from both (p=0.93, p=0.73). Then the honest
mechanism, from a neighbourhood scan nobody had run: the TIC next-session is the **local minimum of its own
week** — 2.55bp against **4.45bp the session before** and 3.30bp after — because TIC is scheduled the day
*after* the mid-month CPI/PPI/retail-sales cluster. **The quiet is a calendar position, not a TIC effect**,
and a calendar position is a scheduling fact, never an edge. **The date is now `confirmed`** off Treasury's
own November row plus a business-day rule that puts 11-18 in-window under *both* holiday conventions.
Reference month **September 2026** is not yet closed (month-to-date Δ10Y **+5.0bp** through 09-08, on a
44-month distribution with sd **25.2bp**), so every model claim here is registered **conditional on the
Δ fixed on 2026-09-30**. `symbols: []`, `low` tier, no macro-keyed house playbook. Nothing here is a trade.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-71) | **Stand aside** | High | `symbols: []`, `low` tier, no macro-keyed playbook, and the release's own next-session effect is a measured *quieting* (2.55bp vs a 3.78bp matched control) that is a calendar artifact, not a direction | Any TIC release between now and **2026-11-18** whose next session moves the 10-year more than **10bp** — ~3σ of the measured TIC-next-session distribution (sd 3.41bp); the two such releases in the window are **2026-09-16** and **2026-10-16** |
| This week | **Stand aside; nothing about this print resolves inside 71 days** | High | The reference month is not even closed yet, and the corridor's live forks this week belong to CPI **2026-09-11** and the FOMC **2026-09-16**, not here | The 30-year closing **above 5.40%** on the Treasury par curve on or before **2026-09-16** — 9bp above the 2026 high (5.31%, 08-17), and 15bp above 09-08's **5.25%** — which would mean the long end is repricing term premium hard enough that foreign-demand prints get read live |
| This month | **Watch two dates that set this print's entire content, and trade neither** | Medium | **2026-09-16** publishes July data and gives the drift its first score; **2026-09-30** fixes the September month-end Δ10Y that is the sole input to every model claim registered here (MTD **+5.0bp** through 09-08) | The **2026-09-16** release printing July `for_lt_treas_valchg` **above −$76bn** — the top of FT-tic-monthly-2026-09-16-1's band — which would say the −0.218pp last-12 drift this session reproduced runs the wrong way, and FT-tic-monthly-2026-11-18-2 inherits a broken prior |
| This quarter | **Read 2026-10-16 as the only clean test in the series, and let its verdict set this one's prior** | Medium | 10-16 is the sole TIC date here that no Fed event owns (blackout 10-17, decision 10-29); 09-16 carried the decision itself and 11-18 carries the minutes plus a 20Y auction, so 10-16 alone can score the null | \|Δ10Y\| on **2026-10-19** printing **above 10bp** (FT-tic-monthly-2026-10-16-3), which would kill the null on the one uncontaminated observation and make the "quiet is scheduling" reading here untenable |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never initiate on this print.** `symbols: []`, `low` tier, no macro-keyed playbook (S1/S2/E1/S3/S4 + G1 are symbol/earnings-keyed), and the measured effect is a *quieting* — a direction-free scheduling artifact.
- **The sharp version of the null (dated, primary, this session's own computation).** Non-revision TIC next-sessions: mean |Δ10Y| **2.55bp (n=20)** vs **3.94bp** for all 617 sessions 2024-03-19→2026-09-08 (**t=−3.67, p=0.0002**) and **3.78bp** for a mid-month day-of-month-matched control (**t=−2.74, p=0.0062**). Revision months: indistinguishable from both.
- **The mechanism, named honestly.** Neighbourhood scan around the non-revision TIC next-session: offset −1 **4.45bp**, offset 0 **2.55bp**, offset +1 **3.30bp**. TIC lands the day *after* the mid-month data cluster; the trough is the calendar, not the release.
- **This print cannot test any of it (structural, decided today).** 2026-11-18 = FOMC minutes 14:00 + 20-Year new issue 13:00 + TIC 16:00; scored session 2026-11-19 = 10-Year TIPS auction. Registered as the *inverse* test, **FT-tic-monthly-2026-11-18-3** — the claim is that 11-19 breaks 2.55bp.
- **The model tests are conditional, because September is not closed.** August month-end 10Y **4.75%**; September MTD **+5.0bp** through 09-08; 44-month month-end Δ10Y sd **25.2bp**. **FT-…-11-18-1** (band ±0.35pp around the last-18 fit) and **-2** (the window discriminator) both key on the Δ fixed **2026-09-30**.
- **October tests the intercept; November tests the slope.** August's Δ10Y was exactly 0bp, so 10-16 measures the intercept alone; an ordinary September Δ restores the slope term. The pair identifies both parameters — that is this edition's actual contribution.
- **The structural gauge, next observation (registered).** Official bills vs bonds & notes, y/y against the September 2025 baselines **$371.3bn** and **$3,501.3bn**. **FT-…-11-18-4**, a sequel to 10-16's FT-4 on new data.
- **Existence risk: nil for this date.** PL 119-103 funds agencies through **2026-12-11**, three weeks past 11-18. The lapse branch that *cancelled* the October 2025 release reaches `tic-monthly-2026-12-15`, not this one.
- **The date is confirmed, the forecast is not.** `confirmed` applies to 2026-11-18 only. Every September figure here is a **model output on an unfixed input** and licenses nothing.

## Initial research

### The question

Will the TIC monthly release publish on 2026-11-18, what will the September-2026 data show, and — as the
**non-revision control** against its October sibling's annual-revision edition — does it settle the tape
question that the revision cut left half-answered?

### One-line verdict

The date promotes to `confirmed`; the control bucket turns out to carry the *stronger* statistical result
(non-revision TIC sessions are decisively quieter than a matched control, p=0.0062, where revision months
are not), but a neighbourhood scan shows the quiet is a **calendar position** rather than a TIC effect —
and this particular print can test none of it, because FOMC minutes, a 20-Year auction and a TIPS auction
own its window.

### Method

Sourced web research per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) (macro-print mode — no
symbol instruments exist for this kind; `symbols: []`). Primaries fetched **direct** this session
(2026-09-08, plain curl, HTTP 200): Treasury's TIC release-dates table (111,181 bytes); the TIC
press-releases-by-topic index; the live data files `slt_table1.txt`, `slt_table3.txt`, `slt_table5.txt` and
`mfh.txt` from `ticdata.treasury.gov`; Treasury's daily par yield curve CSVs for 2023–2026 (through
**2026-09-08**); CBOE's `VIX_History.csv` and `VIX3M_History.csv`. Every statistic below was **recomputed
from those files**. Where a figure reproduces the September or October sibling that is stated as a
reproduction; where it does **not**, the discrepancy is recorded rather than harmonised (leg 4, leg 6).
`probe-ref.blocked` is empty — no cited source failed.

### Leg 1 — the date · **SUPPORTED**, and promoted `estimate` → `confirmed`

Treasury's release-dates table puts November's monthly release on the **18th**, under the header *"All data
releases occur at 4 p.m. Washington, D.C. time"*. The Quarterly, gross-external-debt and Annual columns are
**empty** for November — this is a plain monthly release, unlike September (which carried the quarterly
nonfinancial/derivatives cut) and unlike December (which carries both the quarterly cut and, separately on
the 31st, gross external debt). Reference month **September 2026** by the page's stated 1.5-month lag,
worded on the page itself as *"data … at end of month before last."*

The mechanical corroboration, recomputed here rather than inherited. The page's published rule is *"the
11th business day plus 0 to 3 days"*. With **federal holidays excluded** — Veterans Day 2026-11-11 and
Thanksgiving 2026-11-26, and Treasury's own standing notice keys on *"when Federal Government offices in
Washington D.C. are closed"* — November 2026's 11th business day is **2026-11-17**, so the rule permits
**11-17 through 11-20** and the published date sits inside at offset **+1**.

That is weaker than October's exact **+0**, and the honest way to strengthen it is not to pretend
otherwise but to test the convention's own failure mode. Across all **24** published 2026 and 2027 dates
the holiday-aware rule lands in-window **22** times and hits **9** exactly (weekday-only: 20/24 and 5/24).
Both misses — **2026-01-15** (offset −1) and **2026-07-14** (offset −2) — fall *earlier* than the rule's
floor. **A date inside the window is never one of the observed failure modes**, so an in-window date is
corroborated by the rule even when it is not an exact hit. And 11-18 is additionally **robust to the
convention choice**: under the weekday-only reading the 11th weekday is 11-16 and the window is
11-16→11-19, which still contains 11-18. Several exact-hit dates on this schedule do not survive that
swap; this one does.

Promotion follows [`mts-october-2026-11-12`](mts-october-2026-11-12.md) and this event's own October
sibling, whose bar is **one named Treasury primary plus independent mechanical corroboration**. The
`estimate` ground the proposal cited was this lane's **no-self-confirm** limit — the entry was discovered by
the `tic-monthly-2026-10-16` sweep, not researched. That is cleared: this is the event's own session,
re-fetching independently. `TSY:` is an authorized confirmed-tier prefix, extended from auction schedule to
release schedule as `mts-august-2026-09-11`, `mts-october-2026-11-12`, `tic-monthly-2026-09-16` and
`tic-monthly-2026-10-16` already did and recorded.

### Leg 2 — the tape, from the control side · **SUPPORTED**, and it is the stronger half

The October ledger cut the 29 releases by Treasury's note (c) — Jan/Apr/Jul/Oct restate a year of history —
and found revision months at mean |Δ10Y| **4.00bp (n=9)** against **2.55bp (n=20)** for the rest,
t=+2.13, p=0.033, then correctly killed the excitement by benchmarking against an ordinary session. Its
conclusion: *"revision months are not loud; they merely stop being unusually quiet."*

That sentence contains an untested claim — that the *other* bucket **is** unusually quiet. This event sits
in that bucket, so testing it is exactly this session's job. All 29 release dates were rebuilt independently
from Treasury's press-release index (reproducing the sibling's window, 2024-03-19 → 2026-08-17, and its
figures: next-session Δ10Y **+0.86bp, sd 3.41, t=+1.36**; Δ30Y +0.79bp, t=+1.44).

| Cut | n | mean \|Δ10Y\| | vs benchmark |
|---|---|---|---|
| **Non-revision releases** (this event's bucket) | 20 | **2.55bp** | — |
| Revision releases (Jan/Apr/Jul/Oct) | 9 | 4.00bp | — |
| All sessions 2023–2026 (the sibling's benchmark) | 920 | 4.56bp | non-rev **t=−5.31, p<0.0001** |
| **All sessions 2024-03-19 → 2026-09-08** (same window) | 617 | **3.94bp** | non-rev **t=−3.67, p=0.0002**; rev t=+0.09, **p=0.93** |
| **Mid-month control** (day-of-month 15–22, in-window, TIC days removed) | 130 | **3.78bp** | non-rev **t=−2.74, p=0.0062**; rev t=+0.35, **p=0.73** |

Two things follow, and the second matters more than the first.

**The finding survives both confounds.** The sibling's 4.56bp benchmark spans 2023, a materially louder
rates regime; the same-window benchmark is **3.94bp**, and the effect survives it. TIC releases also cluster
mid-month, where CPI and the FOMC live — so a day-of-month-matched control is the right test, and the effect
survives that too at **p=0.0062**. Meanwhile the revision bucket is statistically **indistinguishable** from
both benchmarks, which sharpens the sibling's wording rather than contradicting it: the split is not
"revision months are noisy" but "**non-revision months are quiet, and revision months are ordinary**."

**But it is not a TIC effect.** A neighbourhood scan around each non-revision TIC next-session, over the
same days and the same mid-month position:

| Session, relative to the TIC next-session | mean \|Δ10Y\| (n=20) |
|---|---|
| −3 | 3.45bp |
| −2 | 4.30bp |
| **−1** | **4.45bp** |
| **0 — the TIC next-session** | **2.55bp** |
| +1 | 3.30bp |
| +2 | 3.90bp |

The TIC next-session is the **local minimum of its own week**, and the session immediately *before* it is
the local maximum — which is exactly the mid-month CPI/PPI/retail-sales cluster. TIC is scheduled on the
11th business day, i.e. the day after that cluster fires; its next session is the exhaustion day. The
honest statement is therefore: **the quiet is a calendar position TIC happens to occupy, not information
TIC fails to carry** — the two are observationally different and the neighbourhood scan separates them. It
is also, operationally, nothing: a direction-free dampening on a date `symbols: []` and `low` do not reach.

### Leg 3 — can this print test any of that? · **REFUTED**, and the refutation is the useful output

No, and it is decidable today at D-71 from the calendar this repo already carries. The corridor within
±5 days holds **17** tracked events; three of them land on or beside the release in a way that destroys the
test:

- **`fomc-minutes-2026-11-18`** — the Oct 27–28 minutes at **14:00 ET**, two hours before TIC.
- **`treasury-20y-bond-2026-11-18`** — a 20-Year **new issue** (no reopening marker on Treasury's tentative
  schedule) at the standing **13:00 ET** coupon convention, sized by the 11-12 announcement.
- **`treasury-10y-tips-2026-11-19`** — a 10-Year TIPS auction on the **scored session itself**.

TIC publishes at 16:00, after the equity cash close, so its measurable reaction is 11-19 — a session that
opens on an FOMC-minutes hangover and prices TIPS supply in the afternoon. Any |Δ10Y| observed there is
attributable to TIC only by assumption.

That completes an unlucky sweep across the whole series: **2026-09-16** carried the FOMC *decision* itself,
**2026-11-18** carries the *minutes* plus a 20-Year auction, and **2026-10-16** — sitting between blackout
start 10-17 and decision 10-29 — is the only clean one. **One of three TIC prints on this calendar is
testable, and it is not this one.** The right response is not to run a contaminated test and report it as a
null; it is to register the **inverse** claim, which the contamination makes falsifiable:
**FT-tic-monthly-2026-11-18-3** predicts 11-19 breaks the 2.55bp non-revision mean. If it does *not* — if a
session owned by FOMC minutes and TIPS supply is still as quiet as an uncontaminated TIC day — the
calendar-position explanation in leg 2 is the thing that takes damage, which is the point of pointing the
test at my own framing rather than a straw man.

One tempting pairing is worth naming and killing. A 20-Year bond prices at 13:00 and three hours later
Treasury publishes who has been buying Treasuries. That reads like a setup and is not one: TIC's data is
**six weeks stale** (September holdings, published mid-November), so it cannot inform an auction that has
already cleared, and it is published *after* it in any case. Noted as a coincidence of the release
calendar, not a signal — the same call the October ledger made about the primary-dealer agenda.

### Leg 4 — what September will show, and why it is a *slope* test · **SUPPORTED**, conditionally

Refit from the files. Regressing the Grand Total reported long-term Treasury valuation change (as a percent
of the **prior month's** long-term holdings) on the month-end Δ10Y:

```
valchg% = +0.0833 − 0.04138 × Δ10Y(bp)     n=40   R² = 0.9466   residual sd = 0.252pp   t(slope) = −26.0
```

| Fitting window | Intercept | Slope | Residual sd | Implied duration |
|---|---|---|---|---|
| 40 months (2023-03 → 2026-06) | **+0.0833%** | −0.04138 | 0.252pp | 4.14 |
| last 24 | +0.0007% | −0.04110 | 0.236pp | 4.11 |
| last 18 | **−0.0961%** | −0.04471 | 0.175pp | 4.47 |
| last 12 | −0.1324% | −0.04294 | 0.204pp | 4.29 |

Last-12 residuals average **−0.218pp** and are negative in **10 of 12** — the sibling's drift, reproduced.
The 41-month median |valchg| is **$50.2bn** and the reconciliation residual (holdings change less net
purchases less reported valuation) has sd **$26.2bn** across 40 months.

**A discrepancy, recorded rather than harmonised.** The October ledger reports this fit as **n=41**,
intercept **+0.0806%**, slope **−0.04156**, R² 0.9496, sd 0.250pp. `slt_table3`'s Grand Total series begins
**2023-02** and ends 2026-06 — 41 months — so a prior-month base leaves **40** usable observations, which
is what is fitted above. Deflating instead by the **same** month's base recovers n=41 and R² 0.9497, sd
0.248, slope −0.04125, but an intercept of **+0.0672%**. Slope, R² and residual sd agree to three decimals
under either specification, so no conclusion here changes — but **the intercept moves by up to 0.016pp with
the choice of denominator, and the sibling did not state which it used.** That is a live caveat for
`FT-tic-monthly-2026-10-16-2`, whose entire content is a sign test against **+0.081%** on an intercept
spread of 0.216pp. Recorded here, not edited there — rows are append-only and another event owns that
document.

**Why September is the slope test.** August's Δ10Y was exactly 0bp, so 10-16 measures the intercept in
isolation and cannot see the slope at all. September restores a live slope term, and the two editions
together identify both parameters — which is the real reason this "control" edition earns its place rather
than being a serial entry.

**And why every claim here is conditional.** September 2026 is not closed. August's month-end 10Y was
**4.75%**; through **2026-09-08** — five of roughly twenty-one sessions — the month-to-date Δ is **+5.0bp**
(4.75 → 4.80). Across 44 months the month-end Δ10Y has mean **+2.9bp** and sd **25.2bp** (p10 −29bp, p90
+40bp), so five sessions constrain almost nothing, and the **2026-09-16 FOMC** sits inside the remaining
window. Registering a point band on the September valuation change today would be a forecast of the
FOMC dressed as a model test. Both model forward tests are therefore written as functions of the Δ that
**fixes on 2026-09-30**: **FT-…-11-18-1** is a ±0.35pp (2σ) band around the last-18 fit, and
**FT-…-11-18-2** is the window discriminator — publish below **−0.0064 − 0.043045 × Δ** and the recent-window
model wins, at or above and the full-sample intercept survives.

### Leg 5 — the quarter-end cut this edition uniquely licenses · **checked, NOT registered**

September is a **quarter-end** reference month, and this is the first TIC print on the calendar whose
reference month is one without also being a revision edition — so the confound that would normally muddy a
quarter-end test is absent here. Two versions were run and neither earns a forward test.

**Release side.** Releases carrying a quarter-end reference month (Feb/May/Aug/Nov) run mean |Δ10Y|
**2.30bp (n=10)** against **3.37bp (n=19)** for the rest — **t=−1.67, p=0.095**. Directionally the same
story as leg 2 and not separable from it: the quarter-end release months are disproportionately
non-revision months, so this cut is largely re-reading the leg-2 split through a different label.

**Holdings side.** `slt_table5` publishes only **13 months**, and `mfh.txt` is the same window, so the
official-bill series available from a primary contains exactly **four** quarter-end months. Those four
average **−$20.7bn** month-over-month against **+$5.1bn** for the other eight — the *opposite* sign to the
window-dressing hypothesis, and entirely confounded with the downtrend (three of the four sit in the
falling stretch). **n=4 is not a finding**, and registering it would be exactly the "p=0.033 on n=9"
mistake the October ledger wrote as a kill switch rather than a call. Recorded as checked and refused.

### Leg 6 — honest limits

- **A refused test is still the right output, and it costs the series an observation.** Leg 3's conclusion
  is that 11-18 cannot score the null. That is honest, but it means the tape hypothesis rests on the single
  clean date **2026-10-16** until at least `tic-monthly-2026-12-15` — one observation is never a promotion.
- **Leg 2's control is a matched control, not an experiment.** Day-of-month matching cannot control for
  *which* releases share the calendar; the neighbourhood scan is the better evidence and it is descriptive.
  And the effect is not stable by year: non-revision mean |Δ10Y| runs 3.14bp (2024, vs 4.48 all-session),
  1.87bp (2025, vs 3.94) and 2.80bp (2026, vs 3.41). Same sign three years running, collapsing magnitude.
- **Every September figure is conditional on an input that does not exist yet.** The month-end Δ10Y fixes
  on 2026-09-30 and the 2026-09-16 FOMC sits inside the window. Nothing here is a rate forecast.
- **The base is doubly unpublished.** September's valuation change is scaled by **August's** long-term
  Treasury base, which publishes on 2026-10-16 — one release *after* the July base its October sibling
  waits on. Percentage claims are the primary form; dollar translations will be restated twice.
- **The intercept specification is ambiguous across this event and its sibling** (leg 4). Slope, R² and
  residual sd are robust; the intercept is not, by up to 0.016pp.
- **n=4 on the quarter-end holdings cut** (leg 5), and the primary publishes no longer bill history.
- **Custodial mis-attribution.** Treasury's Table 5 note: securities in overseas custody accounts *"may not
  be attributed to the actual owners"*. The official/private and bills/coupons splits are more robust than
  any country line; no country-level claim is made here.
- **No consensus, no whisper.** Searched, not asserted — TIC carries no sell-side forecast distribution,
  which is part of *why* a surprise cannot be priced.
- **A primary's own typo, reproduced independently.** Treasury's press-release index lists *"01/19/2023 —
  TIC Data for November 2023"* between the 12/19/2023 and 02/15/2024 entries; the real date is
  **2024-01-19**. Corrected by position, exactly as the October sibling did — an independent reproduction
  of that data-handling note, not an inheritance of it.
- **VIX is a CBOE primary, and it is stale by design here.** **14.53** is the 2026-09-04 cash close (09-07
  was the Labor Day closure and CBOE's file carries no 09-08 row yet); VIX3M **17.61** the same day — an
  ordinary contango, no regime signal. CBOE's 09-07 row at 15.30 is a global-hours calculation and is
  quoted as neither.
- **`confirmed` covers the date and nothing else.** No house playbook is macro-keyed in any case.

## Stance & kill switches

**Stance (initial, 2026-09-08).** **Stand aside on every horizon, and do not pretend this print can be
tested.** The date is `confirmed` off Treasury's own November row plus a business-day rule that puts 11-18
in-window under both holiday conventions, on a convention whose only two observed failures fall *outside*
the window on the early side. The substantive finding belongs to the bucket rather than the date:
**non-revision TIC next-sessions are decisively quieter than a matched mid-month control** (2.55bp vs
3.78bp, t=−2.74, p=0.0062) where revision months are ordinary (p=0.73) — which sharpens the October
sibling's wording — but a neighbourhood scan places that quiet at the **local minimum of the mid-month
week**, one session after the CPI/PPI/retail-sales cluster, so it is a **calendar position and not
information**. This particular release can adjudicate none of it: FOMC minutes at 14:00, a 20-Year new
issue at 13:00, and a 10-Year TIPS auction on the scored session. `low` tier with `symbols: []` stands at
every horizon. The document's working value is that it **pairs with 2026-10-16 to identify the valuation
model** — October tests the intercept on a 0bp month, September tests the slope on an ordinary one — and
both of its model tests are written as functions of an input that fixes on **2026-09-30**, not as forecasts
of it.

**Kill switches** — any one of these forces a re-assessment, not a trade:

1. **The model breaks in an ordinary month.** Published Grand Total `for_lt_treas_valchg` for reference
   month 2026-09 lands outside **±0.35pp** of `−0.0961 − 0.04471 × Δ` (**FT-tic-monthly-2026-11-18-1**),
   with Δ the realized month-end Δ10Y fixed 2026-09-30. Outside **±0.90pp** the one-factor model is retired
   rather than re-fit, on the rule its October sibling set.
2. **The drift was noise after all.** September prints **at or above** the two-window midpoint
   **−0.0064 − 0.043045 × Δ** (**FT-tic-monthly-2026-11-18-2**) — which would also say the last-18 window
   this ledger prefers is the wrong one, and that leg 4's intercept-specification caveat matters less than
   written.
3. **The contamination claim fails.** \|Δ10Y\| on **2026-11-19** comes in **at or below 2.55bp**
   (**FT-tic-monthly-2026-11-18-3**) despite FOMC minutes and TIPS supply owning the session — which would
   weaken leg 2's "quiet is a calendar position" reading and reopen the release-effect explanation.
4. **The retreat is duration after all.** Foreign official **bonds & notes** fall faster in percentage terms
   year-over-year than official **bills** on 2026-11-18 (**FT-tic-monthly-2026-11-18-4**), against the
   September 2025 baselines of $371.3bn and $3,501.3bn.
5. **The clean date breaks the null first.** \|Δ10Y\| on **2026-10-19** exceeds **10bp**
   (`FT-tic-monthly-2026-10-16-3`). This ledger's whole framing assumes that test passes; if it fails, the
   scheduling explanation here is untenable and this event's stance is rewritten before its own date.
6. **The date moves.** Treasury revises a release date when federal offices in Washington D.C. are closed.
   PL 119-103 funds through 2026-12-11, three weeks past this date, so no lapse branch reaches it — but a
   DC closure inside the 11-18 to 11-19 window, or a CR renegotiation that pulls the expiry *earlier*,
   reopens this.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-08 | D-71 | Initial research banked (above). **Canonical `<id>.json` written from the one existing proposal** (`from-tic-monthly-2026-10-16`), which it now shadows. **Date PROMOTED `estimate` → `confirmed` (`TSY:`)**: Treasury's release-dates table, re-fetched direct by this event's own session, reads **18** for November with the Quarterly/Annual columns empty (a plain monthly release); the page's own "11th business day plus 0 to 3 days" rule, holidays excluded (Veterans Day 11-11, Thanksgiving 11-26), gives 11-17 and a window of **11-17→11-20**, so 11-18 sits inside at **offset +1** — weaker than October's +0, but the convention's only two failures across 24 published dates (2026-01-15, 2026-07-14) both fall *earlier* than the floor, and 11-18 is in-window under the weekday-only convention too. No-self-confirm cleared by this event's own re-fetch. **Finding 1 — the control bucket carries the stronger result.** The October sibling cut revision vs other and benchmarked against all sessions 2023-26 (4.56bp); testing the OTHER bucket against the right benchmarks makes it sharp: non-revision TIC next-sessions **2.55bp (n=20)** vs **3.94bp** for all 617 sessions in the same 2024-03→2026-09 window (**t=−3.67, p=0.0002**) and **3.78bp** for a day-of-month-matched mid-month control (**t=−2.74, p=0.0062**); revision months indistinguishable from both (p=0.93, p=0.73). The honest wording is "non-revision months are quiet, revision months are ordinary". **Finding 2 — and it is not a TIC effect.** Neighbourhood scan (non-revision, n=20): offset −1 **4.45bp**, offset 0 **2.55bp**, offset +1 3.30bp. The TIC next-session is the local minimum of its own week and the session before it the local maximum — the mid-month CPI/PPI/retail cluster. TIC is scheduled the day after; the quiet is calendar position, not information. Not stable by year (non-rev vs all-session: 3.14/4.48 in 2024, 1.87/3.94 in 2025, 2.80/3.41 in 2026). **Finding 3 — the load-bearing one: this print cannot test any of it, and that is decidable today.** 2026-11-18 carries **FOMC minutes 14:00** and a **20-Year new issue 13:00**; TIC publishes 16:00 (after the cash close) so the scored session is **11-19**, which carries a **10-Year TIPS auction**. Of three TIC prints on this calendar, 09-16 had the FOMC decision, 11-18 has the minutes plus supply, and **only 10-16 is clean**. Registered as the inverse claim, **FT-…-11-18-3** (11-19 breaks 2.55bp), which points the test at this ledger's own framing. The 20Y-auction/TIC pairing is named and killed: six-week-stale data published three hours after the auction clears cannot inform it. **Finding 4 — the model, refit, and one discrepancy recorded not harmonised.** `valchg% = +0.0833 − 0.04138 × Δ10Y`, **n=40, R² 0.9466, sd 0.252pp, dur 4.14**; intercepts +0.0833 → +0.0007 (24) → **−0.0961** (18) → −0.1324 (12); last-12 residuals **−0.218pp**, negative **10 of 12**; reconciliation residual sd **$26.2bn**. The sibling reports n=41/+0.0806; `slt_table3`'s Grand Total begins 2023-02, so a prior-month base leaves 40 — deflating by the SAME month's base recovers n=41 and R² 0.9497 but an intercept of **+0.0672%**. Slope/R²/sd agree to three decimals; **the intercept moves up to 0.016pp with the denominator**, a live caveat for `FT-tic-monthly-2026-10-16-2`'s sign test against +0.081%. **October tests the intercept (Aug Δ10Y = 0bp), November tests the slope** — the pair identifies both parameters. September is NOT closed (Aug month-end 10Y **4.75%**, MTD **+5.0bp** through 09-08, 44-month Δ10Y sd **25.2bp**, FOMC 09-16 inside the window), so **FT-…-11-18-1** (±0.35pp band on the last-18 fit) and **-2** (window discriminator, midpoint −0.0064 − 0.043045Δ) are both written as functions of the Δ that fixes **2026-09-30**. **Finding 5 — the quarter-end cut, checked and REFUSED.** September is a quarter-end reference month and this edition is non-revision, so the cut is unconfounded here — but release-side gives p=0.095 and is mostly re-reading finding 1's split, and holdings-side has **n=4** (`slt_table5` and `mfh.txt` both publish 13 months): those four average **−$20.7bn** MoM in official bills vs +$5.1bn otherwise, the opposite sign to window-dressing and entirely confounded with the downtrend. Not registered. **Adjacency sweep.** *Peers:* n/a (`symbols: []`). *Macro:* the corridor's cluster is **PPI 11-13** and **retail sales 11-17** (high), with **FOMC minutes 11-18** the session's real owner — see finding 3. *Vol:* **VIX 14.53**, VIX3M **17.61** (2026-09-04 CBOE cash closes, primary — baseline set, nothing to diff against yet; 09-07 was the Labor Day closure and no 09-08 row exists in CBOE's file); 10Y **4.80%**, 30Y **5.25%**, 2Y **4.39%** (2026-09-08 par curve). *Geopolitical/policy:* **APEC leaders, Shenzhen, lands on 11-18 itself**, eight days after `us-china-tariff-truce-expiry-2026-11-10` — a venue in the corridor, not a print, and irrelevant to a six-week-stale holdings release. Funding: PL 119-103 runs to **2026-12-11**, three weeks past this date, so the branch that CANCELLED the October 2025 release reaches `tic-monthly-2026-12-15` and not this one. **Corridor: 17** tracked events within ±5 days. **New dated adjacency found → proposed in this PR:** `tic-monthly-2027-01-19` (November 2026 data; the next 2027 revision edition, 11th business day offset **+0** with New Year's Day and MLK 01-18 excluded) — the next slot nobody owns, since 2026-12-15 already carries `from-tic-monthly-2026-10-16` and a second proposal would be a competing one. **Checked and NOT proposed, with reasons:** the 2026-12-31 gross-external-debt cut (no press release, outside any corridor — the same call 09-16 and 10-16 made) and 2027-02-18 onward (serial proposing without a specific reason is not a sweep finding). **Blocked fetches:** none — `probe-ref.blocked` is empty. One data-handling note, reproduced independently rather than inherited: Treasury's press-release index carries a typo (*"01/19/2023 — TIC Data for November 2023"*, really 2024-01-19), corrected by sequence. | — (stance set) | 2026-10-08 (`low:15+`, every 30d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-<this-event-id>.json` (`status: "estimate"`) in the
same PR — your own file, never another event's canonical one (#1717). Close-out fills `## Outcome` below from re-run instrument
data (cache busted first), never from memory — after which this doc goes quiet.
