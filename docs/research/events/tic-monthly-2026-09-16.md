# Treasury International Capital (TIC) monthly release (July 2026 data) + the quarterly cut — tic-monthly-2026-09-16

**Kind:** macro-print · **Date:** 2026-09-16 (confirmed, TSY: the June-2026 TIC press release home.treasury.gov/news/press-releases/sb0606, "The next release, which will report on data for July 2026, is scheduled for September 16, 2026", plus home.treasury.gov/data/treasury-international-capital-tic-system/release-dates-of-tic-data, both fetched direct 2026-09-08) · **Impact:** low
**Last assessed:** 2026-09-08
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"low:0+","adjacentIds":["boj-decision-2026-09-18","buyback-blackout-start-2026-09-12","cpi-2026-09-11","eurostat-hicp-final-2026-09-17","fomc-2026-09-16","g20-energy-abundance-ministerial-houston-2026-09-14","gastech-2026-09-14","google-adtech-opinion-unseal-2026-09-16","housing-starts-2026-09-17","iea-omr-2026-09-11","import-export-prices-2026-09-16","industrial-production-2026-09-18","jgb-20y-auction-2026-09-15","missouri-uocava-ballot-mailing-2026-09-19","mts-august-2026-09-11","nahb-hmi-2026-09-16","opex-2026-09-18","pending-home-sales-2026-09-17","retail-sales-2026-09-16","russell-quarterly-ipo-review-effective-2026-09-21","sp-quarterly-rebalance-effective-2026-09-21","sp-rebalance-proforma-capped-2026-09-11","treasury-10y-tips-2026-09-17","treasury-20y-bond-2026-09-15","treasury-buyback-7y10y-2026-09-17","treasury-buyback-tips-10y30y-2026-09-15","treasury-coupon-announcement-2026-09-17","umich-sentiment-prelim-2026-09-11","unsc-iran-panel-mandate-vote-2026-09-17","vix-expiration-2026-09-16"],"screenStreak":0,"blocked":[{"url":"https://query1.finance.yahoo.com/v8/finance/chart/","status":429,"at":"2026-09-08"},{"url":"https://query2.finance.yahoo.com/v8/finance/chart/","status":429,"at":"2026-09-08"},{"url":"https://fred.stlouisfed.org/graph/fredgraph.csv","status":"TIMEOUT","at":"2026-09-08"}]} -->

## At a glance

**TL;DR.** **Never trade this print — and this session measured why rather than asserting it.** Across
the **29** monthly TIC releases from 2024-03 to 2026-08, the next session's 10-year yield moved
**+0.86bp on average (t=+1.36, p=0.17)** against Treasury's own daily par curve — a null — and those
sessions carried **less than half** an ordinary day's variance (ratio **0.45**). Even the *content* is
inert: regressing that next-day move on the published foreign long-term Treasury net-purchase figure
gives **+0.0115bp per $bn (t=+0.92, p=0.36, R²=0.03)**, so a $50bn swing in the headline foreign-demand
number is worth **0.6bp** and is indistinguishable from zero. The structure explains the statistics:
**16:00 ET is after the equity cash close**, the data is **six weeks stale**, and on this particular
date the session belongs to a **14:00 FOMC decision** (`fomc-2026-09-16`). Date is now **confirmed**,
promoted this session off two treasury.gov primaries. What this print *is* good for is a slow structural
gauge, and there the read is sharp. **(1) The July headline will almost certainly look terrible and be
mostly wrong.** The 10-year rose **31bp** in July (4.44% → 4.75% month-end), and a valuation model fit
on **41 months** (`valchg% = 0.0806 − 0.04156 × Δ10Y bp`, **R² 0.950**, implied duration **4.16**) puts
July's long-term Treasury *mark-to-market* at **≈ −$95bn**; foreigners would have to buy **$95bn** of
long-term Treasuries — versus a 12-month mean of **+$24.5bn** and June's **+$6.8bn** — merely to hold
the level flat. **Read `for_lt_treas_net`, never the holdings delta.** June proves the point: holdings
fell **$72.1bn** to **$9,299.0bn** while foreigners were net *buyers* of long-term Treasuries
(**+$6.8bn**) and foreign official net inflows ran **+$48.4bn**. **(2) The composition is the real
signal, and it is a term-premium story.** Of June's **$207.1bn** of foreign net purchases of US
long-term securities, **equities took $181.4bn (88%)**, Treasuries **$6.8bn**, agencies **−$16.8bn**;
and over twelve months **private** foreigners added **+$319.8bn** of Treasuries while **foreign
official** institutions shed **−$114.4bn**, dropping the official share from **42.80% to 40.63%** — the
low of the published window, and falling every month since February. The marginal foreign buyer of US
debt is now a leveraged private one, which is what a **5.24%** 30-year against a **4.37%** 2-year looks
like. `symbols: []`, `low` tier, no house playbook is macro-keyed. Nothing here is a trade.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-8) | **Stand aside** | High | `symbols: []`, `low` tier, no macro-keyed house playbook — and the tape effect is measured null (n=29, t=+1.36, p=0.17, variance ratio 0.45) rather than assumed | Nothing dated today; the read is reassessed, not traded |
| This week | **Stand aside; the corridor's live forks are CPI 09-11 and the 20Y reopening 09-15, not this** | High | This print resolves nothing before it lands, and it lands after the close of a session a 14:00 FOMC decision owns | The 30-year closing **above 5.40%** on the Treasury par curve on or before **2026-09-16** — 9bp above the 2026 high (5.31%, 08-17) and 16bp above the 09-04 close — which would mean the long end is repricing term premium hard enough that a foreign-demand print gets read live instead of ignored |
| This month | **Read the print, do not trade it — and read net purchases, not the holdings delta** | High | July's +31bp puts the modelled long-term Treasury mark at ≈ −$95bn, so headline holdings very likely fall and the "foreigners are dumping Treasuries" reading of that fall is very likely wrong again | The **2026-09-16** release publishing a Grand Total `for_lt_treas_valchg` for reference month 2026-07 **outside −$114bn to −$76bn** (FT-tic-monthly-2026-09-16-1's ±1σ band), which would say the valuation model that carries this call does not hold |
| This quarter | **Watch the official/private split, not the level** | Medium | Official share 42.80% → **40.63%** over twelve months (−$114.4bn) against private **+$319.8bn**; a private marginal buyer prices term premium differently than a reserve manager does | Foreign official holdings printing **above $3,900bn** in either the **2026-09-16** (July) or **2026-10-16** (August) release, which would say the official retreat stalled rather than continued |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never initiate on this print.** `symbols: []`, `low` tier, no macro-keyed house playbook (S1/S2/E1/S3/S4 + G1 are symbol/earnings-keyed), and a measured null on the tape.
- **The measured null (dated, primary).** n=29 releases 2024-03 → 2026-08; next-session Δ10Y **+0.86bp, t=+1.36, p=0.173**; variance ratio vs all 669 sessions **0.45**; content slope **+0.0115bp/$bn, p=0.359, R²=0.030**. Source: Treasury daily par yield curve, fetched direct 2026-09-08.
- **The reading rule (mechanical).** Holdings change ≠ flow. Read Grand Total `for_lt_treas_net` in `slt_table3`; the holdings delta bundles mark-to-market, bill runoff and a reconciliation residual.
- **The July mark (model, confirmed-date event, estimate-grade forecast).** Δ10Y **+31bp** (4.44% → 4.75%, month-end par) ⇒ modelled `for_lt_treas_valchg` **≈ −$95.1bn**, ±1σ **−$114bn / −$76bn**. Registered **FT-tic-monthly-2026-09-16-1**.
- **The flat-holdings bar (dated, mechanical).** It takes **+$95bn** of long-term net purchases to hold July's level flat, against a 12-month mean of **+$24.5bn**, June's **+$6.8bn**, and a series max of **+$138.7bn**; only **5 of 41** months ever cleared that bar.
- **The narrative test (registered).** Headline holdings fall AND long-term net purchases still print positive — the modal outcome (**9 of 14** falling-holdings months). **FT-tic-monthly-2026-09-16-2**.
- **The standing structural gauge.** Foreign official share of Treasury holdings: **40.63%** (Jun-2026), down from 42.80% a year earlier, falling every month since February. Private absorption: UK **+$84.3bn** y/y, Belgium **+$52.2bn**, Luxembourg **+$31.0bn**, Cayman **+$12.2bn**; Japan **−$38.1bn**, China **−$98.0bn**.
- **The Japan line to watch on 09-18.** Japan's holdings are **$1,116.7bn**, **−$122.6bn** off February's $1,239.3bn, and the recent drawdown is *bills* (ST net −$59.8bn in May, −$23.1bn in June), not coupons. `boj-decision-2026-09-18` lands two days after this print.
- **The reconciliation residual is an honest limit, not a rounding error.** Holdings change minus net purchases minus valuation leaves a residual with **sd $26.0bn** (mean |resid| **$20.4bn**, max **$55.9bn**, n=41) — another reason the headline delta is not a flow.
- **The tier test is not runnable on this date.** A 14:00 ET FOMC decision owns the session and this prints at 16:00; whether TIC moves anything gets tested on **2026-10-16** (proposed this PR), whose slot carries no Fed decision.
- **The quarterly cut adds nothing tradeable.** Derivatives holdings/net cash settlements and nonfinancial firms' claims and liabilities at end-Q2 2026 publish alongside; gross external debt is a separate cut on **2026-09-30**.

## Initial research

### The question

Will the Treasury International Capital monthly release publish on 2026-09-16, what will the July-2026
data show, and — landing 16:00 ET on FOMC decision day, as the calendar's only capital-account print —
does it carry any signal, or any tradeable reaction, for our tracked names or for the September coupon
corridor this calendar already watches from four other angles?

### One-line verdict

The date is confirmed and promotable; the print is a **measured null** on the tape and should never be
traded — but it is the only direct monthly read on *who finances the deficit*, and on that question the
July release will very likely publish a frightening-looking headline that is mostly mark-to-market.

### Method

Sourced web research per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) (macro-print mode — no
symbol instruments exist for this kind; `symbols: []`). Primaries fetched **direct** this session
(2026-09-08, plain curl, HTTP 200 unless noted): Treasury's TIC release-dates table; the June-2026 TIC
press release (`sb0606`, via WebFetch); the TIC press-releases-by-topic index for historical release
dates; the live TIC data files `slt_table1.txt`, `slt_table2.txt`, `slt_table3.txt` and
`slt_table5.txt`; Treasury's daily par yield curve CSVs for 2023–2026; CBOE's own `VIX_History.csv`.
Yahoo's chart API returned **429 on every call all session** (both hosts) and FRED's CSV endpoint timed
out — both recorded in `probe-ref.blocked`; every market reading below comes from a primary instead.

### Leg 1 — the date · **SUPPORTED**, and promoted `estimate` → `confirmed`

Two independent treasury.gov primaries agree. The June-2026 press release states verbatim: *"The next
release, which will report on data for July 2026, is scheduled for September 16, 2026."* The
release-dates table puts September's monthly release **and** the quarterly cut (nonfinancial firms,
derivatives, portfolio claims and liabilities at end of previous quarter) both on the 16th, under the
header *"All data releases occur at 4 p.m. Washington, D.C. time"*, with gross external debt separately
on the 30th. A third check is mechanical and independent of both pages: the page's own published rule is
*"the 11th business day plus 0 to 3 days"*, and the 11th business day of September 2026 is the **15th**
once Labor Day (09-07) is excluded — so the rule permits 09-15 through 09-18 and the published date sits
inside it. Reference month **July 2026** by the page's stated 1.5-month lag and by the press release's
own wording.

The promotion follows [`mts-october-2026-11-12`](mts-october-2026-11-12.md) item for item: the original
estimate grounds were this lane's **no-self-confirm** limit (the entry was discovered in the
`import-export-prices-2026-09-16` adjacency sweep, not researched), and that is cleared — this session
re-fetched both primaries independently. `TSY:` is an authorized confirmed-tier prefix; its gloss in
`market-events-data.ts` reads "auction schedule", and this is a release schedule, the same extension
`mts-august-2026-09-11` and `mts-october-2026-11-12` already made and recorded on the file.

### Leg 2 — does this print move the tape? · **REFUTED** (the claim that it does)

Measured, not assumed — the discipline [`mts-august-2026-09-11`](mts-august-2026-09-11.md) set for a
release that "obviously" does nothing. TIC publishes at 16:00 ET, after the 15:30 par-curve fix and
after the equity cash close, so the first priceable session is the **next** business day.

Twenty-nine dated release dates (2024-03-19 → 2026-08-17) came from Treasury's own press-release index
and were cross-checked against the release-dates table's 2026 row, which reproduces the last six
exactly. Against the daily par curve:

| Test | Result |
|---|---|
| Next-session Δ10Y, mean | **+0.86bp**, sd 3.41, **t=+1.36, p=0.173** (n=29) |
| Next-session Δ30Y, mean | **+0.79bp**, sd 2.97, **t=+1.44** (n=29) |
| Unconditional daily Δ10Y | +0.12bp, sd 5.08 (n=669) |
| Variance ratio, TIC-next-day ÷ all days | **0.45** |
| Mean absolute Δ10Y | **3.00bp** vs 4.00bp on an ordinary day |
| Δ10Y regressed on published LT Treasury net purchases | slope **+0.0115bp/$bn**, **t=+0.92, p=0.359, R²=0.030** |

Three readings, all pointing the same way. There is **no mean effect**. The sessions after a TIC release
are **quieter than average**, not noisier — mid-month dates that sit away from the jobs/CPI/FOMC cluster.
And the *content* of the print does not move rates either: at the fitted slope, a **$50bn** swing in the
headline foreign-demand number buys **0.6bp** on the 10-year, with a sign that is arguably backwards
(more foreign buying → higher yields) and a coefficient two-thirds of a standard error from zero. The
structural reason is the same one the MTS ledger found: by the time TIC publishes, the six-week-old
quarter it describes has already been priced by every auction, buyback and coupon announcement in
between.

### Leg 3 — what the last print actually said, and how it was read · **MIXED**

June-2026 data, published 2026-08-17. Treasury's own release: net TIC inflow **$133.5bn** ($85.0bn
private + **$48.4bn official**), with overall net foreign purchases of long-term securities
**$172.7bn**. That headline reconciles exactly against the data files — $207,076M of foreign net
purchases of US long-term securities (`slt_table1`) minus $34,350M of US net purchases of foreign
long-term securities (`slt_table2`) = **$172,726M** — so the published figures and the files are the
same object, checked rather than assumed.

The press coverage that followed ran the line *"Top Three Foreign Holders of U.S. Debt All Reduced
Treasury Holdings in June; Japan Led the Declines"* (secondary, search-relayed 2026-09-08). That is
true of the *holdings* and misleading about the *behaviour*: in the same month, foreigners were net
**buyers** of long-term Treasuries (**+$6.8bn**) and foreign official institutions recorded **+$48.4bn**
of net inflows. Holdings fell **$72.1bn** to **$9,299.0bn** because the mark moved (reported
`for_lt_treas_valchg` **−$39.2bn**) and bills ran off (short-term net **−$29.0bn**).

MIXED rather than SUPPORTED because the *composition* genuinely is weak even after correcting the
headline. Inside June's $207.1bn of foreign long-term buying: **equities +$181.4bn (88%)**, corporate
and other bonds +$35.6bn, **Treasuries +$6.8bn**, **agencies −$16.8bn**. And the Treasury line is
decelerating hard — +$50.5bn (April), +$56.6bn (May), **+$6.8bn** (June). Foreign money kept coming to
the United States in June; it went to the equity market, not the bond market.

### Leg 4 — what July will show · **SUPPORTED** (as a forecast, registered)

The July tape is already known: month-end 10-year **4.44% → 4.75% (+31bp)**, 30-year **4.91% → 5.27%
(+36bp)**, from the primary par curve. A print of that size shows up first as a mark.

Fitting the reported Grand Total long-term Treasury valuation change, as a percent of the prior month's
long-term holdings, on the month-end Δ10Y across **41 months (2023-02 → 2026-06)**:

```
valchg% = 0.0806 − 0.04156 × Δ10Y(bp)      n=41   R² = 0.950   residual sd = 0.244pp
```

The slope implies an effective duration of **4.16** (percent per 100bp) on the foreign-held long-term
Treasury book — plausible for a portfolio that skews intermediate. At July's +31bp on a June base of
**$7,872.9bn**, the model predicts **−1.208%**, i.e. **≈ −$95.1bn**, with a ±1σ band of **−$114.3bn to
−$75.9bn**. Registered as **FT-tic-monthly-2026-09-16-1**.

The consequence is the decision-relevant part. To keep long-term holdings merely **flat** in July,
foreigners would have to have bought **$95bn** of long-term Treasuries. The 12-month mean is
**+$24.5bn**; June ran **+$6.8bn**; only **5 of 41** months in the series ever cleared $95bn, and the
all-time high in that window is **+$138.7bn** (2025-05). So headline holdings very probably fall again,
probably by a large and quotable number — and net purchases very probably stay positive
(**34 of 41** months positive overall; **9 of 14** of the months where headline holdings actually fell).
That conjunction is **FT-tic-monthly-2026-09-16-2**.

### Leg 5 — the structural signal that *is* worth tracking · **SUPPORTED**

Level is noise; composition is not. Over the twelve months to June 2026, total foreign Treasury holdings
rose **+$205.4bn** — and the split behind that number is the story:

| | Jun-2025 | Jun-2026 | Change |
|---|---|---|---|
| Total foreign holdings | $9,093.6bn | $9,299.0bn | **+$205.4bn** |
| Of which foreign **official** | $3,892.5bn | $3,778.1bn | **−$114.4bn** |
| Implied **private** | $5,201.1bn | $5,520.9bn | **+$319.8bn** |
| Official **share** | 42.80% | **40.63%** | **−2.17pp** |

The official share is the low of the published window and has fallen in every month since February
(42.27% → 41.74% → 41.77% → 41.06% → 40.63%). The names carrying the private side are the custodial and
leveraged centres — **UK +$84.3bn**, **Belgium +$52.2bn** (the Euroclear proxy), **Luxembourg +$31.0bn**,
**Cayman +$12.2bn** — against reserve managers stepping back: **China −$98.0bn** (to $633.4bn, the window
low) and **Japan −$38.1bn**, the latter **−$122.6bn** off its February peak and drawn down mostly in
*bills* rather than coupons (ST net −$59.8bn in May, −$23.1bn in June).

A private, price-sensitive, often-levered marginal buyer demands more term premium than a reserve
manager buying for policy reasons and holding to maturity. That is a coherent account of a **5.24%**
30-year against a **4.37%** 2-year, and it is the standing thing this ledger exists to monitor — one
observation per month, at zero risk, with no trade attached.

### Leg 6 — honest limits

- **The reconciliation does not close.** Holdings change minus net purchases minus reported valuation
  leaves a residual with **mean −$1.8bn, sd $26.0bn, mean absolute $20.4bn, max $55.9bn** across 41
  months — TIC's own panel changes and reclassifications. Any decomposition of a single month's headline
  delta is therefore approximate, which is stated here rather than hidden in a clean-looking identity.
  The forward test targets the **reported** `for_lt_treas_valchg`, which the model fits at R² 0.950, not
  a residual-contaminated derived quantity.
- **Custodial mis-attribution.** Treasury's own note on Table 5: securities held in overseas custody
  accounts "may not be attributed to the actual owners", so country-level reads — especially Belgium,
  Luxembourg, Cayman and the UK — are custody locations, not beneficial ownership. The official/private
  split is more robust than any single country line.
- **No consensus and no whisper exist.** Searched, not asserted: TIC carries no sell-side forecast
  distribution the way CPI or payrolls do, which is part of *why* the surprise cannot be priced.
- **The tier test cannot run on this date.** An FOMC decision at 14:00 owns the 09-16 session; any move
  is unattributable. It gets tested on `tic-monthly-2026-10-16` (proposed in this PR), whose slot carries
  import/export prices, industrial production and opex but no Fed decision.
- **VIX is a primary reading, not a Yahoo one.** **14.53** is the 2026-09-04 CBOE close — the last full
  US cash session before this assessment (09-07 was the Labor Day closure). CBOE's file also carries a
  09-07 row at 15.30 from its global-hours calculation; it is not a cash close and is quoted as neither.
- **`estimate` labels and this lane.** The date is `confirmed`; the July forecast is a **model output**
  and carries no confirmed status of its own. Nothing in this document licenses an entry.

## Stance & kill switches

**Stance (initial, 2026-09-08).** **Stand aside on every horizon; monitor, never trade.** The date is
`confirmed` off two treasury.gov primaries. The tape effect is a **measured null** — n=29, next-session
Δ10Y +0.86bp at t=+1.36 (p=0.173), variance ratio **0.45**, and a content slope of +0.0115bp per $bn at
p=0.359 — so no size is justified at any confidence, and the `low` tier with `symbols: []` is correct.
The document's working value is a monthly structural read: **the official retreat against private
absorption** (official share 42.80% → **40.63%** over twelve months; private **+$319.8bn** vs official
**−$114.4bn**), which is the demand-side companion to the coupon corridor this calendar already tracks
through `treasury-20y-bond-2026-09-15`, `treasury-10y-tips-2026-09-17`,
`treasury-coupon-announcement-2026-09-17` and `mts-august-2026-09-11`.

**Kill switches** — any one of these forces a re-assessment, not a trade:

1. **The valuation model breaks.** Published Grand Total `for_lt_treas_valchg` for reference month
   2026-07 lands outside **−$114bn to −$76bn** on 2026-09-16 (**FT-tic-monthly-2026-09-16-1**). Outside
   ±2σ (−$134bn / −$57bn) the model is retired rather than re-fit.
2. **The reading rule breaks.** Headline foreign Treasury holdings fall in July **and** long-term net
   purchases print **negative** — a genuine buyers' strike rather than a mark
   (**FT-tic-monthly-2026-09-16-2**).
3. **The official retreat stalls.** Foreign official holdings print **above $3,900bn** on 2026-09-16 or
   2026-10-16, reversing the five-month slide that carries Leg 5.
4. **The null breaks.** The 10-year moves more than **10bp** on the session following any TIC release —
   more than 3σ of the measured TIC-next-day distribution (sd 3.41bp) — which would say the release
   started carrying information it has not carried in 29 observations.
5. **The date moves.** Treasury's release-dates page carries a standing notice that a date is revised if
   federal offices in Washington D.C. are closed; the FY2027 funding deadline is **2026-09-30**, after
   this release, so no lapse branch reaches it — but the October sibling is exposed and this ledger
   should say so when it gets there.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-08 | D-8 | Initial research banked (above). **Date flipped `estimate` → `confirmed`:** two treasury.gov primaries fetched direct — the June-2026 press release (`sb0606`) stating "The next release, which will report on data for July 2026, is scheduled for September 16, 2026", and the release-dates table putting the monthly release and the quarterly cut both on the 16th at 16:00 ET; corroborated mechanically by the page's own "11th business day plus 0 to 3 days" rule, which permits 09-15 → 09-18 once Labor Day is excluded. Promoted on the `mts-october-2026-11-12` precedent (no-self-confirm cleared by independent re-fetch; `TSY:` extended from auction to release schedule, as that entry and `mts-august-2026-09-11` already did). **Canonical `<id>.json` written from the one existing proposal** (`from-import-export-prices-2026-09-16`), which shadows it. **Finding 1 — the tape effect is a measured null, not an assumed one:** 29 releases (2024-03 → 2026-08, dates from Treasury's own press-release index, last six cross-checked against the release-dates table), next-session Δ10Y **+0.86bp, sd 3.41, t=+1.36, p=0.173** vs +0.12bp/sd 5.08 across 669 sessions; **variance ratio 0.45** (TIC-next-days are *quieter*, mean abs 3.00bp vs 4.00bp); Δ30Y +0.79bp, t=+1.44. Content is inert too — Δ10Y on published LT Treasury net purchases gives **+0.0115bp/$bn, t=+0.92, p=0.359, R²=0.030**, so a $50bn headline swing ≈ 0.6bp. **Finding 2 — June's headline was misread and July's will be worse:** holdings fell $72.1bn to $9,299.0bn while LT net purchases were **+$6.8bn** and official net inflows **+$48.4bn**; the press ran "top three holders all cut" (secondary). Fitting reported LT valuation change on month-end Δ10Y across 41 months gives `valchg% = 0.0806 − 0.04156 × Δ10Y(bp)`, **R² 0.950**, resid sd 0.244pp, implied duration 4.16 — at July's **+31bp** (4.44% → 4.75%) that is **≈ −$95.1bn**, so it would take **$95bn** of LT buying (12-mo mean +$24.5bn; only 5 of 41 months ever cleared it) merely to hold the level flat. Registered **FT-tic-monthly-2026-09-16-1** (valuation band) and **-2** (holdings fall, net purchases still positive — 9 of 14 falling months). **Finding 3 — the composition, which is the reason to keep this document:** of June's $207.1bn foreign LT purchases, equities took **$181.4bn (88%)**, Treasuries $6.8bn, agencies −$16.8bn; over 12 months official holdings **−$114.4bn** vs private **+$319.8bn**, official share **42.80% → 40.63%**, a window low falling every month since February — UK +$84.3bn, Belgium +$52.2bn, Luxembourg +$31.0bn against China −$98.0bn and Japan −$38.1bn. Press-release headline reconciled exactly against the files ($207,076M − $34,350M = **$172,726M** = the published $172.7bn), checked not assumed. **Adjacency sweep.** *Peers:* n/a (`symbols: []`). *Macro:* CPI **09-11** and the FOMC **09-16 14:00** are the corridor's live forks; this prints two hours after the decision, into a closed cash market. *Vol:* **VIX 14.53** (09-04 CBOE close, primary — baseline set, nothing to diff against yet); 10Y **4.78%**, 30Y **5.24%**, 2Y **4.37%** (09-04 par curve), 30Y 2026 high **5.31%** on 08-17. *Geopolitical/policy:* Japan's drawdown is bills not coupons, and `boj-decision-2026-09-18` lands two days after; Treasury's 06-10-2026 notice opens a mandatory SHL survey as of 2026-06-30, whose preliminary report is end-Feb-2027 (outside this event's window, noted not proposed). *Existence risk:* n/a — publishes two weeks before the 09-30 funding deadline; the October sibling is exposed and its own ledger should carry that. *Event tape:* **no consensus and no whisper exist for TIC** — searched, not asserted, which is part of why the surprise cannot be priced. **New dated adjacency found → proposed in this PR:** `tic-monthly-2026-10-16` (August data, 16:00 ET), so the capital-account series does not die after one entry and the valuation model gets an out-of-sample score on a date no FOMC owns. **Checked and NOT proposed, with reasons:** the 2026-09-30 gross-external-debt cut (same page, but Treasury publishes it with no press release and it is 14 days out, outside the corridor) and the 2026-10-30 annual SHC final report (a different series on a yearly cadence). **Blocked fetches recorded, not substituted silently:** Yahoo's chart API returned 429 on both hosts all session and FRED's CSV endpoint timed out — every market number above is from Treasury's or CBOE's own primary instead, and `probe-ref.blocked` carries all three. | — (stance set) | 2026-09-15 (`low:0+`, every 7d — D-1, the last pulse before the print) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-<this-event-id>.json` (`status: "estimate"`) in the
same PR — your own file, never another event's canonical one (#1717). Close-out fills `## Outcome` below from re-run instrument
data (cache busted first), never from memory — after which this doc goes quiet.
