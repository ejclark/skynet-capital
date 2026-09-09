# S&P Cotality Case-Shiller Home Price Indices (July 2026 data) — case-shiller-hpi-2026-09-29

**Kind:** macro-print · **Date:** 2026-09-29 (estimate, EST: two primaries read direct 2026-09-09 — the publisher's own rule verbatim in the current release, *"published on the last Tuesday of each month at 9:00 am ET"* (press.spglobal.com, HTTP 200, 90,693 bytes), and FRED's series page for `CSUSHPINSA` stating **"Next Release Date: Sep 29, 2026"** (HTTP 200); §Leg 1) · **Impact:** low
**Last assessed:** 2026-09-09
<!-- probe-ref: {"symbols":{},"vix":15.72,"daysBand":"low:15+","adjacentIds":["adp-employment-2026-09-30","advance-economic-indicators-2026-09-30","apple-eu-dma-terms-2026-10-01","boj-summary-of-opinions-2026-10-01","boj-tankan-2026-10-01","census-benchmark-revision-nsa-2026-09-28","chicago-pmi-2026-09-30","construction-spending-2026-10-01","consumer-confidence-2026-09-29","crwv-fully-connected-2026-09-29","dallas-fed-mfg-2026-09-28","durable-goods-2026-09-25","ecb-economic-bulletin-2026-09-24","fhfa-hpi-2026-09-29","g20-trade-ministerial-milwaukee-2026-09-30","gdp-q2-2026-third-2026-09-30","google-adtech-final-judgment-2026-10-02","government-funding-deadline-2026-09-30","ism-manufacturing-2026-10-01","jgb-40y-auction-2026-09-29","jobs-2026-10-02","jolts-2026-09-29","m3-full-report-2026-10-02","new-home-sales-2026-09-24","opec-jmmc-68th-2026-10-04","opec-plus-meeting-2026-10-04","pce-2026-09-30","pjm-reliability-backstop-procurement-2026-09-30","retail-benchmark-revision-2026-09-28","russell-style-quarter-end-capping-effective-2026-09-30","scoos-2026-09-24","sp-select-sector-secondary-reweight-2026-09-30","steel-imports-preliminary-2026-09-24","treasury-7y-note-2026-09-24","treasury-buyback-10y20y-2026-10-01","treasury-buyback-20y30y-2026-09-24","treasury-buyback-tips-1y10y-2026-09-29","treasury-coupon-announcement-2026-10-01","trump-xi-summit-2026-09-24","umich-sentiment-final-2026-09-25","unsc-iran-panel-mandate-expiry-2026-09-26"],"screenStreak":0,"blocked":[{"url":"https://alfred.stlouisfed.org/graph/fredgraph.csv?id=DEXRNSA&vintage_date=2026-08-25","status":"404","at":"2026-09-09"},{"url":"https://fred.stlouisfed.org/releases/calendar?rid=199","status":"NO_DATA_RENDERED","at":"2026-09-09"},{"url":"https://www.spglobal.com/spdji/en/index-family/indicators/sp-corelogic-case-shiller/","status":"403","at":"2026-09-09"},{"url":"https://www.cmegroup.com/markets/real-estate.html","status":"EGRESS_BLOCKED","at":"2026-09-09"}]} -->

## At a glance

**TL;DR.** **Three things are new here, and two of them correct a sibling.** This is the **1-step
print** — June is the last published month, so July is forecastable from it to a **0.1186pp** MAE and
a **90% band of [−0.180%, +0.333%]** on the national SA m/m. That band is **0.513pp wide against the
October edition's 0.87pp**, which makes this the **tightest edition this series ever offers** and the
sharpest available test of the "pre-chewed" claim the
[10-27 sibling](case-shiller-hpi-2026-10-27.md) built its stand-aside on. **First correction — the
Detroit outage is a rolling one-month lag that backfills, not an accumulating hole.** The sibling
read the release wording as *"no valid index update since at least the January-2026 data"*; the
publisher states the backfill mechanism in the same paragraph (*"S&P DJI will continue to provide
updates to the Detroit index values for the month(s) with missing sale transactions data"*), and the
live FRED vintage measures it: `DEXRNSA` ends **2026-05** while the national index and **all five**
peer cities checked end **2026-06**, and January 2026 — the month the March release said would be
absent — **is present today at 195.422**. Detroit is exactly one month behind, every month. **Second
correction, and it is owed to the proposal that created this id:** it called 09-29 *"the cleaner slot
of the two"* because it is not an FOMC day. On its own metric it is the **dirtier** slot — **41
tracked events within five days against 24 around 10-27**, with **quarter-end on 09-30** (Russell
style recapping and the Select Sector secondary reweight both effective that morning), **PCE and GDP
Q2 third on 09-30**, ISM on 10-01 and the **September jobs report on 10-02**. **Third — the sibling's
one undecided question is now decided.** It found SPY **p=0.0604** / QQQ **p=0.0570** pre-open
narrowing on release days, *preferred* a month-end-flow explanation and declined to assert it. Re-run
against a **month-end-matched baseline** (other sessions in a month's last five trading days) both
collapse: **SPY 0.0579 → 0.1054, QQQ 0.0587 → 0.1433**, and nine tests return **zero** hits. The flow
story is now **supported**, not merely preferred. One live hazard specific to *this* edition: the
**July seasonal has decayed** — NSA July m/m averaged **+0.554%** (1988–2014) and **+0.730%**
(2015–2021) but **+0.035%** across 2022–2025, only 2 of 4 positive. Date is **`estimate`** on taxonomy
alone. **Stand aside.**

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-20) | **Stand aside** | High | `symbols: []`, D-20, July data does not exist, and a re-grep of `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md` for any macro / housing / house-price keying returns **0 hits** today. Writing the canonical calendar file is this session's deliverable; there is no trade in it. | A macro-keyed house playbook landing in `docs/plans/trade-playbooks.md` before **2026-09-29** — none exists today |
| This week | **Stand aside — and note that the newest edition is fifteen days old and nothing in this series prints before 09-29** | High | Current edition **2026-08-25** (June-2026 data): national NSA **+1.5% y/y**, 20-City **+2.1%**, 10-City **+2.9%**, national SA m/m **+0.1%** — all reconciled to FRED this session (1.525 / 2.096 / 2.914 / +0.134). Nominal y/y has now **accelerated four months running** from its **+0.78% March trough** (0.78 → 0.97 → 1.21 → **1.53**), which is the opposite of the deceleration story the sector tape tells. 30-year mortgage **6.71%** (2026-09-03) vs 6.50% a year earlier; VIX **15.72** (2026-09-08). | The 30-year mortgage rate breaking above **7.00%** or below **6.25%** before **2026-09-29** — either would break the slow-tightening transmission frame this row rests on |
| This month | **Do not trade the release — and this session removes the last excuse for thinking the pre-open channel might be live** | High | Attribution was already *declined* rather than null (all 68 release days since 2021 are shared with FHFA HPI and Consumer Confidence, which all key on the last Tuesday). What is new is that the sibling's two near-misses **do not survive a month-end-matched baseline**: SPY p **0.0579 → 0.1054**, QQQ **0.0587 → 0.1433**, nine tests, zero hits. On **09-29's own subset** — the 22 quarter-end last Tuesdays — one hit in nine (PHM p=0.0397, and *narrower*), against ~0.45 expected by chance. | Any of the nine instruments printing a release-day median open gap above its own baseline at p<0.05 **with the right sign** against the **month-end-matched** baseline, on a re-run after **2026-12-29** — every reading measured today is either non-significant or narrower |
| This quarter | **Hold it as a thermometer, and expect the July headline to read worse than it is** | Medium | The `Medium` is the decayed seasonal, not the index. The publisher's own framing — *"Because June typically falls near the peak of the homebuying season, price appreciation often moderates"* — sets an NSA expectation the recent tape does not support: July NSA m/m ran **+0.554%** (1988–2014) and **+0.730%** (2015–2021) but **+0.035%** across **2022–2025**, with **2022-07 −0.38** and **2025-07 −0.20**. A ~0.0% July NSA headline is **normal now** and will read as a shock against the stale seasonal. | The July-2026 national NSA m/m printing **at or above +0.554%**, the 1988–2014 July mean — the seasonal has not decayed and this row's whole framing is wrong |

**Signals & conditions** — the buy/sell/hold triggers:

- **No buy signal and no sell signal exists off this event.** `symbols: []`, no macro-keyed house
  playbook (0 hits, re-grepped 2026-09-09), and no attributable release day has ever existed for this
  index. The date being `estimate` widens nothing: research is not action.
- **This is the 1-step print — the tightest this series gets.** Registered as `-2`: national SA m/m
  90% band **[−0.180%, +0.333%]** (width **0.513pp**), against the October edition's 2-step
  **[−0.30%, +0.57%]** (width 0.87pp). Persistence MAE **0.1186pp** vs FHFA's **0.2183pp**.
- **Watch the NSA m/m headline, not the SA one.** Registered as `-3`. The press release leads with
  NSA, and the July seasonal it implicitly invokes is **~0.5pp stale**.
- **The Detroit outage self-heals — check the June backfill, not the notice.** Registered as `-4`,
  and it is a strictly sharper test than the sibling's "does the notice recur": `DEXRNSA` gaining a
  **2026-06** observation after this release confirms the mechanism the publisher states.
- **"Not an FOMC day" is not "a clean slot" — and this is the second ledger in the family to have to
  say so.** **41** tracked events sit within five days of 09-29 against **24** around 10-27; the
  `fhfa-hpi-2026-09-29` lane counted 32 on 2026-09-06 and made the same point.
- **The funding-cliff frame is dead and is not re-derived here.**
  [`government-funding-deadline-2026-09-30`](government-funding-deadline-2026-09-30.md) was
  **averted** — PL 119-103, signed 2026-09-02, funds through **2026-12-11**. Cited from
  [`fhfa-hpi-2026-09-29`](fhfa-hpi-2026-09-29.md), not re-checked, and no statement here rests on a lapse.
- **CME's listed Case-Shiller derivatives are now blocked from two independent environments.** The
  sibling recorded a 403 on 2026-09-08; this runner gets a **connection failure** (`EGRESS_BLOCKED`).
  Two environments is no longer a transient — it is a source this lane cannot reach, and the one
  question that could overturn `symbols: []` stays open.
- **Watch (dated)** — Trump–Xi summit, new-home sales, SCOOS and the 7Y note **09-24** · durable goods
  and UMich final **09-25** · Dallas Fed and two retail benchmark revisions **09-28** · **this print
  09-29** at 09:00 alongside **FHFA HPI**, **JOLTS** and **Consumer Confidence** · **quarter-end
  09-30** with **PCE**, **GDP Q2 third**, Chicago PMI, ADP and two index-reweight effectives ·
  **ISM manufacturing 10-01** · **September jobs 10-02** · OPEC+ **10-04** · the August-data edition
  **10-27** (FOMC day 1) · November-data **11-24** · December-data **12-29**.

## Initial research

### The question, plainly

This id existed only as one proposal — `from-case-shiller-hpi-2026-10-27` — filed one day earlier by
the lane that had just written the calendar's first Case-Shiller entry. That lane's argument was
specific and numerical: the 09-29 edition **sets the base** for the print it was researching, and
until July lands, no August consensus can exist. It is a good argument and this session writes the
canonical file. But it was made *by* the October lane, *about* the October print — so the honest
question is not "should this edition be tracked":

**What is true of the 2026-09-29 edition itself — and does the October lane's own reasoning survive
being pointed at this date instead?**

**One-line verdict:** the reasoning survives and sharpens on one count — this is the **1-step** print
and therefore the tightest, most falsifiable edition the series produces — and **fails on two**: the
slot is dirtier than 10-27, not cleaner, and the Detroit outage the sibling framed as an accumulating
hole is a **rolling one-month lag that backfills**, which the publisher states outright and the live
data confirms. A third result is new rather than corrective: the sibling's one **undecided** question,
whether its pre-open near-misses were a house-price effect or month-end flow, resolves to **flow**
once the baseline is matched.

### Method

Macro-print mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — `symbols: []`, so
neither `earnings-cycle.mjs` nor `intraday-edges.mjs` applies and the cache-busting rule has no
target. Everything below was fetched or computed on **2026-09-09**:

1. **`press.spglobal.com`, the June-2026-data release** (HTTP 200, 90,693 bytes) — the schedule rule,
   the headline figures, the analyst framing, and the **full** Wayne County paragraph including the
   backfill sentence the sibling's excerpt stops one clause short of.
2. **`fred.stlouisfed.org/series/CSUSHPINSA`** (HTTP 200, 80,115 bytes) — *"Next Release Date: Sep 29,
   2026"*, alongside *"Jun 2026: 336.663, Updated: Aug 27, 2026 10:21 AM CDT"*.
3. **FRED CSVs** — `CSUSHPINSA` / `CSUSHPISA` (national, → 2026-06), `SPCS20RSA` / `SPCS20RNSA` /
   `SPCS10RSA` (20- and 10-City), `HPIPONM226S` (FHFA purchase-only SA, the control), `MORTGAGE30US`
   (→ 2026-09-03), and — the new ones — **`DEXRNSA` / `DEXRSA` (Detroit)** plus five peer-city
   indices (`ATXRNSA`, `CHXRNSA`, `MIXRNSA`, `SEXRNSA`, `PHXRNSA`) fetched purely to date the outage.
4. **Yahoo daily bars** for SPY, QQQ, ITB, XHB, DHI, LEN, PHM, TOL, XLRE and `^VIX` (2,936 bars each;
   XLRE 2,743), with **20,000-iteration** permutation tests on medians.

**Four fetch failures are recorded in `probe-ref.blocked` rather than papered over.** ALFRED returned
**404** to every vintage request from this runner (its bot-protection script is visible in the
response body), so **no revision study was attempted** and the sibling's is cited, not re-run.
`fred.stlouisfed.org/releases/calendar?rid=199` — the proposing lane's second primary — returned
**HTTP 200 with no dates in the payload**, because it renders its table client-side; rather than
citing a source this session did not actually read, the date rests on a **different** second primary
(the series page above). The S&P DJI indicator page **403**'d for the fifth consecutive lane, and
`cmegroup.com` failed to connect.

**Deliberately not re-derived.** The sibling's ALFRED revision study, its March-2026 cadence
adjudication, and the FHFA lane's funding-lapse check are **cited, not repeated** — all three are
settled, and re-running settled work would have spent the session on answered questions. What *was*
re-derived, on purpose, is the sibling's headline arithmetic: an independent fetch reproduces its
persistence table to four decimals (below), which is what licenses treating everything else it says
as sound.

### Leg 1 — the release exists on 2026-09-29 · **SUPPORTED**, on a second primary the proposal did not use

The publisher states its own rule in the current release:

> The S&P Cotality Case-Shiller Indices are published on the **last Tuesday of each month at 9:00 am
> ET**.

September 2026's Tuesdays are the 1st, 8th, 15th, 22nd and 29th — the last is the **29th**. The
release's own two-month lag (published 2026-08-25 reporting **June 2026**) puts **July 2026** data on
it.

**The second primary had to be replaced, and the replacement is better.** The proposal cited
`fred.stlouisfed.org/releases/calendar?rid=199`. From this runner that URL returns **HTTP 200 and
65,642 bytes containing no release dates at all** — the calendar renders its table client-side, and
the only date string in the payload is the page's own build stamp. That is not a source this session
read, so it is recorded as blocked and **not cited**. What replaces it is stronger for this purpose:
FRED's **series page for `CSUSHPINSA`** — the national NSA index itself — states

> **Next Release Date: Sep 29, 2026**

directly beneath *"Jun 2026: 336.663, Updated: Aug 27, 2026 10:21 AM CDT"*. A series-specific
scheduled date beats a listing, because it is the date FRED's own ingestion is waiting on.

**Why it stays `estimate`, and the reason is not the date.** `CONFIRMED_PREFIX` in
`scripts/event-scan-validation.mjs` is
`(IR|CAL|BLS|FED|PJM|SEC|TSY|OCC|BEA|CENSUS|ISM|CB|UMICH|FHFA)`. There is no member for an index
provider's own publication rule, and `FED:` is scoped to the federalreserve.gov FOMC calendar, not to
a Reserve Bank's series metadata. Several sibling entries have now recorded the same taxonomy gap.

### Leg 2 — the Detroit outage is a **rolling one-month lag that backfills**, not an accumulating hole · **the sibling's framing is REVISED**

The [10-27 ledger](case-shiller-hpi-2026-10-27.md) calls this *"the most decision-relevant thing in
this ledger"* and reads it as suppression: *"Detroit has had no valid index update since at least the
January-2026 data"*, *"the outage has run at least six consecutive editions"*. Every quoted word is
accurate **per edition**. The characterization is not, and the release itself says so — the sibling's
excerpt stops one sentence early. In full:

> Cotality continues to have transaction delays from the recording office in **Wayne County**... no
> valid June 2026 update of the Detroit S&P Cotality Case-Shiller Index will be provided for the
> August 25, 2026, release date. **There was, however, enough data to calculate a valid May 2026
> update, which is provided in Tables 2 and 3. S&P DJI will continue to provide updates to the
> Detroit index values for the month(s) with missing sale transactions data.**

So the publisher is describing a **one-month deferral with backfill**, not a hole. **The live data
confirms it, and this is the measurement the sibling could quote but not check:**

| Series | Last observation, current FRED vintage (2026-09-09) |
|---|---|
| `CSUSHPINSA` national | **2026-06** |
| `CHXRNSA` Chicago · `ATXRNSA` Atlanta · `MIXRNSA` Miami · `SEXRNSA` Seattle · `PHXRNSA` Phoenix | **2026-06** (all five) |
| **`DEXRNSA` Detroit** | **2026-05** |

Detroit is behind by **exactly one month** — not six. And the decisive check: the **March-2026
release** announced that no valid **January-2026** Detroit update would be provided. Today
`DEXRNSA` carries **2026-01 = 195.422**, with 2026-02, -03, -04 and -05 all present and rising
(195.382 → 197.795 → 201.819 → 204.061). Every month the outage was announced for has since been
filled.

**Why the revision matters rather than merely being pedantic.** The sibling registered the recurrence
of the *notice* (`FT-case-shiller-hpi-2026-10-27-5`) and left as an open limit *"how the composite
treats a city with no valid update"*. Under the correct mechanism, the open question changes shape:
the 20-City Composite is not carrying a permanent gap, it is carrying a **one-month-stale
constituent** whose value arrives later. That is a much smaller data-integrity problem — and it is
directly checkable, which the notice test is not. This ledger therefore registers the **backfill**
(`-4`) rather than the notice: does `DEXRNSA` gain a **2026-06** observation after the 09-29 release?

**Honest limit.** This does *not* establish that the backfill is always one month. ALFRED was
unreachable from this runner (404, recorded), so the per-vintage history of the lag was not measured;
the claim rests on the publisher's stated policy plus one current cross-section. A longer outage
could still open a multi-month gap, and `-4` is the test that would catch it.

### Leg 3 — the sibling's undecided question, decided: the pre-open narrowing is **month-end flow** · **SUPPORTED**

The 10-27 ledger found the only near-significant readings in its nine-instrument open-gap table were
**SPY p=0.0604** and **QQQ p=0.0570**, both *narrower* on release days, and wrote the competing
explanation down honestly without picking:

> A calmer open on the last Tuesday of the month is at least as consistent with **month-end
> positioning** as with anything a house-price index does... This ledger prefers that explanation and
> registers the housing form of the claim as `-3` rather than asserting either.

That is testable, and this session tests it, because **09-29 is itself a quarter-end last Tuesday** —
Q3 ends the following morning, with two index-reweight effectives on it. The design is one change:
keep the release-day set, and replace the baseline of *all other sessions* with *other sessions inside
a month's last five trading days*. If the narrowing is a month-end property of the tape, it dies. If
it is something the release does, it survives.

**Panel A — reproduce the sibling first** (median |open ÷ prior close − 1|, %, 2021-01-01 →
2026-09-04, 20,000-iteration permutation on medians, n=68 release days):

| Instrument | release | all other sessions | p | sibling's p |
|---|---|---|---|---|
| SPY | 0.226 | 0.315 | 0.0579 | 0.0604 |
| QQQ | 0.294 | 0.423 | 0.0587 | 0.0570 |
| ITB | 0.428 | 0.488 | 0.4035 | 0.4090 |
| XHB | 0.430 | 0.495 | 0.2821 | 0.2870 |
| DHI | 0.604 | 0.597 | 0.9379 | 0.9291 |
| LEN | 0.559 | 0.599 | 0.6640 | 0.7041 |
| PHM | 0.694 | 0.613 | 0.4228 | 0.4071 |
| TOL | 0.536 | 0.644 | 0.2183 | 0.1996 |
| XLRE | 0.295 | 0.320 | 0.6330 | 0.5711 |

Independent fetch, independent date derivation, medians identical to three decimals. The sibling's
table is sound.

**Panel B — the discriminator** (same release days, baseline = other sessions in a month's last five
trading days, n=276):

| Instrument | release | month-end-matched baseline | p | vs Panel A |
|---|---|---|---|---|
| **SPY** | 0.226 | 0.301 | **0.1054** | 0.0579 → **0.1054** |
| **QQQ** | 0.294 | 0.422 | **0.1433** | 0.0587 → **0.1433** |
| ITB | 0.428 | 0.409 | 0.6751 | 0.4035 → 0.6751 |
| XHB | 0.430 | 0.492 | 0.2663 | 0.2821 → 0.2663 |
| DHI | 0.604 | 0.567 | 0.6892 | 0.9379 → 0.6892 |
| LEN | 0.559 | 0.511 | 0.5901 | 0.6640 → 0.5901 |
| PHM | 0.694 | 0.536 | 0.0984 | 0.4228 → 0.0984 |
| TOL | 0.536 | 0.583 | 0.6292 | 0.2183 → 0.6292 |
| XLRE | 0.295 | 0.310 | 0.8141 | 0.6330 → 0.8141 |

**Both near-misses collapse, and the effect sizes shrink with them** — SPY's baseline falls 0.315 →
0.301 and QQQ's 0.423 → 0.422 while the release-day medians are unchanged by construction, so a
meaningful share of the apparent narrowing was simply "this is a late-month session." Nine tests,
**zero** below p<0.05. PHM's 0.0984 is the wrong sign for the story anyway — release days are
*wider* there.

**Panel C — 09-29's own subset**: the 22 quarter-end last Tuesdays (Mar/Jun/Sep/Dec) against the 46
others. One hit in nine — **PHM 0.442 vs 0.863, p=0.0397** — against ~0.45 expected by chance at
n=22, so it is reported and not believed. Worth one line because the *direction* is consistent across
every housing name (ITB 0.367/0.502, XHB 0.320/0.497, DHI 0.444/0.699, LEN 0.462/0.660, TOL
0.376/0.607): **quarter-end last Tuesdays open quieter for homebuilders than ordinary ones.** That is
a hypothesis with 22 observations and no multiple-comparison control, so it is registered as `-5`
rather than asserted.

**And there is no directional edge either.** Signed open gaps on the 68 release days are a coin flip:
ITB **34/68** up (median +0.020%), XHB 35/68, SPY 36/68, PHM 36/68, DHI 35/68.

### Leg 4 — this is the **1-step** print, and that is the whole reason it earns a file · **SUPPORTED** (the proposal's central claim, confirmed)

The national index is a **three-month moving average at a two-month lag**. The proposal argued that
because of this, 09-29 halves the October print's uncertainty. Reproduced independently from FRED
(`CSUSHPISA` vs `HPIPONM226S`, m/m, 2015-01 → 2026-06, n=137 forecast errors):

| | Case-Shiller national SA | FHFA purchase-only SA |
|---|---|---|
| lag-1 autocorrelation of m/m | **0.9391** | 0.7740 |
| **1-step persistence MAE** | **0.1186pp** | 0.2183pp |
| zero-forecast MAE (the null) | 0.5439pp | 0.5707pp |
| median \|m/m\|, last 60 months | 0.3121pp | 0.3741pp |

The sibling's 0.119 / 0.218 / 0.939 / 0.312 reproduce to four decimals from an independent pull.
**Repeating last month's number removes 78% of the error.**

**What is new is the anchor.** The sibling sat at the **2-step** distance and registered a
correspondingly loose band. This edition sits at **1-step**, anchored on June's **+0.134%**, with
empirical 5th/95th percentiles of the 1-step error at **−0.314 / +0.200**:

|  | band on national SA m/m | width |
|---|---|---|
| **This print (1-step, July)** | **[−0.180%, +0.333%]** | **0.513pp** |
| 10-27 print (2-step, August) | [−0.30%, +0.57%] | 0.87pp |

**A 0.513pp band against a 0.312pp typical monthly move is as tight as this series ever gets** — and
that is exactly why it makes the better test. Registered as `-2`. If "pre-chewed" is going to fail
anywhere, it fails here first.

### Leg 5 — the July seasonal has decayed, and that is this edition's live headline hazard · **SUPPORTED**

The press release leads with the **NSA** month-over-month figure, and the current one primes the
reader for the usual summer pattern:

> Because June typically falls near the peak of the homebuying season, price appreciation often
> moderates and market activity cools in the months ahead.

That is directionally right and quantitatively stale. National NSA July m/m, by era (FRED
`CSUSHPINSA`):

| Era | n | mean | median | positive |
|---|---|---|---|---|
| 1988–2014 | 28 | **+0.554%** | +0.538% | 25 / 28 |
| 2015–2021 | 7 | **+0.730%** | +0.607% | 7 / 7 |
| **2022–2025** | 4 | **+0.035%** | −0.052% | **2 / 4** |

The last four Julys: **2022-07 −0.38 · 2023-07 +0.62 · 2024-07 +0.09 · 2025-07 −0.20.** The July
seasonal gain has effectively vanished, ~0.5pp below where three decades of history put it.

**The decision-relevant consequence:** a national NSA July m/m near **0.0%** is *normal under the
current regime* and will read as a **shock** against the historical seasonal any commentary will
reach for. This is a headline hazard, not an edge — nothing on this calendar holds an instrument that
could express it — but it is the single most likely way a reader of the 09-29 release misreads it.
Registered as `-3`.

**The nominal trend underneath is the opposite of the sector tape.** National NSA y/y troughed at
**+0.78% in March 2026** and has accelerated four months running: **+0.97 → +1.21 → +1.53%**, with the
20-City at **+2.10%** and the 10-City at **+2.91%**. Meanwhile the publisher's own real-terms framing
holds — *"for the 13th consecutive month, U.S. home values fell in real terms"*, June's 3.5% inflation
against a 1.5% gain. The base rate on direction is **169 of 174** months positive since 2012-01, and
the 1-step y/y persistence band for July (2023+ errors, n=41, MAE 0.4555pp) is **[+0.675%, +2.530%]**
— comfortably positive, which is why no y/y test is registered here; the sibling already owns that one
for August and it would be a duplicate under a second date.

**And the same morning carries a coin-flip disagreement risk.** FHFA's July monthly
([`fhfa-hpi-2026-09-29`](fhfa-hpi-2026-09-29.md)) publishes hours after this one for **the same
reference month**. Since 2015 the two agree in m/m sign **127 of 138 (92.0%)**, median gap 0.122pp,
correlation 0.892 — but since 2021 agreement loosens to **56 of 66 (84.8%)**, so roughly **one morning
in 6.6** the two national house-price indices print **opposite signs for the same month**. June set up
exactly that risk: FHFA **+0.025%** against Case-Shiller **+0.134%**, same sign but a whisker from
not. Registered as `-6` — it is the only test on this calendar that can only be run on a date where
both print.

### The adjacency sweep

- **Peer prints** — n/a, `symbols: []`.
- **Macro surprises** — no prior row exists; this is the baseline. **41 tracked events sit within five
  days**, which is the finding rather than the formality: **09-24** Trump–Xi summit (`high`),
  new-home sales, SCOOS, steel imports, the 7Y note, a 20–30Y buyback and the ECB bulletin; **09-25**
  durable goods and UMich final; **09-26** the UNSC Iran panel expiry; **09-28** Dallas Fed and two
  retail benchmark revisions; **09-29 this print at 09:00** with **FHFA HPI**, **JOLTS**, **Consumer
  Confidence**, a TIPS buyback, a 40Y JGB auction and the CoreWeave conference; **09-30 quarter-end**
  with **PCE** (`high`), the **FY2027 funding deadline** (`high`), **GDP Q2 third**, Chicago PMI, ADP,
  AEIR, the G20 trade ministerial, PJM's backstop window, **Russell style quarter-end recapping** and
  the **Select Sector secondary reweight**; **10-01** ISM manufacturing (`high`), BoJ Tankan,
  construction spending, a coupon announcement and a 10–20Y buyback; **10-02** the **September jobs
  report** (`high`); **10-04** OPEC+.
- **This refutes the proposal's own "cleaner slot" claim.** It filed on *"the 09-29 edition is also
  the cleaner slot of the two... unlike 10-27 it is not an FOMC day."* True and irrelevant: 41 events
  within five days against **24** around 10-27. `fhfa-hpi-2026-09-29` counted 32 on 2026-09-06 and
  made the same point for its own date; the corridor has since grown by nine. **Not-FOMC is not
  clean**, and on this date the contaminants are quarter-end index flows and a jobs-report week
  rather than a rate decision.
- **Volatility regime** — baseline. VIX **15.72** (2026-09-08), up from **14.53** (09-04) and 14.32
  (09-03). Equity closes at **2026-09-04**: SPY 770.19, QQQ 718.96, ITB 93.91, XHB 103.25, DHI 142.75,
  LEN 83.58, PHM 124.45, TOL 141.73, XLRE 43.93 — these reconcile **exactly** to the 09-04 anchors in
  both `fhfa-hpi-2026-10-27` and `case-shiller-hpi-2026-10-27` (SPY 770.19, ITB 93.91, VIX 14.53),
  the check that all four ledgers read one tape. **Honest gap:** Yahoo served this runner equity bars
  only through **09-04**, so the 2026-09-08 homebuilder breakdown the 10-27 sibling measured that day
  (LEN −3.84%, TOL −3.76%, PHM −3.52%, ITB −3.05% against SPY −0.55%) is **cited from that ledger, not
  re-measured here**. Only the VIX series reached 09-08 from this runner.
- **Geopolitical / policy** — the FHFA funding-lapse frame does not apply (S&P DJI is a private index
  provider), and in any case the 09-30 cliff was **averted**: PL 119-103, signed 2026-09-02, funds
  through 2026-12-11, per [`fhfa-hpi-2026-09-29`](fhfa-hpi-2026-09-29.md). Cited, not re-derived, and
  nothing here is premised on a lapse. The live operational risk for this publisher remains a **county
  recording office** — and Leg 2 shows it is a smaller risk than the sibling framed.
- **Event tape** — no July consensus exists at D-20 and this publisher issues none; S&P DJI publishes
  no margin of error. Every content statement above is a base rate, a published figure or a
  persistence band.
- **No new dated event is proposed.** This is a deliberate call, not an empty sweep. The corridor was
  read against the calendar and every dated thing in it — including the **10-27 August-data edition**
  that would be the obvious proposal — is **already tracked**. The **11-24** and **12-29** editions
  are real and named, but the 10-27 lane declined them on the record as backfill rather than
  adjacency, and proposing them from *this* lane a day later would be the same act under a new owner.
  The one genuinely undiscovered item — whether a **listed Case-Shiller derivative** still trades —
  has no date because the source cannot be reached (below).

### Honest limits

- **The Detroit revision rests on the publisher's stated policy plus one current cross-section, not on
  a vintage history.** ALFRED 404'd from this runner (recorded), so the per-edition lag was not
  measured. `-4` is the test designed to catch a multi-month gap if the mechanism is not what the
  publisher describes.
- **The month-end-matched baseline is a better control, not a clean one.** It removes late-month
  positioning; it cannot remove the other two publishers, who key on the same last Tuesday. The
  attribution problem the sibling established — all 68 release days are shared — is untouched by this
  session and remains the binding limit. Panel B raises the ceiling's confidence; it does not open a
  channel.
- **Panel C is 22 observations.** The homebuilder narrowing on quarter-end last Tuesdays is a pattern,
  not a result. It is registered so the next session scores it instead of rediscovering it.
- **The July-seasonal decay is four observations against thirty-nine.** 2022–2025 is a small sample
  and overlaps a genuine rate regime change, so "the seasonal has decayed" and "the seasonal is
  temporarily suppressed by rates" are not distinguished here. `-3` scores the prediction either way.
- **The date's second primary changed between this ledger and the proposal that created the id.** Both
  are legitimate primaries and both name 2026-09-29; but a future lane should know that the FRED
  *release calendar* is not readable from a plain fetcher and the FRED *series page* is.
- **The CME question is not merely open, it is unreachable.** Two independent environments, two
  different failure modes (403 on 2026-09-08, connection failure on 2026-09-09). If a listed
  Case-Shiller contract still trades, this would be the only entry on this calendar with a directly
  keyed instrument and `symbols: []` would need re-arguing rather than inheriting. Answering it needs
  a different path — a filing, a broker's product list — not another fetch of the same page.
- **`symbols: []` is doing real work.** The nine instruments were measured because they are the
  obvious candidates for a house-price print, not because anything holds them. A clean, significant,
  right-signed result would still have had nothing to express it in.
- **The date is `estimate` and every statement above honors that.** Nothing here is date-keyed action.

## Stance & kill switches

**Stance (date is `estimate`; the label is a taxonomy gap, not date doubt).** **Stand aside on
2026-09-29, and read this print as a thermometer, never a trigger** — the same call the 10-27 sibling
reached, arrived at independently and with three of its supporting claims moved. **On identity:** the
proposal's central argument is **confirmed and sharpened**. This is the **1-step** print, and its 90%
band on the national SA m/m — **[−0.180%, +0.333%]**, width **0.513pp** against a 0.312pp typical
monthly move — is the tightest this series ever offers, which makes it the best available test of the
"pre-chewed" finding the family's stand-aside rests on. **On the slot:** the proposal's secondary
claim is **refuted on its own metric**. 09-29 is the **dirtier** slot, not the cleaner one — **41**
tracked events within five days against 24, with quarter-end, PCE, GDP, ISM and the September jobs
report inside the corridor. Not-FOMC is not clean. **On the tape:** the sibling's one undecided
question is **decided**. Its SPY/QQQ pre-open near-misses (p=0.0604 / 0.0570) **do not survive a
month-end-matched baseline** — they move to **0.1054 / 0.1433**, effect sizes shrink, and nine tests
return zero hits. The month-end-flow explanation it preferred is now supported. **On the defect:** the
Wayne County outage is a **rolling one-month lag that backfills**, stated by the publisher in the
clause the sibling's excerpt stops before and measured in the live vintage — Detroit ends 2026-05
while the national index and five peer cities end 2026-06, and January 2026 is present today. The
20-City Composite carries a one-month-stale constituent, not a permanent hole. **On the one hazard
that is genuinely this edition's:** the **July NSA seasonal has decayed** from +0.554% (1988–2014) to
+0.035% (2022–2025), so a ~0.0% headline will read as a shock when it is now normal. Nothing here
licenses an entry, and there is no instrument to enter.

**Kill switches** — any one of these ends the stance above and earns a ledger row:

- **The release does not land on 2026-09-29.** Registered as `-1`. A private index provider dependent
  on county recording offices, publishing with a live data lag, is not the near-formality FHFA is.
- **The July-2026 national SA m/m lands outside [−0.180%, +0.333%]**, the 1-step persistence 90% band
  anchored on June's +0.134%. Registered as `-2`. This is the tightest form of the family's central
  claim; a miss here means the moving-average smoothing does not bind as 137 observations say, and the
  whole "pre-chewed" argument needs re-deriving rather than defending — including on 10-27.
- **The July-2026 national NSA m/m prints at or above +0.554%**, the 1988–2014 July mean. Registered
  as `-3`. The seasonal has not decayed, the `This quarter` framing is wrong, and the headline hazard
  this ledger names does not exist.
- **`DEXRNSA` does not gain a 2026-06 observation after the 09-29 release.** Registered as `-4`. The
  backfill mechanism the publisher states is not operating, the outage is accumulating after all, and
  the sibling's original framing was right — in which case the 20-City Composite's integrity is a
  materially larger question than this ledger credits.
- **ITB's 2026-09-29 open gap reaches 0.669%**, its quarter-end-last-Tuesday p75 (n=22). Registered as
  `-5`. Deliberately tighter than the sibling's all-68 0.844% threshold, because this date belongs to
  the quarter-end subset.
- **Case-Shiller and FHFA print opposite July m/m signs on the same morning.** Registered as `-6`.
  A 1-in-6.6 event since 2021 — and the one test on this calendar that requires a date where both
  publish.
- **Any of the nine instruments prints a release-day median open gap above its own baseline at p<0.05
  with the right sign against the MONTH-END-MATCHED baseline**, on a re-run after 2026-12-29. Panel B
  is the ceiling; a right-signed hit against the matched control would reopen the channel.
- **CME (or anyone) is confirmed to list a live, quoted Case-Shiller derivative.** Two environments
  have now failed to reach the source. A live contract keyed to this index would make `symbols: []`
  something to re-argue rather than inherit.
- **A macro-keyed house playbook lands in `docs/plans/trade-playbooks.md` before 2026-09-29.**

**Registered predictions** (zero capital by design, scored from re-run data, never from memory) — see
[`forward-tests/case-shiller-hpi-2026-09-29.md`](../forward-tests/case-shiller-hpi-2026-09-29.md):

- `FT-case-shiller-hpi-2026-09-29-1` — the **release lands on 2026-09-29**. Score by 2026-10-06.
- `FT-case-shiller-hpi-2026-09-29-2` — the **July-2026 national SA m/m lands inside [−0.180%,
  +0.333%]**, the 1-step persistence 90% band. Score by 2026-10-06.
- `FT-case-shiller-hpi-2026-09-29-3` — the **July-2026 national NSA m/m prints below +0.554%**, the
  1988–2014 July mean — the decayed-seasonal claim. Score by 2026-10-06.
- `FT-case-shiller-hpi-2026-09-29-4` — **`DEXRNSA` gains a 2026-06 observation** after this release —
  the backfill mechanism, and the sharp form of the Detroit revision. Score by 2026-10-06.
- `FT-case-shiller-hpi-2026-09-29-5` — **ITB's 2026-09-29 open gap is below 0.669%**, its
  quarter-end-last-Tuesday p75. Score by 2026-09-30.
- `FT-case-shiller-hpi-2026-09-29-6` — **Case-Shiller and FHFA agree in July m/m sign** on the same
  morning. Score by 2026-10-06.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-09 | D-20 | **Initial research on an id that existed only as `proposals/case-shiller-hpi-2026-09-29.from-case-shiller-hpi-2026-10-27.json`; canonical `src/domain/market-events/case-shiller-hpi-2026-09-29.json` written after reading it, now shadowed.** The proposal was filed one day earlier *by* the October lane *about* the October print, so this session asked only what is true of 2026-09-29 itself. **Its central claim is confirmed and sharpened; its secondary claim is refuted; and two of the sibling ledger's readings are revised.** **Leg 1 — date SUPPORTED, stays `estimate` on taxonomy.** Publisher's rule verbatim in the current release (press.spglobal.com 2026-08-25 June-data, HTTP 200, 90,693 bytes): *"published on the last Tuesday of each month at 9:00 am ET"*; September 2026's last Tuesday is the 29th, and the stated two-month lag puts **July 2026** data on it. **The second primary had to be replaced:** the proposal cited `fred.stlouisfed.org/releases/calendar?rid=199`, which returns **HTTP 200 with zero release dates in the payload** from this runner (client-side table; recorded blocked as `NO_DATA_RENDERED`, not cited). Replaced by a stronger one — FRED's **series page for `CSUSHPINSA`** (HTTP 200, 80,115 bytes) states **"Next Release Date: Sep 29, 2026"** beside *"Jun 2026: 336.663, Updated: Aug 27, 2026"*. `estimate` purely on `CONFIRMED_PREFIX` having no member for an index provider. **Leg 2 — THE DETROIT OUTAGE IS A ROLLING ONE-MONTH LAG THAT BACKFILLS, not an accumulating hole; the 10-27 sibling's framing is revised.** Its excerpt stops one sentence short of the publisher's own mechanism: *"There was, however, enough data to calculate a valid **May 2026** update... **S&P DJI will continue to provide updates to the Detroit index values for the month(s) with missing sale transactions data**."* Measured in the live FRED vintage: **`DEXRNSA` ends 2026-05** while `CSUSHPINSA` and **all five** peer cities pulled (`CHXRNSA`, `ATXRNSA`, `MIXRNSA`, `SEXRNSA`, `PHXRNSA`) end **2026-06** — behind by exactly one month, not six. Decisive check: the March-2026 release said no valid **January-2026** Detroit update would be provided, and `DEXRNSA` today carries **2026-01 = 195.422** with Feb–May all present and rising. So the 20-City Composite carries a **one-month-stale constituent**, not a permanent gap — a materially smaller integrity problem, and a directly checkable one, which is why this lane registers the **backfill** (`-4`) rather than the recurrence of the notice. **Leg 3 — the sibling's one UNDECIDED question is decided: the pre-open narrowing is month-end flow.** It found SPY p=0.0604 / QQQ p=0.0570 (both *narrower* on release days), preferred a month-end-positioning story and declined to assert it. Panel A reproduces its all-68 open-gap table from an independent fetch and an independently derived last-Tuesday set (SPY 0.226/0.315 p=0.0579 · QQQ 0.294/0.423 p=0.0587 · ITB 0.428/0.488 p=0.4035 · XHB 0.430/0.495 p=0.2821 · DHI 0.604/0.597 p=0.9379 · LEN 0.559/0.599 p=0.6640 · PHM 0.694/0.613 p=0.4228 · TOL 0.536/0.644 p=0.2183 · XLRE 0.295/0.320 p=0.6330). **Panel B swaps the baseline for other sessions inside a month's last five trading days (n=276) and both near-misses collapse: SPY 0.0579 → 0.1054, QQQ 0.0587 → 0.1433**, with baselines falling 0.315→0.301 and 0.423→0.422. Nine tests, **zero** at p<0.05; PHM's 0.0984 is *wider* on release days, the wrong sign. **The flow explanation is now supported, not merely preferred.** Panel C — 09-29's own subset, the 22 quarter-end last Tuesdays vs 46 others — returns one hit in nine (**PHM 0.442/0.863 p=0.0397**) against ~0.45 expected, reported and not believed; but the direction is consistent across every housing name (ITB 0.367/0.502, XHB 0.320/0.497, DHI 0.444/0.699, LEN 0.462/0.660, TOL 0.376/0.607), so **quarter-end last Tuesdays open quieter for homebuilders** is registered as `-5` rather than asserted. No directional edge either: signed gaps are a coin flip (ITB 34/68 up, median +0.020%). **Leg 4 — this is the 1-step print, which is the whole reason it earns a file.** FRED `CSUSHPISA` vs `HPIPONM226S`, m/m, 2015+, n=137, reproduces the sibling to four decimals: lag-1 autocorrelation **0.9391 vs 0.7740**, **1-step persistence MAE 0.1186pp vs 0.2183pp**, zero-forecast 0.5439/0.5707pp, median \|m/m\| last 60m **0.3121pp**. What is new is the anchor: June's **+0.134%** with 1-step error quantiles **−0.314 / +0.200** gives a **90% band of [−0.180%, +0.333%], width 0.513pp — against the October edition's 2-step 0.87pp.** The tightest edition this series offers, and therefore the sharpest test of "pre-chewed" (`-2`). **Leg 5 — the July seasonal has decayed, and that is this edition's live headline hazard.** The release leads with **NSA** m/m and primes the usual summer pattern (*"June typically falls near the peak of the homebuying season"*). National NSA July m/m by era: **1988–2014 mean +0.554% (25/28 positive) · 2015–2021 +0.730% (7/7) · 2022–2025 +0.035% (2/4)**, last four Julys −0.38, +0.62, +0.09, −0.20. **A ~0.0% July headline is normal now and will read as a shock against a ~0.5pp-stale seasonal** (`-3`). Underneath, nominal y/y is **accelerating** against the sector tape's story — troughed **+0.78% (Mar 2026)** → +0.97 → +1.21 → **+1.53%**, 20-City **+2.10%**, 10-City **+2.91%**, 169 of 174 months positive since 2012-01, 30y mortgage **6.71%** (2026-09-03) vs 6.50% a year earlier — while the publisher's real-terms line holds (*"13th consecutive month"*, 3.5% inflation vs 1.5% gain). No y/y test registered: the 1-step y/y band (2023+, n=41, MAE 0.4555pp) is **[+0.675%, +2.530%]** and the sibling already owns that test for August. **Same-morning disagreement measured and registered (`-6`):** FHFA publishes July hours later for the same reference month; sign agreement **127/138 (92.0%)** since 2015, median gap 0.122pp, corr 0.892, but **56/66 (84.8%) since 2021 — one morning in 6.6 they print opposite signs**, and June was close (FHFA +0.025% vs CS +0.134%). **Adjacency sweep — peers:** n/a, `symbols: []`. **Macro: 41 tracked events within five days, which REFUTES the proposal's own "cleaner slot of the two" claim** (it filed on 09-29 not being an FOMC day) — 41 against **24** around 10-27; `fhfa-hpi-2026-09-29` counted 32 on 09-06 and made the same point. The contaminants here are quarter-end and jobs week, not a rate decision: 09-24 Trump–Xi (`high`) + new-home sales + SCOOS + 7Y note; 09-25 durable goods + UMich final; 09-28 Dallas Fed + two retail benchmark revisions; **09-29 this print 09:00** + **FHFA HPI** + **JOLTS** + **Consumer Confidence** + TIPS buyback + 40Y JGB; **09-30 quarter-end** with **PCE** and the funding deadline (both `high`), **GDP Q2 third**, Chicago PMI, ADP, AEIR, **Russell style recapping** and the **Select Sector secondary reweight**; 10-01 **ISM** (`high`) + Tankan; 10-02 **September jobs** (`high`); 10-04 OPEC+. **Volatility:** baseline VIX **15.72** (2026-09-08) from 14.53 (09-04); equity closes 2026-09-04 SPY 770.19 · QQQ 718.96 · ITB 93.91 · XHB 103.25 · DHI 142.75 · LEN 83.58 · PHM 124.45 · TOL 141.73 · XLRE 43.93, reconciling **exactly** to the 09-04 anchors in both `fhfa-hpi-2026-10-27` and `case-shiller-hpi-2026-10-27`. **Honest gap: Yahoo served this runner equities only through 09-04**, so the 09-08 homebuilder breakdown (LEN −3.84%, ITB −3.05% vs SPY −0.55%) is **cited from the 10-27 ledger, not re-measured**. **Geopolitical:** the FHFA lapse frame does not apply (private provider) **and the 09-30 cliff was averted anyway** — PL 119-103 signed 2026-09-02, funds through 12-11, cited from `fhfa-hpi-2026-09-29` and not re-derived. **Event tape:** no July consensus at D-20; S&P DJI publishes no margin of error. **NO new dated event proposed — a deliberate call:** every dated item in the corridor including the 10-27 edition is already tracked, and the 11-24 / 12-29 editions were declined on the record by the 10-27 lane as backfill rather than adjacency; re-proposing them from this lane a day later would be the same act under a new owner. **Four blocked fetches recorded, never substituted:** **ALFRED 404** from this runner (bot protection visible in the body) so **no revision study was attempted** and the sibling's is cited; the FRED **release calendar** 200-with-no-dates; the S&P DJI indicator page **403** for the fifth consecutive lane; **cmegroup.com connection failure** — which, with the sibling's 2026-09-08 403, means the listed-derivatives question is now **unreachable from two independent environments**, escalating it from an open limit to a source needing a different path. **Six forward tests registered.** | **Initial stance set: stand aside, thermometer never trigger — the same call the 10-27 sibling reached, arrived at independently, with three of its supporting claims moved. CONFIRMED: this is the 1-step print and its [−0.180%, +0.333%] band (0.513pp) is the tightest this series offers, making it the family's sharpest test of "pre-chewed." REFUTED: the proposal's "cleaner slot" — 41 events within five days against 24, so not-FOMC is not clean. DECIDED: the sibling's undecided pre-open near-misses are month-end flow — SPY 0.0579→0.1054 and QQQ 0.0587→0.1433 against a month-end-matched baseline, nine tests zero hits. REVISED: the Wayne County outage is a rolling one-month lag that backfills (publisher's own clause + DEXRNSA one month behind five peers, with the announced-missing January present today), not an accumulating hole — so the 20-City carries a stale constituent, not a permanent gap. NEW HAZARD: the July NSA seasonal has decayed from +0.554% (1988–2014) to +0.035% (2022–2025), so a ~0.0% headline is normal now and will read as a shock. Date `estimate` on taxonomy alone, on a second primary this lane had to replace because the proposal's did not render. CME unreachable from two environments — symbols: [] inherited, not re-argued.** | 2026-10-09 (low, 15+ band: every 30d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-case-shiller-hpi-2026-09-29.json`
(`status: "estimate"`) in the same PR — your own file, never another event's canonical one (#1717).
Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from
memory — after which this doc goes quiet.
