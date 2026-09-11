# UK labour market overview — earnings, unemployment and vacancies — uk-labour-market-2027-03-16

**Kind:** macro-print · **Date:** 2027-03-16 (estimate, EST: two UK-government primaries re-fetched direct 2026-09-10, both HTTP 200 — gov.uk/government/statistics/announcements/uk-labour-market-march-2027 reads "UK Labour Market: March 2027", "16 March 2027 7:00am (confirmed)", producer ONS, designation "Accredited official statistics", page published 30 June 2026; ons.gov.uk/releases/uklabourmarketmarch2027 reads "16 March 2027 at 7:00am", "Not yet published". Filed estimate per this lane's no-self-confirm limit and the confirmed-prefix taxonomy's lack of an ONS slot) · **Impact:** low
**Last assessed:** 2026-09-10
<!-- probe-ref: {"symbols":{},"vix":17.84,"daysBand":"low:15+","adjacentIds":["boj-decision-2027-03-18","fomc-2027-03-17","japan-cpi-2027-03-19","opex-2027-03-19","sp-rebalance-reference-close-2027-03-12","tic-monthly-2027-03-18","vix-expiration-2027-03-17"],"screenStreak":0,"blocked":[]} -->

## At a glance

**TL;DR.** **The chain was right about where this milestone lands, and this lane measured whether the
milestone means anything. It does not.** Five UK labour ledgers have hunted the first ONS release whose
average-weekly-earnings window falls wholly after the **2026-10-28** Budget. It is this one — confirmed
here from the **same-month anchor** rather than a rolled habit: the **19 March 2026** bulletin carries
*"November 2025 to January 2026"*, so a March release is exactly where a Nov–Jan window lands, and this
release carries **Nov 2026 – Jan 2027**. Then the new part. On the ONS's **own** private-sector
regular-pay series (**KAJ4**, 304 monthly observations from 2001, pulled firsthand), the change at that
boundary across the **four** Autumn Budgets with data was **+0.2, +0.4, −0.3, −0.1pp** — **signed mean
+0.05pp, sign 2–2, a coin flip**, against an ordinary-month mean of **0.183pp**. **The milestone is a
calendar label, not a signal, and the honest call is to retire the question rather than keep tracking
it.** Where a Budget would actually bite is **April 2027**, outside this window entirely — published
**2027-06-15**, proposed in this PR. **Nothing here is ours to trade**: `symbols: []`, no rates- or
sterling-keyed playbook. Date is **estimate**; it widens caution and licenses nothing.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — nothing here is ours to hold | High | `symbols: []`, this repo tracks no UK-listed symbol, no rates- or sterling-keyed playbook, and at **D-187** there is no position a 02:00 ET foreign data print could be sized into | A tracked name (NVDA/AVGO/MRVL/CRWV) moving **>1%** in the **02:00–09:30 ET** window on **2027-03-16** attributable to the ONS release — the "no price channel" premise would be false and this doc is rebuilt |
| This week | **Retire "first wholly post-Budget window" as a tracked question — it is measured and empty** | High (on the measurement) / Medium (on n=4) | Across the four Autumn Budgets with data the boundary delta was **+0.2 / +0.4 / −0.3 / −0.1pp**: signed mean **+0.05pp**, `t(3) = 0.32`, mean absolute **0.25pp** against a 287-month control mean of **0.183pp** and sd **0.245pp**. **Two up, two down** | The **2027-03-16** release printing a private-sector regular-pay change **>0.4pp** against the Oct–Dec 2026 figure (**FT-…-1**) — larger than any of the four Budget boundaries and past the control's **p90**; the boundary would look special after all |
| This month | **Register the absolute level the chain deferred — and publish its error bar, which is the real finding** | High (on the band) / Low (on any point estimate) | Backtested firsthand: at a **7-month** horizon, **hold-last** beats trailing-drift extrapolation (**MAE 0.70 vs 0.99pp**, sd **0.90 vs 1.41**). So the tempting *"KAJ4 is falling 0.1pp/month, it will be 2.1"* is a **measurably worse** forecast than *"2.8"*. The honest band is **2.8 ± 1.2pp (p80)** — too wide to trade, which is precisely why no absolute threshold in this chain was ever a signal | Nov 2026 – Jan 2027 private regular pay landing **outside 1.6%–4.0%** (**FT-…-2**) — the hold-last instrument would be miscalibrated at this horizon and the band understated |
| This quarter | **Watch 2027-06-15, not this print — April is where incidence lands** | Medium | UK employer-cost measures conventionally take effect the following April (Autumn Budget 2024-10-30 → NICs 13.8%→15% in **April 2025**). A 2026-10-28 Budget bites **April 2027**, whose first containing window is **Feb–Apr 2027**, published **2027-06-15** (*"(confirmed)"*, gov.uk register, fetched today). At that boundary the four Budgets gave **0.0 / −0.1 / −0.4 / −0.1pp** — **no positive in four** | The **2026-10-28** Budget announcing an employer-cost measure effective **before April 2027** — the April-incidence framing would not apply to this Budget and the 2027-06-15 venue loses its claim |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit, hedge or size is keyed to 02:00 ET on 2027-03-16. A `low`-tiered, `symbols: []`, foreign data print is a reading assignment, not a trade.
- **The question to close** — *"which release is the first wholly post-Budget one"* is **answered (this one) and empty (measured)**. Five documents is four too many; the chain should stop re-deriving it.
- **The number the chain deferred, now stated with its band** — private regular pay **2.8%** ± **1.2pp** at p80 (**1.6%–4.0%**) for Nov 2026 – Jan 2027. The width **is** the message.
- **The extrapolation NOT to make** — KAJ4 has fallen **16 consecutive months**, the **longest run in the 25-year series** (previous max 12m, ending 2024 AUG). Straight-lining it to **2.1%** is measurably worse than holding **2.8%**.
- **The revision tolerance nobody has stated** — of **6** bulletin-published figures re-checked against today's vintage, **3 revised by 0.1pp**. Every one-decimal wage test in this chain can be flipped by a revision alone (**FT-…-3**).
- **The attribution rule, and this corridor is the LOUDEST of the six UK labour entries** — **fomc-2027-03-17 at D+1** and **opex-2027-03-19 at D+3** are both `high`; `boj-decision-2027-03-18` is `medium` at D+2; and **`fomc-blackout-start-2027-03-06` at D-10** means the print lands **inside a Fed blackout on the eve of an FOMC decision**. The 01-19 sibling's corridor was the thinnest of five; this is its inverse.
- **The placement question deliberately NOT re-registered** — 2027-03-18 is *"March MPC Summary and minutes"*, provisional (Bank's own page, fetched today): a **non-Report** round at **D+2**, the identical geometry the [`12-15`](uk-labour-market-2026-12-15.md) lane already settled from the March and June 2026 precedents. A third copy adds a row and no information.
- **The UK run is NOT two days this time** — UK CPI for this cycle is **2027-03-24** (proposal only), **eight** days later, unlike the January pairing.
- **Watch (dated)** — **Budget + OBR EFO 2026-10-28** (est) · **BoE + MPR 2026-11-05** · **ONS labour 11-17 · 12-15** (est) · **BoE 12-17** · **ONS labour 2027-01-19 · 2027-02-16** (est) · **BoE + MPR 2027-02-04** (prov) · **FOMC 2027-03-17** · **this print 2027-03-16** (est) · **BoE 2027-03-18** (prov, proposal only) · **UK CPI 2027-03-24** (est, proposal only) · **BoE + MPR 2027-04-29** · **ONS labour 2027-06-15** (est, proposed here — the April-incidence venue).

## Initial research

### The question, plainly

This event existed in the calendar as **one proposal and no canonical file**:
`proposals/uk-labour-market-2027-03-16.from-uk-labour-market-2027-01-19.json`. It was read in full before
anything was written, every primary it cites was **re-fetched** rather than inherited, and the canonical
`src/domain/market-events/uk-labour-market-2027-03-16.json` is written in this PR **with a changed title**.

Five sibling ledgers have already done work this one must not repeat.
[`09-15`](uk-labour-market-2026-09-15.md) did the **anatomy**. [`10-20`](uk-labour-market-2026-10-20.md)
did the **re-anchoring**. [`11-17`](uk-labour-market-2026-11-17.md) did the **window arithmetic** and the
**April-lag precedent**. [`12-15`](uk-labour-market-2026-12-15.md) closed the **D-2 placement** question.
[`2027-01-19`](uk-labour-market-2027-01-19.md) found that the chain's own correction was **off by one
release** and pointed at this one.

That leaves this document a question none of them asked, and it is the obvious one that four documents of
arithmetic never got round to:

**The chain has spent five documents locating this release. Does arriving here tell anyone anything?**

**One-line verdict:** the destination is **confirmed** — and by better evidence than the chain had — but
the milestone is **empty**: measured across four Autumn Budgets on the ONS's own series, the
first-wholly-post-Budget boundary moves private-sector pay growth by a **coin flip**, so the honest
output of this lane is to **retire the question** and name the venue where incidence actually lands.

**Method:** sourced web research per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md), plus a
**quantitative instrument no sibling in this chain used**. Fetched direct today (2026-09-10), all HTTP
200 unless noted: the gov.uk statistics announcements for **UK labour market March 2027** and **June
2027**; the ONS release-calendar entry for **March 2027**; the ONS labour market bulletins for **March
2026**, **March 2025**, **February 2025**, **April 2025** and **June 2025**; the Bank of England
**upcoming MPC dates** page. The instrument is the **ONS time-series `/data` endpoint** on
`ons.gov.uk` — **KAJ4** (private-sector regular pay, three-month-average year-on-year, seasonally
adjusted, excluding arrears), **KAI9** (whole economy, same basis) and **KAJ7** (public sector), **304
monthly observations each from 2001**. One fetch failed and is recorded rather than substituted:
`api.ons.gov.uk/timeseries/...` returned **404** with the body *"This API has been decommissioned … fully
retired on 25/11/2024"* — a **decommissioned endpoint, not a blocked source**, and the live
`www.ons.gov.uk/…/timeseries/<id>/lms/data` path served every query, so `probe-ref.blocked` stays empty
(the [`01-19`](uk-labour-market-2027-01-19.md) lane's 404-is-not-a-block distinction, applied). No price
instruments run: `symbols: []`, no issuer, and `earnings-cycle.mjs` / `intraday-edges.mjs` have no macro
mode. VIX read from Yahoo `^VIX` at **17.84** (2026-09-10 close).

### Conviction legs, tested

1. **The date and time are the publisher's own, twice over, and one says "confirmed."** SUPPORTED,
   primary, two independent UK-government pages re-fetched today. The gov.uk statutory pre-announcement
   register reads *"UK Labour Market: March 2027"*, *"16 March 2027 7:00am (confirmed)"*, producer
   **Office for National Statistics**, designation **"Accredited official statistics"**, announcement page
   published **30 June 2026**. The ONS release-calendar entry reads *"16 March 2027 at 7:00am"*, **"Not
   yet published"**. The `estimate` label is about this lane's no-self-confirm limit and the taxonomy's
   missing ONS prefix, not the evidence.

2. **The chain's destination is right, and this lane upgraded the evidence rather than repeating it.**
   SUPPORTED. The [`01-19`](uk-labour-market-2027-01-19.md) lane established that this release carries the
   first wholly post-Budget AWE window by **rolling the window rule forward** from the 18 August 2026
   bulletin — an inference on a publication habit, which that lane named as its own weakest link. This
   lane read the **same-month anchor** instead. The bulletin *"Released 19 March 2026"* carries:

   | Series | Reference period on the 19 March 2026 bulletin |
   |---|---|
   | AWE and LFS (employment, unemployment, inactivity) | **"November 2025 to January 2026"** |
   | Vacancies | **"December 2025 to February 2026"** |
   | Payrolled employees, flash | **February 2026** |

   A **March** release is therefore exactly where a **Nov–Jan** window lands — not by habit rolled across
   seven months, but by the same calendar month one year earlier. Rolled to **2027-03-16**: **Nov 2026 –
   Jan 2027** AWE/LFS, **Dec 2026 – Feb 2027** vacancies, **February 2027** payroll flash. The
   2026-10-28 Budget precedes **every day** of that AWE window; the February 2027 release's **Oct–Dec
   2026** window does not (27 of October's 31 days precede Budget day). **The chain's answer stands.**

   The window rule is **not re-registered** as a forward test. `FT-uk-labour-market-2027-01-19-1` scores
   exactly that rule on the **2026-09-15** bulletin, **five days** from today and **187 days** before this
   print. A second registration would add a row and no information — the same restraint the 01-19 lane
   applied to the designation question.

3. **The milestone carries no measured information. This is the headline, and it is a refusal.**
   SUPPORTED, and it is the first quantitative test anyone in this chain has run on the premise five
   documents have been built on. If *"first wholly post-Budget AWE window"* names something real, the
   private-sector pay series should do something unusual at that boundary. **KAJ4** was pulled firsthand
   and checked against the published record before use: its current vintage reproduces the **18 August
   2026** bulletin exactly — **private 2.8** (Apr–Jun 2026), whole economy **3.5** (KAI9), public **6.1**
   (KAJ7). The instrument is sound. Then, for each Autumn Budget, the change in KAJ4 between the last
   **straddling** window and the first **wholly post-Budget** one:

   | Autumn Budget | First wholly post-Budget window (end month) | Prior | Boundary | Δ | Percentile of \|Δ\| in control |
   |---|---|---|---|---|---|
   | 2017-11-22 | 2018 FEB | 2.7 | 2.9 | **+0.2** | 49% |
   | 2021-10-27 | 2022 JAN | 4.1 | 4.5 | **+0.4** | 89% |
   | 2024-10-30 | 2025 JAN | 6.2 | 5.9 | **−0.3** | 75% |
   | 2025-11-26 | 2026 FEB | 3.3 | 3.2 | **−0.1** | 18% |

   Control = every month-on-month change in KAJ4, 2001–2026, excluding 2020-03 to 2021-06 (**n = 287**):
   mean **|Δ| 0.183pp**, median **0.2**, sd **0.245**, p90 **0.4**, p95 **0.5**.

   - **Signed mean +0.05pp**, sd 0.311, **t(3) = 0.32**.
   - **Mean |Δ| 0.250pp** against the control's **0.183pp**.
   - **The sign is two up, two down.** The percentiles scatter across the control distribution — 18%,
     49%, 75%, 89% — which is what a draw from the control looks like.

   **The honest statement of power, because n=4 is four.** This test can detect an effect of roughly
   **0.49pp** at 80% power against a control sd of 0.245. The observed signed mean is **0.05pp**. So the
   finding is *"no effect large enough to matter is detectable, and a small one could hide"* — **not**
   *"proven zero"*. That is still decisive for the only use anyone would make of it: a signal you cannot
   distinguish from an ordinary month at n=4 is not a signal you size a position with.

   **What follows is a call, not an observation.** Five documents have treated locating this release as
   the work. The work was worth doing **once** — a reference-window mapping is real and reusable. Treating
   the arrival as informative is the error, and the correction is to **retire the question**.

4. **Where a Budget would actually bite is April, and it is outside this window entirely.** SUPPORTED by
   precedent, carried and extended. The [`11-17`](uk-labour-market-2026-11-17.md) lane's April-lag finding
   stands unamended: Autumn Budget **2024-10-30** raised secondary Class 1 NICs **13.8% → 15%** effective
   **April 2025**. UK employer-cost measures conventionally commence at the start of the tax year, so a
   **2026-10-28** Budget bites in **April 2027** — and **April 2027 is not in this release's Nov–Jan
   window**. The first window containing it is **Feb–Apr 2027**, published **2027-06-15** (*"15 June 2027
   7:00am"*, status *"Confirmed"*, gov.uk register fetched today), **proposed in this PR**.

   Running the same instrument at that boundary — the first window **containing** the April in which each
   Budget's measures commenced:

   | Autumn Budget | Incidence window (end month) | Prior | Boundary | Δ |
   |---|---|---|---|---|
   | 2017-11-22 | 2018 APR | 3.0 | 3.0 | **0.0** |
   | 2021-10-27 | 2022 APR | 5.3 | 5.2 | **−0.1** |
   | 2024-10-30 | 2025 APR | 5.6 | 5.2 | **−0.4** |
   | 2025-11-26 | 2026 APR | 3.1 | 3.0 | **−0.1** |

   **No positive in four**, where the announcement boundary was 2–2. That asymmetry is the one genuinely
   suggestive result in this document — and it is **graded down hard on purpose**: three negatives and a
   tie give a one-sided sign test of **p = 0.125**, every magnitude sits inside the control's ordinary
   noise, and the largest (**−0.4pp**) belongs to the Budget whose NICs rise was the most direct employer
   cost shock in the set. **This names the right place to look. It does not name a trade**, and it is
   filed as a **proposal** rather than a forward test precisely because it cannot be scored here (leg 6).

5. **The absolute wage threshold the chain deferred can now be stated — and its error bar is the finding.**
   SUPPORTED. The [`01-19`](uk-labour-market-2027-01-19.md) lane declined to set an absolute level because
   the July 2026 MPR publishes no 2026 Q4 private-AWE path, and **dated** the deferral to the first pulse
   after 2026-11-05. That refusal was right, but its stated reason was *"we lack the Bank's path"*. With
   the series in hand this lane can test whether a path would have helped, by asking how well **any**
   extrapolation does at this horizon. Backtest, 7 months ahead (Jun-2026 window → Jan-2027 window),
   2001–2026 ex-COVID, **n = 268**:

   | Forecast | Bias | MAE | sd | p80 \|err\| | p90 \|err\| |
   |---|---|---|---|---|---|
   | **Hold-last** | −0.09 | **0.70** | **0.90** | **1.2** | 1.6 |
   | Trailing-6m linear drift | −0.03 | 0.99 | 1.41 | 1.5 | 2.0 |

   **Two results, and the counter-intuitive one is the useful one.** First, **linear extrapolation is
   worse than doing nothing** — MAE **0.99 vs 0.70**. KAJ4 has fallen for **16 consecutive months** (4.9 →
   2.8), the **longest run in the 25-year series**; the pull to straight-line that to **2.1%** is strong
   and it is **measurably a mistake**. Second, even the better instrument carries **p80 error of 1.2pp**
   at this horizon. So the honest absolute registration is **2.8% ± 1.2pp → 1.6%–4.0%**, a band so wide
   that **no absolute threshold at D-187 could have been a signal, with or without the Bank's path**. That
   **generalises** the 01-19 lane's refusal from *"we lack a number"* to *"the horizon cannot carry one"*,
   which is the stronger and more portable claim.

6. **One forward test is deliberately NOT registered, and the restraint is inherited.** SUPPORTED. The
   April-incidence test of leg 4 is the most interesting hypothesis in this document, and it scores on
   **2027-06-15** — three months **after** this ledger's close-out window (`closeOutWithinDays: 6` from
   2027-03-16). The [`01-19`](uk-labour-market-2027-01-19.md) lane banked exactly this rule when it
   declined to score its placement test on the February 2027 minutes: *"which fall after this ledger's own
   close-out window and would leave the cell for nobody to fill."* So the question is handed forward as a
   **proposal with the arithmetic already in its notes**, not registered where it would rot. Likewise the
   **D-2 placement** question is not re-registered: 2027-03-18 is *"March MPC Summary and minutes"*
   (provisional, Bank's own page, fetched today) — a **non-Report** round, the identical geometry the
   [`12-15`](uk-labour-market-2026-12-15.md) lane settled from the 19 March and 18 June 2026 precedents.

7. **The series revises by 0.1pp, and every one-decimal wage test in this chain is exposed to it.**
   SUPPORTED, measured, and new. Comparing figures **as published** in the bulletins fetched today against
   **today's vintage** of the same series:

   | Bulletin | Figure as published | Series today | Revision |
   |---|---|---|---|
   | 2025-02-18 (Oct–Dec 2024) | regular pay 5.9% | KAI9 5.9 | — |
   | 2025-03-20 (Nov 2024–Jan 2025) | regular pay 5.9% | KAI9 **5.8** | **−0.1** |
   | 2025-04-15 (Dec 2024–Feb 2025) | regular pay 5.9% | KAI9 5.9 | — |
   | 2025-06-10 (Feb–Apr 2025) | regular pay 5.2% | KAI9 **5.3** | **+0.1** |
   | 2025-06-10 (Feb–Apr 2025) | private regular 5.1% | KAJ4 **5.2** | **+0.1** |
   | 2025-06-10 (Feb–Apr 2025) | public regular 5.6% | KAJ7 5.6 | — |

   **Three of six revised, all by 0.1pp.** Every absolute threshold this chain has set — **≥3.4%**
   ([`10-20`](uk-labour-market-2026-10-20.md)), **≥3.3%** ([`11-17`](uk-labour-market-2026-11-17.md)),
   **≥3.4%** ([`12-15`](uk-labour-market-2026-12-15.md)) — and the *relative* test
   `FT-uk-labour-market-2027-01-19-2` are stated to **one decimal** against a series whose revisions are
   **the same size as the decimal**. A comparison of two adjacent overlapping windows can therefore be
   **flipped by a revision alone**, with nothing having happened in the economy. Registered as
   **FT-…-3** and stated here rather than in any sibling's file (one file per owner, #1449).

8. **The corridor is the loudest of the six UK labour entries, and it is the exact inverse of the January
   sibling's.** SUPPORTED, from the calendar itself. **Seven** tracked events sit within five days and
   **two are `high`-impact** — where [`01-19`](uk-labour-market-2027-01-19.md) had **13 events and none
   high**:

   - **`fomc-2027-03-17` at D+1** (`high`). The ONS print lands **02:00 ET Tuesday**; the FOMC statement
     is **14:00 ET Wednesday**, ~36 hours later.
   - **`fomc-blackout-start-2027-03-06` at D-10.** The print lands **inside** a Fed blackout — no Fed
     voice in the window, which is clean, but also no Fed voice to *absorb* attribution.
   - **`opex-2027-03-19` at D+3** (`high`) — quarterly quad-witching, with `vix-expiration-2027-03-17`
     at D+1.
   - **`boj-decision-2027-03-18` at D+2** (`medium`), `tic-monthly-2027-03-18` at D+2,
     `japan-cpi-2027-03-19` at D+3, `sp-rebalance-reference-close-2027-03-12` at D-4.

   **The consequence is the same as the sibling's and reached from the opposite direction.** The 01-19
   lane had the thinnest corridor of five and still concluded attribution was poor (the MLK gap). This one
   has the loudest and concludes the same, for the plain reason: a `low`-tiered foreign data print
   **36 hours before an FOMC decision and three days before quad-witching** cannot be extracted from the
   tape. Two entries, opposite corridors, identical operational answer — which is itself evidence the
   `symbols: []` null in leg 9 is structural rather than corridor-dependent.

   **A difference from January worth one line:** UK CPI for this cycle is **2027-03-24** (proposal only,
   `from-uk-cpi-2027-02-17` and `from-uk-cpi-2027-04-21`), **eight days** later — so unlike the January
   pairing the UK data run is **not** two consecutive days, and the next-day-CPI misattribution caution
   the 01-19 lane carried **does not apply here**.

9. **No tracked symbol carries a sterling or UK-labour channel, and no play is proposed.** SUPPORTED, and
   it is where the honesty sits. `symbols: []`; this repo tracks no UK-listed symbol. The house playbooks
   (S1/S2/E1/S3/S4 + G1, [`trade-playbooks.md`](../../plans/trade-playbooks.md)) are equity- and
   earnings-keyed; none is rates-keyed, let alone keyed to UK wage data. The measured effect on the
   print's **own currency** at the last release was **~0.1%** in cable, on a two-sided beat (carried by
   reference from the siblings, **not** re-derived). The `low` tier is argued here, not inherited.

### What plays the conditions support (date estimate)

**None.** No entry, exit, hedge or size is keyed to 2027-03-16. Four rules and one branch:

- **Read-only, and against a baseline superseded six times.** Every KAJ4 figure quoted here is replaced at
  **09-15, 10-20, 11-17, 12-15, 2027-01-19, 2027-02-16** and **this print** before the event lands. The
  contribution is the **measurement of the milestone**, the **incidence venue** and the **revision
  tolerance** — not the levels.
- **Search order when it lands** — (1) the **published reference period**, to confirm it reads *"November
  2026 to January 2027"*; (2) **private-sector regular pay ex-bonus** against the Oct–Dec 2026 figure
  published 2027-02-16 (the boundary test, **FT-…-1**) and against the **1.6%–4.0%** band (**FT-…-2**);
  (3) the **back-revisions** to the two prior windows (**FT-…-3**); (4) the **February 2027 payroll
  flash**, the fourth wholly post-Budget cell this chain has seen.
- **The claims to refuse** — any wire copy treating this as *"the print that shows the Budget's effect"*.
  It is the first wholly post-Budget **reference window**; on this lane's own measurement that boundary is
  a coin flip, and the Budget's employer-cost measures do not commence until **April 2027**.
- **The attribution rule, stated up front.** A pre-dawn **gilt or cable** move on 03-16 has one clean
  candidate. A **US-open** move has none worth naming: the session is positioning into an **FOMC decision
  the next afternoon** and a **quad-witching expiry** three days out.
- **The branch to pre-decide** — if the **2026-10-28** Budget announces an employer-cost measure effective
  **before** April 2027, leg 4's incidence framing fails for this Budget, the 2027-06-15 proposal loses
  its stated rationale, and the pulse after Budget day must say so and re-derive the venue. If it
  announces the conventional April commencement, the consequence is **scheduled work, not news**.

### Honest limits

The dates, the designation labels, the bulletin reference periods, the MPC calendar and **every series
value** are **primary and fetched** (ONS, gov.uk and bankofengland.co.uk, 2026-09-10). What carries the
calls is thinner in six specific places.

**First, and it governs the headline: n = 4.** There have been four Autumn Budgets in the KAJ4 era with a
clean boundary. The test detects ~**0.49pp** at 80% power and observed **0.05pp**, so it rules out a
*large* effect and cannot rule out a small one. "Empty" here means *"indistinguishable from an ordinary
month at the only sample that exists"*, which is the strongest claim the data supports and is stated as
such rather than as a proven null.

**Second, the Budget has not happened.** 2026-10-28 is **48 days** in the future and its contents are
**entirely unknown**. Every statement here about *what a 2026 Budget does to wages* is a statement about
**precedent**, not about announced policy. The April-commencement convention is inferred from four
Budgets, most directly from the 2024 NICs change; a Budget that legislated an immediate employer-cost
change would break leg 4 outright, which is why that branch is pre-decided above.

**Third, the boundary definition is a choice, and a defensible alternative exists.** "First wholly
post-Budget window" is defined here, as in the whole chain, on the **AWE reference window**. One could
instead date the boundary from the **payroll flash** (one month behind) or from **vacancies** (one month
behind AWE), which would shift each test by a month. The AWE definition is used because it is the one the
chain's five prior documents used and the one the milestone claim was always about; re-running on another
definition is left as work the 2027-06-15 lane can do cheaply with the same instrument.

**Fourth, KAJ4 is a Great Britain series while the LFS headline is UK.** AWE has always been GB-based and
the bulletins say so (*"in Great Britain"*); the comparison is internally consistent, but a reader
matching a GB pay figure to a UK unemployment rate in the same sentence is matching two coverages.

**Fifth, leg 5's backtest is of *statistical* forecasts only.** It shows hold-last beats drift and that
p80 error at 7 months is 1.2pp. It does **not** test the Bank's own MPR path, which this lane had no way
to score; the claim *"the horizon cannot carry an absolute threshold"* is therefore about the instruments
tested, and a materially better forecaster would weaken it. The July 2026 MPR PDF was **not** re-attempted
(subset-font encoded per the 10-20 lane).

**Sixth, leg 7's revision base rate is six comparisons, not a revision study.** Three of six moved, all by
0.1pp, all within ~15 months of first publication. That is enough to justify **stating a tolerance** and
nowhere near enough to characterise the revision process; a longer-vintage study would need archived
bulletin vintages this lane did not pull.

Beyond those: no consensus or whisper for the **March 2027** print was findable today, and none would be
meaningful at D-187. The reaction-function evidence (**~0.1%** in cable on 2026-08-18) is **one** print,
press-relayed, carried by reference. The ONS release calendar could not be enumerated for 2027-03-16, so
**no claim is made that this is the only ONS release that morning**; what is claimed is only that no
*tracked* event shares it. `boe-decision-2027-03-18` and `uk-cpi-2027-03-24` exist as **proposals only**
and are neither written nor edited here (#1449, #1717) — and no third `boe-decision-2027-03-18` proposal
is created, because two already exist and a competing proposal would be noise. **ASHE is again not
proposed** — still month-only per the 11-17 lane's re-check. Finally, leg 9 is an argument that *nothing*
connects, and the failure mode of a null claim is a channel that exists and is simply not instrumented in
this book.

## Stance & kill switches

**Stance (date `estimate`):** **stand aside completely, and retire the question this chain has been
chasing for five documents.** This book holds nothing with a sterling or UK-labour channel and none is
proposed; the `low` tier is argued in leg 9, not inherited. The three substantive positions are
*analytical*, and the first of them is the retirement of a premise rather than an addition to it.

**First, the destination is confirmed and the milestone is empty — and those are two different findings
that must not be collapsed.** This release does carry the first wholly post-Budget AWE window, settled
here from the **same-month anchor** (the 19 March 2026 bulletin carries *"November 2025 to January
2026"*) rather than from a rolled habit, which is a genuine upgrade on the
[`01-19`](uk-labour-market-2027-01-19.md) lane's own weakest link. But on the ONS's own private-sector
series the boundary has moved pay growth by **+0.2, +0.4, −0.3, −0.1pp** across the four Autumn Budgets
with data — signed mean **+0.05pp**, **sign 2–2**, mean absolute **0.25pp** against an ordinary-month
**0.183pp**. **The arrival is not informative.** The general rule worth banking is the companion to the
one the 01-19 lane banked: *a correction deserves the same scrutiny as the thing it corrects* — **and so
does the premise both of them share.** Five documents refined an answer without once asking whether the
question paid.

**Second, the venue that is not empty is April, and it is handed forward rather than hoarded.** A
2026-10-28 Budget's employer-cost measures conventionally commence **April 2027**, outside this release's
Nov–Jan window entirely; the first window containing that April publishes **2027-06-15**. At that
boundary the same four Budgets gave **0.0, −0.1, −0.4, −0.1pp** — **no positive in four**, which is
directionally consistent where the announcement boundary is a coin flip, and still inside ordinary noise
(p = 0.125 on a 3-of-3 sign test). It is filed as a **proposal with the arithmetic in its notes** because
it scores three months after this ledger's close-out, and a test whose Outcome cell nobody can fill is
not a test.

**Third, the absolute threshold is stated for the first time in this chain — as a band wide enough to
settle the question.** Backtested at this horizon, **hold-last beats trailing-drift extrapolation**
(MAE **0.70 vs 0.99pp**), so the pull to straight-line a **16-month** decline (the longest in the
25-year series) to **2.1%** is measurably a mistake; and even hold-last carries **p80 error of 1.2pp**.
The registration is therefore **2.8% ± 1.2pp → 1.6%–4.0%**. The width is the point: it upgrades the
[`01-19`](uk-labour-market-2027-01-19.md) lane's refusal from *"we lack the Bank's Q4 path"* to **"at
D-187 the horizon cannot carry an absolute threshold at all"**, which needs no future MPR to hold.

**Kill switches:**

- **Channel kill (the one that would rebuild this doc):** a tracked name (NVDA/AVGO/MRVL/CRWV) moving
  **>1%** in the **02:00–09:30 ET** window on **2027-03-16** in a way the tape attributes to the ONS
  release. Leg 9's "no price channel" claim would be false. **Harder to score than in any sibling** — the
  session is positioning into an FOMC decision the next afternoon (leg 8), so an unattributable move is
  the expected case and only an explicit attribution counts. Score by **2027-03-17**.
- **Milestone kill (registered — the headline on trial):** the **2027-03-16** release printing a
  private-sector regular-pay change **greater than 0.4pp** against the Oct–Dec 2026 figure published
  2027-02-16. That would exceed every one of the four Budget boundaries and sit past the control's **p90**
  — the boundary would look special after all, and leg 3's retirement call would be wrong. Registered as
  **FT-uk-labour-market-2027-03-16-1**, score by **2027-03-17**. Graded honestly: a **pass is weak**
  (~90% prior), a **fail is decisive**.
- **Band kill (registered — the absolute threshold this chain deferred):** Nov 2026 – Jan 2027 private
  regular pay printing **outside 1.6%–4.0%**. The hold-last instrument would be miscalibrated at a
  7-month horizon and leg 5's *"the horizon cannot carry a threshold"* claim would need re-deriving with a
  wider band. Registered as **FT-uk-labour-market-2027-03-16-2**, score by **2027-03-17**.
- **Revision kill (registered — and it fires on this chain's method, not on the market):** the
  **2027-03-16** release leaving **both** immediately prior private-sector regular-pay windows (Sep–Nov
  and Oct–Dec 2026) **unrevised** against the values published on 2027-01-19 and 2027-02-16. Leg 7's
  measured 3-of-6 base rate would be overstated and the tolerance warning would not be needed. Registered
  as **FT-uk-labour-market-2027-03-16-3**, score by **2027-03-17**.
- **Incidence kill (NOT registered here, and the reason is the rule):** the **2027-06-15** release's
  Feb–Apr 2027 private regular pay printing **above** the prior window, breaking the 4-of-4 non-positive
  run. It scores **three months after** this ledger's close-out, so per the
  [`01-19`](uk-labour-market-2027-01-19.md) lane's own precedent it is **handed to the proposed
  `uk-labour-market-2027-06-15` lane** with the arithmetic in its notes rather than registered where
  nobody could fill the cell.
- **Budget-contents kill (fires on this document, not on the market):** the **2026-10-28** Budget
  announcing an employer-cost measure effective **before April 2027**. Leg 4's incidence framing fails
  for this Budget and the 2027-06-15 proposal loses its stated rationale. **Expected to be tested**;
  written down so the post-Budget pulse treats it as scheduled work. Re-check after 2026-10-28.
- **Window kill (inherited, deliberately not re-registered):** answered by
  **FT-uk-labour-market-2027-01-19-1** on **2026-09-16**, **181 days** before this print. A pulse after
  that date reads the sibling's scored outcome instead of re-opening it. If it kills, legs 2, 3 and 4
  of this document fail with it.
- **Placement (inherited, deliberately not re-registered):** 2027-03-18 is a **non-Report** round at
  **D+2** — the geometry [`12-15`](uk-labour-market-2026-12-15.md) settled from two 2026 precedents. A
  third copy adds a row and no information.
- **Round kill:** the Bank moving the **2027-03-18** round — **provisional** on its own page — or the
  FOMC moving **2027-03-17**. Leg 8's corridor shape changes. Re-check every pulse.
- **Staleness kill (fires on this document, not on the market):** any KAJ4 value quoted here moving at the
  **09-15, 10-20, 11-17, 12-15, 2027-01-19** or **2027-02-16** releases. Expected, six times over, and
  leg 7 says it will move by ~0.1pp when it does; a pulse must re-pull the series rather than re-read.
- **Date kill:** the ONS moving the 2027-03-16 07:00 release. Breaks the header. Re-check every pulse.

Three forward tests registered in
[`forward-tests/uk-labour-market-2027-03-16.md`](../forward-tests/uk-labour-market-2027-03-16.md) — **-1**
(the milestone boundary, the headline on trial), **-2** (the absolute band the chain deferred, stated with
its measured error bar) and **-3** (the revision tolerance nobody in this chain has stated). **All three
score on this event's own print**, which is the deliberate difference from the
[`01-19`](uk-labour-market-2027-01-19.md) sibling's pattern — not because scoring early is worse, but
because that lane already occupies the near venues for the window rule and the placement claim, and this
lane's own contributions have no earlier venue by construction. Three further questions are deliberately
**not** registered: the window rule and the D-2 placement (both already scored by siblings, 181 and 250+
days earlier) and the April-incidence test (handed forward as a proposal, since it scores after close-out).
No market-shaped test is registered because the stance takes no position and this book has no instrument
that would price one.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-10 | D-187 | Initial research banked (above) on an id that existed only as ONE proposal — `from-uk-labour-market-2027-01-19`, read in full first; the canonical `src/domain/market-events/uk-labour-market-2027-03-16.json` is written in this PR **with a changed title**, and the proposal is now inert. Date primary twice, re-fetched not inherited: gov.uk register (*"16 March 2027 7:00am (confirmed)"*, ONS, "Accredited official statistics", page published 30 June 2026) and the ONS release calendar (*"16 March 2027 at 7:00am"*, "Not yet published"). **Finding 1 — THE DESTINATION IS CONFIRMED, AND BY BETTER EVIDENCE THAN THE CHAIN HAD.** The [01-19](uk-labour-market-2027-01-19.md) lane reached this release by rolling the window rule forward from the August 2026 bulletin — an inference on a habit, which it named as its own weakest link. This lane read the **same-month anchor** instead: the **19 March 2026** bulletin (fetched today) carries *"November 2025 to January 2026"* AWE/LFS, *"December 2025 to February 2026"* vacancies and a **February 2026** payroll flash. So this release carries **Nov 2026–Jan 2027** — the first AWE window with no pre-Budget day. **Finding 2 — AND THE MILESTONE IS EMPTY. THIS IS THE HEADLINE AND IT IS A REFUSAL.** First quantitative test anyone in this chain has run on the premise five documents rest on, using an instrument no sibling used: the ONS **KAJ4** series (private-sector regular pay, 3m-avg y/y, SA, ex-arrears; `ons.gov.uk/.../timeseries/kaj4/lms/data`, **304 obs from 2001**), validated before use — its current vintage reproduces the 18 Aug 2026 bulletin exactly (private **2.8**, whole economy **3.5** KAI9, public **6.1** KAJ7). Across the **four** Autumn Budgets with data, the change at the first-wholly-post-Budget boundary: **+0.2** (2017-11-22, 2018 FEB), **+0.4** (2021-10-27, 2022 JAN), **−0.3** (2024-10-30, 2025 JAN), **−0.1** (2025-11-26, 2026 FEB). **Signed mean +0.05pp, t(3)=0.32, SIGN 2–2**; mean |Δ| **0.250pp** vs a 287-month control mean of **0.183pp** (sd 0.245, p90 0.4); percentiles scatter 18/49/75/89%. **Power stated, not hidden:** n=4 detects ~**0.49pp** at 80%, so this rules out a large effect, not a small one — which still settles the only use anyone would make of it. **The call is to RETIRE the question**, not refine it a sixth time. **Finding 3 — THE VENUE THAT IS NOT EMPTY IS APRIL, AND IT IS PROPOSED, NOT REGISTERED.** Employer-cost measures conventionally commence the following April (11-17's precedent: NICs 13.8%→15%, April 2025), so a 2026-10-28 Budget bites **April 2027** — outside this Nov–Jan window entirely. First window containing it = **Feb–Apr 2027**, published **2027-06-15** (*"15 June 2027 7:00am"*, "Confirmed", gov.uk, fetched today), **proposed here**. Same instrument at that boundary: **0.0 / −0.1 / −0.4 / −0.1** — **no positive in four**, directionally consistent where the announcement boundary is a coin flip, but all inside noise (3-of-3 sign test p=0.125). Filed as a proposal because it scores three months **after** this ledger's close-out, per the 01-19 lane's own banked rule about orphaned Outcome cells. **Finding 4 — THE ABSOLUTE THRESHOLD THE CHAIN DEFERRED, STATED WITH ITS ERROR BAR.** Backtest, 7-month horizon, n=268 ex-COVID: **hold-last** MAE **0.70**/sd 0.90/p80 **1.2**; **trailing-drift linear** MAE **0.99**/sd 1.41. **Extrapolation is WORSE than doing nothing** — so straight-lining KAJ4's **16-month** decline (longest run in the 25-year series; prior max 12m to 2024 AUG) to **2.1%** is measurably a mistake. Registration: **2.8% ± 1.2pp → 1.6%–4.0%**. This **generalises** 01-19's refusal from *"we lack the Bank's Q4 path"* to *"the horizon cannot carry a threshold"*. **Finding 5 — THE SERIES REVISES BY 0.1pp AND THIS CHAIN'S TESTS ARE STATED TO ONE DECIMAL.** Six bulletin-published figures re-checked against today's vintage: **3 revised, all 0.1pp** (2025-03-20 regular 5.9→**5.8**; 2025-06-10 regular 5.2→**5.3**, private 5.1→**5.2**). Every absolute threshold in this chain (≥3.4/≥3.3/≥3.4) and the relative `FT-uk-labour-market-2027-01-19-2` can be **flipped by a revision alone**. Stated here, not in any sibling's file (#1449). Adjacency sweep: **peers** — none, `symbols: []`. **Macro** — baseline pulled firsthand from the ONS series rather than read from a bulletin; KAJ4 last 14 months 4.9→**2.8**, monotone. **Volatility** — VIX **17.84** (2026-09-10, Yahoo `^VIX`), vs 16.46 on 09-09 and **14.32** on 09-03: a **+3.5pt week**, past this calendar's own 3-point regime threshold, and worth the next pulse's attention even though no sterling-vol instrument sits here. **Geopolitical** — nothing new touching UK labour; not re-fetched. **Event tape** — no March 2027 consensus or whisper findable, and none would be meaningful at D-187. **Adjacency ids: 7** within 5 days — the **LOUDEST corridor of the six UK labour entries and the exact inverse of 01-19's** (13 events, none high): **`fomc-2027-03-17` D+1 (high)**, **`opex-2027-03-19` D+3 (high, quad-witching)**, `boj-decision-2027-03-18` D+2 (medium), `vix-expiration-2027-03-17` D+1, `tic-monthly-2027-03-18` D+2, `japan-cpi-2027-03-19` D+3, `sp-rebalance-reference-close-2027-03-12` D-4; plus **`fomc-blackout-start-2027-03-06` at D-10**, so the print lands **inside a Fed blackout ~36h before an FOMC decision**. Two entries, opposite corridors, identical operational answer — evidence the null is structural, not corridor-dependent. **MPC round read firsthand:** bankofengland.co.uk/monetary-policy/upcoming-mpc-dates lists *"Thursday 18 March"* as *"March MPC Summary and minutes"*, provisional — a **non-Report** round at D+2, the geometry [12-15](uk-labour-market-2026-12-15.md) already settled, so **deliberately NOT re-registered**. UK CPI is **2027-03-24** (proposal only), **eight days** later — so unlike January the UK run is **not** two consecutive days and the next-day-CPI misattribution caution **does not apply**. **ONE dated adjacency PROPOSED** (`estimate`, own-owner file): `uk-labour-market-2027-06-15` — the April-incidence venue. **No third `boe-decision-2027-03-18` proposal is created**: two already exist (`from-uk-cpi-2027-04-21`, `from-uk-labour-market-2027-01-19`) and a competing one would be noise (#1717). **Fetch note:** `api.ons.gov.uk/timeseries/...` returned **404** — *"This API has been decommissioned … fully retired on 25/11/2024"*, a decommissioned endpoint, not a blocked source; `www.ons.gov.uk/.../timeseries/<id>/lms/data` served every query, so `probe-ref.blocked` stays empty. **Three forward tests registered, all scoring 2027-03-17:** FT-1 (milestone boundary Δ ≤ 0.4pp — pass weak, fail decisive), FT-2 (Nov–Jan private regular pay inside **1.6%–4.0%**), FT-3 (at least one back-revision to the two prior windows). **Three questions deliberately NOT registered:** the window rule (FT-uk-labour-market-2027-01-19-1 scores it 2026-09-16, 181 days early), the D-2 placement (settled by 12-15), and the April-incidence test (handed to the proposed 2027-06-15 lane rather than orphaned after close-out). **Honest weakness, named up front:** n=4 governs the headline and detects only ~0.49pp; the **2026-10-28 Budget has not happened** and its contents are unknown, so every "what a Budget does" statement is precedent, not policy; the boundary is defined on the **AWE** window and a payroll-flash or vacancies definition would shift each test a month; KAJ4 is a **Great Britain** series while the LFS headline is UK; the leg-5 backtest covers **statistical** forecasts only and never scored the Bank's own path; and the revision base rate is **six comparisons**, enough to state a tolerance and not to characterise a process. | — (stance set: stand aside, no position, no play; three analytical commitments — the chain's destination is CONFIRMED from the same-month anchor but the MILESTONE IS EMPTY on a 4-Budget measurement and the question should be RETIRED, the venue that is not empty is **April 2027** published 2027-06-15 and it is proposed rather than registered, and the absolute threshold the chain deferred is now stated as **1.6%–4.0%** whose WIDTH generalises the refusal from "we lack a number" to "the horizon cannot carry one") | 2026-10-10 (low, 15+d band: every 30d — a pulse that still reads a pre-Budget world, and that should read FT-uk-labour-market-2027-01-19-1's 2026-09-16 score, since a window-rule kill takes legs 2, 3 and 4 of this document with it; the pulse after **2026-10-28** is the one that must test the Budget-contents kill and say whether the April-incidence framing survives this Budget) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-uk-labour-market-2027-03-16.json`
(`status: "estimate"`) in the same PR — your own file, never another event's canonical one (#1717).
Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from
memory — after which this doc goes quiet.
