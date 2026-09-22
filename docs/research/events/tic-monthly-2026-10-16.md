# Treasury International Capital (TIC) monthly release (August 2026 data) — the annual-revision edition — tic-monthly-2026-10-16

**Kind:** macro-print · **Date:** 2026-10-16 (confirmed, TSY: home.treasury.gov/data/treasury-international-capital-tic-system/release-dates-of-tic-data, fetched direct 2026-09-08, promoted from estimate this session — see leg 1) · **Impact:** low
**Last assessed:** 2026-09-08
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"low:15+","adjacentIds":["beige-book-2026-10-14","cpi-2026-10-14","ecb-quiet-period-start-2026-10-21","fomc-blackout-start-2026-10-17","g20-fmcbg-bangkok-2026-10-15","housing-starts-2026-10-20","imf-world-bank-annual-meetings-2026-10-12","import-export-prices-2026-10-16","industrial-production-2026-10-16","mtis-2026-10-15","nahb-hmi-2026-10-19","norway-gpfg-ethics-committee-2026-10-15","opex-2026-10-16","ppi-2026-10-15","retail-sales-2026-10-15","sifma-bond-market-closure-2026-10-12","ssa-cola-2027-2026-10-14","treasury-20y-bond-2026-10-21","treasury-buyback-10y20y-2026-10-15","treasury-coupon-announcement-2026-10-15","treasury-primary-dealer-agenda-2026-10-16"],"screenStreak":0,"blocked":[]} -->

## At a glance

**TL;DR.** **Still never a trade — but this is the one TIC print of the year worth actually reading, and
the reason is arithmetic, not narrative.** August 2026's month-end 10-year was **4.75% against July's
4.75% — a change of exactly zero**, only the third |Δ| ≤ 1bp month in 41, on a 12bp intramonth range. The
valuation model that dominates every TIC headline (`valchg% = 0.0806 − 0.04156 × Δ10Y bp`, R² **0.950**,
refit independently this session and reproducing its September sibling to five decimals) therefore
collapses to its **intercept alone**: July's mark was ≈ **−$95bn** and August's is ≈ **zero**. Two
consequences. The headline holdings delta stops lying — with the mark gone, August's change is close to a
clean read on flow — and the model gets its sharpest possible test, because the four fitting windows
disagree *only* on the intercept (**+0.081%** full-sample, **−0.096%** on the last 18 months), and a 0bp
month puts that disagreement on the tape. The drift is real and measured: residuals average **−0.215pp**
over the last twelve fitted months, negative in **10 of 12**. **The date is now `confirmed`**, promoted
off Treasury's own schedule plus a business-day rule that lands on 10-16 **exactly** (offset +0) and
reproduces 22 of 24 published 2026-27 dates. **The existence risk is retired, not assumed** — the October
2025 release was not delayed but *cancelled* by the shutdown (Treasury's own words), yet PL 119-103 funds
agencies through **2026-12-11**, so this one sits inside a funded window; the exposure moves to the
December release, proposed in this PR. And the tape stays a null even on this edition: **annual-revision**
releases (Jan/Apr/Jul/Oct — October restates a year of history) run mean |Δ10Y| **4.00bp** against
**2.55bp** for other TIC releases (t=+2.13, p=0.033), which sounds like a signal until you compare it to
an ordinary session's **4.56bp**. Revision months are not loud; they merely stop being unusually quiet.
`symbols: []`, `low` tier, no macro-keyed house playbook. Nothing here is a trade.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-38) | **Stand aside** | High | `symbols: []`, `low` tier, no macro-keyed playbook, and the tape effect is a reproduced null (n=29, +0.86bp, t=+1.36) that survives the revision-month cut | Any TIC release between now and **2026-10-16** whose next session moves the 10-year more than **10bp** — 3σ of the measured TIC-next-day distribution (sd 3.41bp); the only such release in the window is **2026-09-16** |
| This week | **Stand aside; nothing about this print resolves inside 38 days** | High | The reference month is already closed and the data six weeks stale on arrival; the corridor's live forks this week belong to CPI 09-11 and the FOMC 09-16, not here | The 30-year closing **above 5.40%** on the Treasury par curve on or before **2026-09-16** — 9bp above the 2026 high (5.31%, 08-17) — which would mean the long end is repricing term premium hard enough that foreign-demand prints get read live |
| This month | **Read the September 16 sibling as this print's dress rehearsal, and read it for the model, not the headline** | Medium | 09-16 publishes July data at a modelled **−$95bn** mark; with the last-12 residual drift of −0.215pp the debiased point is nearer **−$112bn**, at or through the bottom of FT-tic-monthly-2026-09-16-1's **−$114bn/−$76bn** band | The **2026-09-16** release printing July `for_lt_treas_valchg` **above −$76bn** — the top of that band — which would say the drift measured here runs the wrong way and my August call inherits a broken prior |
| This quarter | **Watch the official bill line, which is the only mark-free series on the page** | Medium | Official Treasury bills fell **−10.4% y/y** against coupons' **−2.1%**, and −$96.7bn against −$31.7bn in April→June alone; a ~0.25-duration book carries no valuation wedge, so that move is pure flow | Foreign official Treasury **bills** printing **above $410bn** (the Aug-2025 level) in either the **2026-10-16** or **2026-11-18** release, which would say the bill runoff stalled rather than continued |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never initiate on this print.** `symbols: []`, `low` tier, no macro-keyed playbook (S1/S2/E1/S3/S4 + G1 are symbol/earnings-keyed), and a null that this session reproduced from primaries rather than inherited.
- **The null, reproduced (dated, primary).** n=29 releases 2024-03 → 2026-08; next-session Δ10Y **+0.86bp, sd 3.41, t=+1.36** — identical to the September ledger's figures, recomputed from Treasury's own press-release index and par curve on 2026-09-08.
- **The revision-month cut, and its honest kill.** Jan/Apr/Jul/Oct releases: mean |Δ10Y| **4.00bp** (n=9) vs **2.55bp** (n=20), t=+2.13, **p=0.033** — but vs an ordinary session's **4.56bp**, t=−0.95, **p=0.34**. Not a signal; the absence of the usual dampening.
- **The zero-Δ month (mechanical, primary).** August month-end 10Y **4.75% → 4.75% (0.0bp)**, 30Y 5.27% → 5.25%, intramonth range 12bp. Model prediction ⇒ **intercept only**. Registered **FT-tic-monthly-2026-10-16-1** (band −0.28%/+0.34%) and **-2** (the drift sign test).
- **The reading rule, inverted for this month.** In July you must strip the mark before reading holdings; in August there is no mark to strip. The reconciliation residual (sd **$26.0bn**) does not vanish with it — "cleaner", not "clean".
- **The tape test the September ledger deferred here (registered).** 2026-10-16 carries no Fed decision (blackout starts **10-17**, decision **10-29**); the scored session is Monday **2026-10-19**, whose only tracked event is the 10:00 NAHB HMI. **FT-tic-monthly-2026-10-16-3**, killed by |Δ10Y| > 10bp.
- **The structural gauge, sharpened (registered).** Official share **42.80% → 40.63%** y/y, and the retreat is bills: **−$42.0bn (−10.4%)** vs coupons **−$72.5bn (−2.1%)**. **FT-tic-monthly-2026-10-16-4**.
- **Existence risk: retired for this date, live for December.** October 2025's release was **cancelled** by the FY2026 lapse, not delayed (Treasury's sb0317, verbatim). PL 119-103 funds through **2026-12-11**; `tic-monthly-2026-12-15` sits four days inside the next lapse window and is proposed in this PR.
- **The date is confirmed, the forecast is not.** `confirmed` applies to 2026-10-16 only. The August valuation call is a **model output** on an **estimated** July base and licenses nothing.

## Initial research

### The question

Will the TIC monthly release publish on 2026-10-16, what will the August-2026 data show, and — as the
first TIC print in this calendar to land on a date no Fed decision owns, and as one of the four
annual-revision editions — does it carry any tradeable reaction that its September sibling could not test?

### One-line verdict

The date promotes to `confirmed`, the shutdown exposure that its sibling flagged is retired by an enacted
CR, and the print remains an untradeable null even on the revision edition — but August's exactly-zero
rate move makes it the single cleanest test of the valuation model this series will offer, and the one
month where the headline holdings number is worth reading at face value.

### Method

Sourced web research per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) (macro-print mode — no
symbol instruments exist for this kind; `symbols: []`). Primaries fetched **direct** this session
(2026-09-08, plain curl, HTTP 200 unless noted): Treasury's TIC release-dates table; the TIC
press-releases-by-topic index; the live data files `slt_table1.txt`, `slt_table3.txt` and
`slt_table5.txt` from `ticdata.treasury.gov`; Treasury's daily par yield curve CSVs for 2023–2026;
CBOE's own `VIX_History.csv` and `VIX3M_History.csv`; and press release **sb0317** via WebFetch. Every
statistic below was **recomputed from those files**, not inherited from the September sibling — where the
two agree (the n=29 null, the 41-month model, the 12-month composition) that is a reproduction, and it is
stated as one. `probe-ref.blocked` is empty: no cited source failed. Two data-handling notes are in leg 6.

### Leg 1 — the date · **SUPPORTED**, and promoted `estimate` → `confirmed`

Treasury's release-dates table puts October's monthly release on the **16th**, under the header *"All data
releases occur at 4 p.m. Washington, D.C. time"*. The `30 - final` in the same row is the annual SHCA
report on U.S. portfolio holdings of foreign securities — a different series on a yearly cadence, and not
this event. Reference month **August 2026** by the page's stated 1.5-month lag. Unlike September, October
carries **no** quarterly derivatives/nonbanking cut; those fall in March, June, September and December.

The mechanical corroboration is materially stronger than the proposal that seeded this entry claimed. The
page's own published rule is *"the 11th business day plus 0 to 3 days"*. Computed with **federal holidays
excluded** — Columbus Day falls on 2026-10-12, and Treasury's own standing notice keys on *"when Federal
Government offices in Washington D.C. are closed"* — the 11th business day of October 2026 is
**2026-10-16 exactly**, offset **+0**, not merely inside a four-day window. The convention validates
itself: across all **24** published 2026 and 2027 dates it lands in-window **22** times and hits **9**
exactly, including the already-`confirmed` 2026-09-16; the weekday-only convention scores 20/24 and 5/24
and misses by up to five days. The two violations (2026-01-15 and 2026-07-14, both *earlier* than the
rule's floor) are recorded rather than explained away.

Promotion follows [`mts-october-2026-11-12`](mts-october-2026-11-12.md), whose bar was **one named
Treasury primary plus independent mechanical corroboration** — that ledger said outright that its release
API check was "a fingerprint, not a second named primary". The `estimate` ground the proposal cited was
this lane's **no-self-confirm** limit: the entry was discovered by the `tic-monthly-2026-09-16` sweep, not
researched. That is cleared — this is the event's own session, re-fetching independently. `TSY:` is an
authorized confirmed-tier prefix, extended from auction to release schedule as `mts-august-2026-09-11`,
`mts-october-2026-11-12` and `tic-monthly-2026-09-16` already did and recorded.

### Leg 2 — the existence risk, which is the one thing its sibling could not settle · **SUPPORTED**, and retired

The September ledger flagged that "the October sibling is exposed" to the FY2027 funding deadline and left
it there. It is worse than that flag implied, and then it is fine.

**The precedent is exact and it is not a delay.** Treasury's own press-release index shows a hole: a
release on **2025-09-18** (July data), then **nothing in October 2025**, then **2025-11-18** covering
*"August and September 2025"*. Press release **sb0317** states the reason verbatim: *"the U.S. Department
of the Treasury today released Treasury International Capital (TIC) data for August (delayed by the
partial shutdown of the federal government) and September 2025."* The October slot was not moved — it was
**cancelled**, and its month folded into the next release. That is also why the tape study below has only
**one** October release in its 29-release window.

**And it does not apply here.** H.R. 6500 was signed **2026-09-02** as **PL 119-103**, funding agencies
through **2026-12-11** — a fact this calendar already carries on
`government-funding-deadline-2026-09-30`, marked *"RESOLVED — AVERTED"* off three primaries read direct
2026-09-05 (clerk.house.gov vote 2026286, the White House signing statement, govinfo BILLS-119hr6500eas
§106), and corroborated here by CRFB's FY2027 appropriations tracker, page-updated 2026-09-03 (secondary,
fetched 2026-09-08). **2026-10-16 sits inside a funded window.** The risk migrates cleanly: the December
release is **2026-12-15**, four days after the CR expires — the same relative position 2025-10-16 held
when it was cancelled — and is proposed in this PR precisely so its own session gets lead time.

### Leg 3 — does the revision edition move the tape? · **REFUTED** (the claim that it does)

Reproduced before extended. Twenty-nine dated releases (2024-03-19 → 2026-08-17) rebuilt from Treasury's
press-release index and measured against the daily par curve give **next-session Δ10Y +0.86bp, sd 3.41,
t=+1.36** and **Δ30Y +0.79bp, t=+1.44** — the September ledger's figures to the decimal, from an
independent rebuild. (Its variance ratio of 0.45 was against a 669-session window; against all 919
sessions 2023-2026 the same ratio is **0.34**. Same conclusion, different denominator, stated rather than
silently harmonised.)

The extension is the cut this event actually licenses. Treasury's note (c) makes October special:
*"The January, April, July, and October releases reflect revised data for the past year."* If TIC ever
carries information, a release that restates twelve months of history is where it should show up.

| Cut | n | mean Δ10Y | mean \|Δ10Y\| |
|---|---|---|---|
| Revision-month releases (Jan/Apr/Jul/Oct) | 9 | +1.56bp | **4.00bp** |
| Other TIC releases | 20 | +0.55bp | **2.55bp** |
| All TIC releases | 29 | +0.86bp | 3.00bp |
| All sessions 2023–2026 | 919 | +0.11bp | **4.56bp** |

The revision cut is real against the other releases — **+1.45bp, t=+2.13, p=0.033** — and it dies the
moment you use the right benchmark. Against an ordinary session it is **−0.56bp, t=−0.95, p=0.34**. The
honest statement is not "revision months are noisy" but "revision months are the only TIC releases that
are *not* unusually quiet", and the signed mean stays a null (**+1.56bp, t=+1.09, p=0.28**) on n=9. The
call does not change; only its reason gets specific. Registered as **FT-tic-monthly-2026-10-16-3**, scored
on **2026-10-19** — the first TIC-next-session in this calendar that no Fed decision contaminates.

### Leg 4 — what August will show, and why it is the sharpest test the model will get · **SUPPORTED**

Refit from the files, not inherited. Regressing the Grand Total reported long-term Treasury valuation
change (as a percent of the prior month's long-term holdings) on the month-end Δ10Y across **41 months
(2023-02 → 2026-06)**:

```
valchg% = 0.0806 − 0.04156 × Δ10Y(bp)      n=41   R² = 0.9496   residual sd = 0.250pp   t(slope) = −27.1
```

Identical to the September ledger's fit to five decimal places, and an implied duration of **4.16**. Then
the fact that makes this event different from every other TIC print on the calendar:

**August 2026's month-end 10-year was 4.75%. July's was 4.75%. The change is exactly zero** — and the
intramonth range was only 12bp (4.63–4.75), so it is a genuinely quiet month, not a round trip that
happens to close flat. Only three of the 41 fitted months carried |Δ10Y| ≤ 1bp. With the slope term dead,
**the prediction *is* the intercept**, and the intercept is where the model is weakest:

| Fitting window | Intercept | Residual sd | Implied duration |
|---|---|---|---|
| 41 months (2023-02 → 2026-06) | **+0.0806%** | 0.250pp | 4.16 |
| last 24 | +0.0007% | 0.236pp | 4.11 |
| last 18 | **−0.0961%** | 0.175pp | 4.47 |
| last 12 | −0.1324% | 0.204pp | 4.29 |

The intercept falls monotonically as the window shortens, and the residuals say why: over the last twelve
fitted months they average **−0.215pp** (≈ −$17bn/month) and are negative in **10 of 12**, with June 2026
the extreme (Δ10Y −1bp, model +$9.7bn, actual **−$39.2bn**). A two-factor fit adding Δ30Y does not help
(R² 0.9497); a three-factor fit adding Δ5Y helps marginally (0.9568) with signs that read as
collinearity, not structure. So the drift is unexplained by the curve, and August is the one month that
measures it without a slope term burying it.

Both are registered. **FT-tic-monthly-2026-10-16-1** takes the union band, **−0.28% to +0.34%** of July's
published base (≈ **−$22bn to +$27bn** at an estimated ~$7,800bn), against a 41-month median |valchg| of
**$51.3bn**. **FT-tic-monthly-2026-10-16-2** is the discriminating sign test: below +0.081% and the drift
is real, at or above it and the full-sample intercept survives.

Two honest riders. The band is a **percentage** claim because July's long-term base is not published until
2026-09-16; the dollar figures are a translation at an estimated base and will be restated. And the same
drift is a live warning about the sibling's own test: debiasing its July point of **−$95.1bn** by the
last-12 residual puts it nearer **−$112bn**, at or through the bottom of its **−$114bn/−$76bn** band. That
is recorded here, not edited there — rows are append-only and another event owns that document.

### Leg 5 — the structural read, and the series that carries it · **SUPPORTED**, sharpened

The September ledger's finding reproduces exactly: over the twelve months to June 2026 total foreign
Treasury holdings rose **+$205.4bn** while foreign **official** holdings fell **−$114.4bn**, implying
private **+$319.8bn** and dropping the official share **42.80% → 40.63%**. Composition is unchanged too —
of June's **$207.1bn** of foreign long-term buying, equities took **$181.4bn (88%)**, Treasuries $6.8bn,
agencies −$16.8bn; the 12-month means are equities **+$76.6bn**, corporates **+$37.3bn**, Treasuries
**+$24.5bn**, agencies **+$9.7bn**.

The sharpening is in Table 5's two "Of Which" lines, which nobody here had split:

| | Jun-2025 | Jun-2026 | Change | % |
|---|---|---|---|---|
| Foreign official — **Treasury bills** | $402.6bn | **$360.6bn** | −$42.0bn | **−10.4%** |
| Foreign official — **bonds & notes** | $3,490.0bn | $3,417.5bn | −$72.5bn | **−2.1%** |

The bill line is the **only mark-free series on the page**. A ~0.25-duration book takes roughly $0.3bn on
a 31bp move, so its change is flow with no valuation wedge at all — which makes it a better monthly gauge
than either the headline or the coupon line, both of which need the model in leg 4 before they mean
anything. And the recent move is overwhelmingly bills: April→June ran **−$96.7bn** of official bills
against **−$31.7bn** of official coupons, off an April bill peak of $457.3bn.

That reframes the story leg 5 of the September ledger told. Reserve managers are not, on this evidence,
selling duration — they are running down **cash**. A private marginal buyer of coupons still demands more
term premium than a reserve manager would, so the term-premium conclusion survives; but the mechanism is
a liquidity drawdown at the front end, which is a different thing to watch and a much cleaner one.
Registered as **FT-tic-monthly-2026-10-16-4**.

### Leg 6 — honest limits

- **"Cleaner" is not "clean."** Killing the mark does not kill the reconciliation residual: holdings
  change minus net purchases minus reported valuation leaves a residual with **sd $26.0bn** across 41
  months. On a month whose modelled mark is ±$6bn, the residual is now the *largest* unexplained term in
  the identity — the opposite of the usual ordering, and the reason FT-1's band is set on the reported
  `for_lt_treas_valchg` rather than on any derived quantity.
- **n=9, and only one October.** The revision-month cut rests on nine observations, of which exactly one
  is an October release (2024-10-17) — because the 2025 one was cancelled. A p=0.033 on n=9 is a finding
  worth registering and not one worth sizing anything on, which is why it is written as a kill switch.
- **The July base is unpublished.** Every dollar figure attached to August is scaled by a July long-term
  Treasury base that publishes on 2026-09-16. The percentage claims are the primary form.
- **Custodial mis-attribution.** Treasury's own Table 5 note: securities in overseas custody accounts
  *"may not be attributed to the actual owners"*. The official/private and bills/coupons splits are more
  robust than any country line; no country-level claim is made here.
- **No consensus, no whisper.** Searched, not asserted — TIC carries no sell-side forecast distribution,
  which is part of *why* a surprise cannot be priced and part of why the null is unsurprising.
- **A primary's own typo, corrected by sequence.** Treasury's press-release index lists
  *"01/19/2023 — TIC Data for November 2023"* between the 12/19/2023 and 02/15/2024 entries; the real date
  is **2024-01-19**. Corrected by position and used as such, stated rather than silently fixed.
- **VIX is a CBOE primary, not a Yahoo one.** **14.53** is the 2026-09-04 cash close (09-07 was the Labor
  Day closure); VIX3M **17.61** the same day — an ordinary contango, no regime signal. CBOE's 09-07 row at
  15.30 is a global-hours calculation and is quoted as neither.
- **`confirmed` covers the date and nothing else.** The August valuation call is a model output; the
  official-bills call is an extrapolation of a five-month trend. Neither licenses an entry, and no house
  playbook is macro-keyed in any case.

## Stance & kill switches

**Stance (initial, 2026-09-08).** **Stand aside on every horizon; read this one, trade none of it.** The
date is `confirmed` off Treasury's own schedule plus a business-day rule that hits it exactly and
validates on 22 of 24 published dates. The tape effect is a **reproduced null** (n=29, +0.86bp, t=+1.36)
that survives the only cut this event licenses — annual-revision releases are distinguishable from other
TIC releases (mean |Δ10Y| 4.00 vs 2.55bp, p=0.033) and indistinguishable from an ordinary session (4.56bp,
p=0.34) — so no size is justified at any confidence and the `low` tier with `symbols: []` stands. The
document's working value is twofold and both parts are dated: **August's exactly-zero month-end rate move**
makes 2026-10-16 the sharpest available test of the valuation model that governs every TIC headline, and
the **foreign official bill line** is the only mark-free monthly gauge of who is actually funding the
front end. The existence risk its sibling flagged is retired for this date and re-filed against
`tic-monthly-2026-12-15`.

**Kill switches** — any one of these forces a re-assessment, not a trade:

1. **The model's intercept breaks.** Published Grand Total `for_lt_treas_valchg` for reference month
   2026-08 lands outside **−0.28% / +0.34%** of July's long-term base
   (**FT-tic-monthly-2026-10-16-1**). Outside **±0.60%** the one-factor model is retired rather than
   re-fit — a zero-rate-move month producing a half-percent mark means the driver is not the 10Y.
2. **The drift was noise.** August prints **at or above +0.081%**, the full-sample intercept
   (**FT-tic-monthly-2026-10-16-2**) — which also means the debiased warning this ledger issues about the
   September sibling's July band was wrong, and my August prior inherits that.
3. **The null breaks on the clean date.** The 10-year moves more than **10bp** on **2026-10-19**
   (**FT-tic-monthly-2026-10-16-3**). This is the September ledger's own kill-switch threshold, finally
   testable because no Fed decision owns the session.
4. **The retreat is duration after all.** Foreign official **bonds & notes** fall faster in percentage
   terms year-over-year than official **bills** on 2026-10-16 (**FT-tic-monthly-2026-10-16-4**), or
   official bills print **above $410bn** — either would say the front-end drawdown story is wrong.
5. **The date moves.** Treasury revises a release date when federal offices in Washington D.C. are closed.
   PL 119-103 covers 2026-10-16, so no lapse branch reaches it — but any CR renegotiation that moves the
   **2026-12-11** expiry earlier, or a DC closure inside the 10-16 to 10-19 window, reopens this.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-08 | D-38 | Initial research banked (above). **Canonical `<id>.json` written from the one existing proposal** (`from-tic-monthly-2026-09-16`), which it now shadows. **Date PROMOTED `estimate` → `confirmed` (`TSY:`)** on the `mts-october-2026-11-12` bar of one named Treasury primary + independent mechanical corroboration: the release-dates table reads 16 for October under the 4 p.m. ET header, and the page's own "11th business day plus 0 to 3 days" rule — computed with federal holidays excluded, as Treasury's own closure notice implies — lands on **2026-10-16 exactly (offset +0)**, a convention that scores **22/24 in-window and 9/24 exact** across all published 2026-27 dates (weekday-only: 20/24, 5/24) and reproduces the confirmed 09-16. The `estimate` ground was no-self-confirm; cleared by this event's own session re-fetching. **Finding 1 — the existence risk is worse than flagged, then retired.** The October 2025 release was not delayed but **cancelled**: Treasury's index shows 2025-09-18 → nothing → 2025-11-18 covering "August and September 2025", and sb0317 says verbatim *"data for August (delayed by the partial shutdown of the federal government) and September 2025"*. PL 119-103 (signed 2026-09-02) funds through **2026-12-11**, so 10-16 is inside a funded window; the exposure moves to **2026-12-15**, four days past the CR expiry, proposed in this PR. **Finding 2 — the null reproduced and then cut.** n=29 rebuilt from primaries: Δ10Y **+0.86bp, sd 3.41, t=+1.36**, Δ30Y +0.79bp — the sibling's numbers, independently. New cut on Treasury's note (c) (Jan/Apr/Jul/Oct restate a year of history): revision months mean |Δ10Y| **4.00bp (n=9)** vs **2.55bp (n=20)**, **t=+2.13, p=0.033** — but vs an ordinary session's **4.56bp**, t=−0.95, **p=0.34**. Revision months are not loud; they merely stop being unusually quiet. Only one October sits in the window, because 2025's was cancelled. **Finding 3 — the load-bearing one: August's Δ10Y is exactly zero.** Month-end 10Y **4.75% → 4.75%**, 12bp intramonth range, third |Δ|≤1bp month in 41. Refit from the files reproduces `valchg% = 0.0806 − 0.04156 × Δ10Y`, **R² 0.9496**, sd 0.250pp, duration 4.16 — so August's prediction collapses to the **intercept alone**, and the intercept is where the model is weakest: **+0.0806%** (n=41) → +0.0007% (24) → **−0.0961%** (18) → −0.1324% (12), with last-12 residuals averaging **−0.215pp** and negative in **10 of 12** (June 2026: Δ10Y −1bp, model +$9.7bn, actual **−$39.2bn**). Adding Δ30Y does not help (R² 0.9497). Registered **FT-…-10-16-1** (band −0.28%/+0.34% of July's base ≈ −$22bn/+$27bn, vs a 41-month median |valchg| of $51.3bn) and **-2** (the sign test against +0.081%). Consequence for the sibling, recorded not edited: debiasing its July point of −$95.1bn by the drift puts it near **−$112bn**, at or through the bottom of FT-tic-monthly-2026-09-16-1's band. **Finding 4 — the official retreat is a BILL story.** Table 5's two "Of Which" lines split y/y to Jun-2026: official **bills −$42.0bn (−10.4%)** vs **bonds & notes −$72.5bn (−2.1%)**, and April→June alone **−$96.7bn** vs **−$31.7bn** off an April bill peak of $457.3bn. Bills are the only mark-free series on the page (~0.25 duration ⇒ ~$0.3bn on 31bp), so that is pure flow — reserve managers running down cash, not shedding duration. Registered **FT-…-10-16-4**. Composition and the official share reproduce the sibling exactly (42.80% → 40.63%; June's $207.1bn split $181.4bn equities / $6.8bn Treasuries / −$16.8bn agencies; 12-mo LT Treasury mean +$24.5bn, 34/41 months positive). **Adjacency sweep.** *Peers:* n/a (`symbols: []`). *Macro:* the corridor's cluster is **CPI 10-14, PPI 10-15, retail sales 10-15**, two days ahead — and critically **no FOMC on 10-16** (blackout starts 10-17, decision 10-29), which is exactly why the sibling deferred the tier test here. Scored session is Monday **10-19** (only NAHB HMI). **Vol:** **VIX 14.53**, VIX3M **17.61** (09-04 CBOE cash closes, primary — baseline set, nothing to diff against yet); 10Y **4.78%**, 30Y **5.24%**, 2Y **4.37%** (09-04 par curve). **Geopolitical/policy:** the CR is the whole story and it cuts in this event's favour; the IMF/World Bank annual meetings (10-12) and G20 FMCBG (10-15) sit in the corridor as venues, not prints. **Corridor:** **21** tracked events within ±5 days, four of them on 10-16 itself (import/export prices 08:30, industrial production 09:15, opex, and the **Treasury primary dealer agenda** for Q4 refunding — supply and foreign demand landing on one date, noted as a pairing, not a signal). **New dated adjacencies found → proposed in this PR:** `tic-monthly-2026-11-18` (September data; the non-revision control) and `tic-monthly-2026-12-15` (October data + the quarterly cut; the shutdown-exposed one, proposed early on purpose). **Checked and NOT proposed, with reasons:** the **2026-10-30** annual SHCA final report (a different series on a yearly cadence — the same call `tic-monthly-2026-09-16` made) and the 2026-12-31 gross-external-debt cut (no press release, outside any corridor). **Blocked fetches:** none — `probe-ref.blocked` is empty; every figure above is from a Treasury or CBOE primary. One data-handling note: Treasury's press-release index carries a typo (*"01/19/2023 — TIC Data for November 2023"*, really 2024-01-19), corrected by sequence and stated. | — (stance set) | 2026-10-08 (`low:15+`, every 30d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-<this-event-id>.json` (`status: "estimate"`) in the
same PR — your own file, never another event's canonical one (#1717). Close-out fills `## Outcome` below from re-run instrument
data (cache busted first), never from memory — after which this doc goes quiet.
