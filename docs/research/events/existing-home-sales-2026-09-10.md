# Existing-Home Sales (NAR, August 2026 data) — existing-home-sales-2026-09-10

**Kind:** macro-print · **Date:** 2026-09-10 (**confirmed**, `IR:` NAR's own 2026 Statistical News Release Schedule — nar.realtor/press-releases/nar-statistical-news-release-schedule, fetched direct 2026-09-08, "SEPTEMBER | Thu., Sep. 10 | August Existing-Home Sales", plus its .docx twin published 2025-11 and NAR's live statistics page; promoted this session from the `EST:` proposal) · **Impact:** low
**Last assessed:** 2026-09-15
<!-- probe-ref: {"symbols":{},"vix":17.09,"daysBand":"low:0+","adjacentIds":["aapl-iphone-18-launch-2026-09-09","buyback-blackout-start-2026-09-12","canada-counter-tariffs-effective-2026-09-08","cpi-2026-09-11","ecb-decision-2026-09-10","eia-steo-2026-09-09","empire-state-mfg-2026-09-15","fomc-blackout-start-2026-09-05","g20-energy-abundance-ministerial-houston-2026-09-14","gastech-2026-09-14","iea-omr-2026-09-11","jgb-20y-auction-2026-09-15","jgb-liquidity-enhancement-1-5y-2026-09-10","labor-day-market-closure-2026-09-07","missouri-map-ballot-deadline-2026-09-08","mts-august-2026-09-11","opec-momr-2026-09-10","opec-plus-meeting-2026-09-06","ppi-2026-09-10","qss-q2-2026-09-09","sp-global-investment-manager-index-2026-09-15","sp-rebalance-proforma-capped-2026-09-11","treasury-10y-note-2026-09-09","treasury-20y-bond-2026-09-15","treasury-30y-bond-2026-09-10","treasury-3y-note-2026-09-08","treasury-buyback-10y20y-2026-09-10","treasury-buyback-cash-mgmt-2026-09-09","treasury-buyback-increase-2026-09-09","treasury-buyback-tips-10y30y-2026-09-15","treasury-coupon-announcement-2026-09-10","uk-labour-market-2026-09-15","umich-sentiment-prelim-2026-09-11"],"adjacentStrongIds":["cpi-2026-09-11","treasury-10y-note-2026-09-09","treasury-20y-bond-2026-09-15","treasury-30y-bond-2026-09-10"],"screenStreak":0,"blocked":[{"url":"https://fred.stlouisfed.org/graph/fredgraph.csv?id=MORTGAGE30US","status":"TIMEOUT","at":"2026-09-08"},{"url":"https://fred.stlouisfed.org/graph/fredgraph.csv?id=MORTGAGE30US","status":"TIMEOUT","at":"2026-09-15"},{"url":"https://fred.stlouisfed.org/graph/fredgraph.csv?id=DGS10","status":"TIMEOUT","at":"2026-09-15"},{"url":"https://www.atlantafed.org/-/media/Documents/cqer/researchcq/gdpnow/GDPTrackingModelDataAndForecasts.xlsx","status":"HTTP_200_404_HTML","at":"2026-09-15"}]} -->

## At a glance

**TL;DR.** **This session will probably be wider than an average Thursday, and measurement says none of
that width belongs to the housing print.** Two regimes own 2026-09-10 and they act on different
instruments. The **FOMC blackout** (2026-09-05 → 09-17) widens homebuilders and *only* homebuilders —
over **678** blackout sessions ITB's median range is **2.003%** against **1.838%** (p<**0.001**), XHB
**1.784%** vs **1.610%** (p<0.001), while SPY is untouched (0.882% vs 0.885%, p=**0.95**).
**Same-session PPI** widens the index and *only* the index — **108** PPI vintage days give SPY
**1.030%** against **0.879%** (p=**0.038**), with ITB p=0.65 and XHB p=0.96. The print itself is inert
on every cut: **114** EHS release days leave all three at baseline, and the **36** that fell inside a
blackout are no wider than the 78 outside (p=**0.53**). The nowcast half inverts its sibling too — the
Fed's own schedule names **three** releases here, and all **6** past ≥3-release EHS vintages moved
inventories past 0.0010pp against **17 of 123** solo ones, so read **residential** and ignore the
headline. Date is `confirmed` on NAR's own calendar; the call is stand aside on every horizon.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-2) | **Stand aside** | High | `symbols: []` re-derived on **2,514** sessions (2016-09-06 → 2026-09-04, Nasdaq API): **114** EHS days leave ITB (p=0.57), XHB (p=0.46), SPY (p=0.65) at baseline, and so do the **100** solo ones. A re-run grep of `trade-playbooks.md` and `multi-symbol-sweep.md` returns **0** housing hits — no instrument attaches on any date. | A macro- or housing-keyed playbook landing in `docs/plans/trade-playbooks.md` before **2026-09-10** — none exists today |
| This week | **Stand aside on the print — and do not read Thursday's ITB range as housing** | High | 09-10 stacks PPI (08:30), this print (10:00), a **30-year auction** (13:00) and the ECB, inside the blackout, one day before **CPI 09-11**. The width is the regime: blackout ITB **+9%** (p<0.001), PPI-day SPY **+17%** (p=0.038), EHS itself null at n=114. The day *before* a CPI vintage is flat (n=**107**, ITB p=**0.89**). Last edition: **4.06M** SAAR, **−1.7% m/m**, **$431,400** median, **4.6** months' supply. | ITB's 09-10 session range clearing **3.0%** with a **VIX close ≤ 16** — a ~2% tail on EHS days, but **7.5%** on blackout days at that VIX. Registered as `-1` |
| This month | **Watch 2026-10-13 — the free rehearsal nothing was scheduled to look at** | Medium | The September edition is on NAR's calendar and **absent** from the Fed's forward schedule, the shape that produced a **solo** vintage on all **5** of 2026's unscheduled EHS dates. It is the dated observation for `existing-home-sales-2026-11-12`'s first kill switch (*"no vintage dated 2026-10-13 by 2026-10-16"*) — but that lane's own `low`-band pulses fall **2026-10-06** and **2026-11-05**, straddling the deadline. **Proposed as a calendar row in this PR** so the look actually happens. | A `ContribArchives` vintage dated **2026-10-13** naming a co-release, or none existing by **2026-10-16** — either way 11-12's Leg 2 moves, and this row is what surfaces it |
| This quarter | **Read the residential leaf only; the headline and inventories on 09-10 are wholesale trade's** | High | The Fed schedules 09-10 as *"Wholesale trade, Producer Price Index, Existing-home sales"*. Composition splits the vintage cleanly: **solo (n=123)** moves inventories a median **0.0001pp** and clears 0.0010pp just **17** times; **≥3-release shared (n=6)** clears it **6 of 6**, with a median absolute GDP move of **0.1739pp** against solo **0.0410pp**. Residential does **not** separate (under 0.10pp on **83.3%** shared vs **81.3%** solo) — it stays the one attributable line. Registered as `-3` and `-4`. | The 2026-09-10 vintage posting **solo**, or moving inventories **<0.0010pp** — either would mean a scheduled multi-release day still reads like a single-release one |

**Signals & conditions** — the buy/sell/hold triggers:

- **No buy and no sell signal exists off this event.** Measured inert on 114 EHS days, on the 100 solo
  ones, and on the 36 inside a blackout; no macro- or housing-keyed playbook exists. Research is not action.
- **A wide ITB Thursday is the blackout, not the print.** ITB runs **+9%** and XHB **+11%** through
  blackout windows (p<0.001, n=678) with SPY unmoved — attribute accordingly.
- **A wide SPY Thursday is the PPI, not the print.** PPI vintage days lift SPY **+17%** (p=0.038, n=108)
  and leave both homebuilder ETFs untouched.
- **The corridor's ITB-relevant event is Friday's CPI, not Thursday's housing number.** CPI vintage days
  carry ITB's widest macro median (**2.081%** vs 1.872% all-session); the day *before* one is flat.
- **The sibling kill switch needs a third clause.** `VIX ≤ 16` is not enough inside a blackout (7.5% vs
  5.0%). Registered as `-1`, with the clause attached.
- **Do not read "confirmed" as licence.** The date is now the publisher's own; the call is unchanged.
- **Watch (dated)** — PPI + **this print** + 30Y auction + ECB **09-10** · **CPI 09-11** · UMich prelim
  **09-11** · buyback blackout **09-12** · **FOMC 09-16** (SEP) · housing starts + August PHSI **09-17**
  (blackout ends) · September data **10-13** (the rehearsal, proposed here) · **FOMC 10-28** · October
  data **11-12** · November data **12-09** on the FOMC's SEP day.

## Initial research

### The question, plainly

This event reached the calendar on 2026-09-08 as a single-sourced proposal from the
`fomc-2026-09-16` adjacency sweep, which filed it for a reason that is about *timing*, not content:

> The gap it fills: this calendar tracks the November (11-12) and December (12-09) editions of NAR's
> Existing-Home Sales and nothing between, so the August edition — the only one that prints inside the
> 2026-09-05 → 2026-09-17 FOMC communications blackout — had no row… it lands 10:00 ET on 09-10, the
> same session as PPI (08:30) and the ECB decision, one day before the August CPI that
> `fomc-2026-09-16` has named as its fork, and with no Fed voice available to interpret any of it.

Three questions fall out. **Does NAR's own calendar carry the date?** **Does any of that corridor
density — the blackout, the same-session PPI, the next-morning CPI — actually reach a homebuilder
session, or is it corridor colour?** And, because the sibling ledger for the November edition built its
whole thesis on that edition being *unscheduled and solo*: **what does it mean that this one is
scheduled and shared?**

**One-line verdict:** the date is the publisher's own and the label promotes to `confirmed`; the
corridor density **is** real and measurable, but it splits by instrument in a way that leaves this print
with none of it — the **blackout** widens homebuilders and not the index, **same-session PPI** widens the
index and not homebuilders, and the **print itself** is inert on all 114 instances including the 36
inside a blackout; and the shared vintage makes 09-10 the *least* attributable nowcast reading of the
year rather than the cleanest, so only the residential leaf is worth reading.

### Method

Macro-print mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md). `symbols: []`, so neither
`earnings-cycle.mjs` nor `intraday-edges.mjs` applies and the cache-busting rule has no target; the
equity work below is a purpose-built read of daily bars. Six inputs, all fetched direct on 2026-09-08:

1. **`nar.realtor/press-releases/nar-statistical-news-release-schedule`** (HTTP 200, 483,177 bytes) and
   its downloadable twin **`/sites/default/files/2025-11/2026-nar-statistical-news-release-schedule.docx`**
   (HTTP 200, 55,384 bytes, published 2025-11), unzipped and read as XML for the full year.
2. **`nar.realtor/research-and-statistics/housing-statistics/existing-home-sales`** (HTTP 200,
   588,410 bytes) — the current edition, the Yun quote and the next-release note.
3. **`GDPNowcastDataReleaseDates.xlsx`** (Atlanta Fed) — `PostedUpdates`, **82 dated rows**
   2025-12-23 → 2026-12-23. *The forward **schedule**.*
4. **`GDPTrackingModelDataAndForecasts.xlsx`** — `ContribArchives`, **1,871 vintages 2014-05-01 →
   2026-07-28 = 1,822 same-quarter deltas**. *What actually **posted**.*
5. **`federalreserve.gov/monetarypolicy/fomccalendars.htm`** (HTTP 200, 164,831 bytes) plus
   `fomchistorical2016–2020.htm` (all HTTP 200) — **90** meeting end-dates 2016 → 2027, from which the
   blackout mask in Leg 3 is built.
6. **Nasdaq's historical-quote API**, SPY / ITB / XHB, **2,514 daily sessions 2016-09-06 → 2026-09-04**,
   with permutation tests on medians (20,000 iterations in Legs 4–5, 8,000 in Leg 3); **CBOE
   `VIX_History.csv`** and CBOE's `delayed_quotes/_VIX.json` for volatility.

**Collection notes, none substituted silently.** **FRED timed out on this runner** (`fredgraph.csv`,
connection failure, recorded in `probe-ref.blocked`), so unlike the sibling ledgers this session states
**no FRED-sourced series of its own** — the SAAR, inventory and months'-supply figures below are taken
from NAR's own statistics page, which is the primary source for all of them, and the mortgage-rate line
the siblings carried is simply **not restated here** rather than repeated from a document this session
could not fetch. Yahoo and stooq were not attempted; Nasdaq answered on the first try and its closes
reproduce both sibling ledgers exactly (**SPY 770.19, ITB 93.91, XHB 103.25** on 2026-09-04).

**One data-quality catch, cross-validated.** CBOE's `VIX_History.csv` carries a row for **09/07/2026**
closing at **15.30** — a Monday that was a full market closure (Labor Day). CBOE's *own*
`delayed_quotes/_VIX.json`, fetched the same minute, reports `prev_day_close` = **14.53**, i.e. the
2026-09-04 close, skipping 09-07 entirely; Nasdaq's bar series ends 2026-09-04 for all three ETFs. Two
of three CBOE-and-Nasdaq sources agree the last completed session was **2026-09-04**, so the CSV row is
treated as spurious and **14.53** is used as the last close throughout. Recorded here rather than acted
on: it is independent corroboration for `labor-day-market-closure-2026-09-07`, which is `estimate` and
in close-out with **its own** lane — this ledger writes nothing to that lane's file.

### Leg 1 — the date · **SUPPORTED**, and promoted to `confirmed`

Three primary NAR sources, read this session:

> **SEPTEMBER** — Thu., Sep. 10 · **August Existing-Home Sales** · Thu., Sep. 17 · August Pending
> Home Sales Index

on the schedule page and, word for word, in the `.docx` twin published **November 2025** — both under
the page's standing note *"All releases at 10 a.m. Eastern Time."* NAR's live statistics page states it
a third time and independently: *"Existing-Home Sales for August 2026 will be released on Thursday,
September 10, 2026 at 10:00 a.m. Eastern."*

A fourth corroboration comes from outside NAR entirely: the Atlanta Fed's `PostedUpdates` sheet
schedules a **2026-09-10, 10:00** posting naming *"Wholesale trade, Producer Price Index,
**Existing-home sales**"* — a second institution planning its own work around the same date and hour.

**Status promoted `estimate` → `confirmed`, prefix `EST:` → `IR:`,** on exactly the precedent
`existing-home-sales-2026-11-12` used on this identical page (`challenger-job-cuts-2026-09-03`: a
private publisher's own release carries `IR:`; NAR produces this series rather than aggregating it).
The proposal's stated reason for `estimate` — *"this lane may not self-confirm an event it discovered
in-sweep"* — does not bind here: the discovering lane was `fomc-2026-09-16`, and this is the canonical
file being written by the event's own initial research, the same position 11-12 was in. Per the lane's
hard limits a flip requires a primary source and there are three; per the date policy it licenses
nothing.

### Leg 2 — the vintage is scheduled and **shared**, the exact inverse of its sibling · **SUPPORTED**

`existing-home-sales-2026-11-12`'s central finding is that the Fed's forward schedule is *"a floor,
never a ceiling"* — 48 scheduled posting days against 93 realized over the workbooks' overlap, 45 of 93
never scheduled and zero scheduled-but-unposted — from which it concludes that 11-12, though
unscheduled, will carry a **solo** existing-home-sales vintage, *"the most attributable kind there is."*
That finding reproduces exactly on this session's independent parse and is not disputed. What it implies
for **09-10** is the opposite, and the sibling did not draw it out:

| 2026 EHS date | On the Fed's forward schedule? | Composition of the realized vintage |
|---|---|---|
| 2026-01-14 | **yes** | Retail trade, Producer Price Index, Existing-home sales |
| 2026-02-12 · 03-10 · 04-13 · 05-11 · 07-09 | no | **Existing-home sales** (solo, all five) |
| 2026-06-09 | **yes** | International trade (Full report), Wholesale trade, Existing-home sales |
| **2026-09-10** | **yes** — *"Wholesale trade, Producer Price Index, Existing-home sales"* | *(pending)* |
| 2026-10-13 | no | *(pending — the unscheduled/solo shape)* |
| 2026-12-09 | **yes** — *"Wholesale trade, Existing-home sales"* | *(pending)* |

The rule the schedule actually follows is the one 11-12 named: it announces the days on which EHS rides
a Census release the Fed wants for its own sake. **09-10 is one of those days**, and it is the *most*
loaded of them — three named releases, a composition that has never occurred with EHS before (01-14
paired it with Retail trade + PPI, 06-09 with International trade + Wholesale).

Composition is not cosmetic. Measured on the **1,822 same-quarter deltas**:

| | \|Δ residential\| median | \|Δ inventories\| median | \|Δ inventories\| > 0.0010pp | \|ΔGDP\| median | \|ΔGDP\| < 0.10pp |
|---|---|---|---|---|---|
| **Solo EHS (n=123)** | 0.0399pp | **0.0001pp** | **17 / 123 (13.8%)** | 0.0410pp | **78.9%** |
| Shared EHS (n=17) | 0.0288pp | 0.0232pp | 12 / 17 (70.6%) | 0.0820pp | 58.8% |
| **Shared, ≥3 releases (n=6)** | 0.0497pp | **0.0758pp** | **6 / 6 (100.0%)** | **0.1739pp** | **16.7%** |

Two readings fall out, and they point in opposite directions:

- **The headline and the inventories line on 09-10 are not readable as housing.** Every one of the six
  ≥3-release EHS vintages moved inventories past 0.0010pp, against 17 of 123 solo ones — and 09-10's
  co-release is *wholesale trade*, which is the inventories input. The two closest analogues make the
  size concrete: **2026-01-14** moved GDP **+0.1863pp** and **2026-06-09** **+0.1615pp**, roughly four
  times the solo-class median, on days whose residential moves (+0.0400pp, +0.0595pp) were entirely
  ordinary.
- **Residential survives the crowding.** It does not separate on composition — \|Δ\| under 0.10pp on
  **83.3%** of ≥3-release vintages against **81.3%** of solo ones. The wiring is why: the model's own
  `Residential` sheet routes `valExHomeSales` into `FRSBKX_USNAqtr`, **"Brokerage commissions"**, a leaf
  neither wholesale trade nor PPI touches in levels.

So the correct expectation for 09-10 is **a shared vintage whose only EHS-attributable line is
residential investment**. This is the mirror image of 11-12's, and it is the practical difference
between the two editions: the November one can be read whole, this one only in one column.

### Leg 3 — the FOMC blackout is the session's real widener, and it is a regime, not a print · **SUPPORTED**

The proposal filed this event partly because *"no Fed voice [is] available to interpret any of it."* That
is an assertion about a mechanism; it is testable. A blackout mask was built from **90** FOMC meeting
end-dates parsed from the Fed's own current and historical calendar pages, applying the Fed's published
rule — the window opens the **second Saturday preceding** the meeting's start and closes the **Thursday
following** its end. (For September 2026: meeting **Sep 15-16**, so **2026-09-05 → 2026-09-17**, which
reproduces the calendar's own `fomc-blackout-start-2026-09-05` entry exactly.) That marks **678 of
2,514** sessions (27.0%):

| Median session range | Blackout (n=678) | Non-blackout (n=1,836) | p |
|---|---|---|---|
| **ITB** | **2.003%** | 1.838% | **0.000** |
| **XHB** | **1.784%** | 1.610% | **0.000** |
| SPY | 0.882% | 0.885% | 0.948 |

**Homebuilders run about 9–11% wider through a blackout; the index does not move at all.** The same
split holds on a threshold rather than a median — ITB clears its all-session median on **55.3%** of
blackout sessions against **48.0%** outside, XHB **57.7%** vs **47.2%**, SPY **49.9%** vs **50.1%**.
A plausible mechanism sits right there — ITB is the most rate-sensitive of the three, and the blackout
is precisely the stretch in which rate expectations reprice with no official commentary to damp them —
but this ledger measures an association on 678 sessions, not a cause, and Leg 7 names the confound.

**And the premium does not attach to this print.** Splitting the 114 EHS release days by the same mask:

| Median session range | EHS days **inside** a blackout (n=36) | EHS days outside (n=78) | p |
|---|---|---|---|
| ITB | 1.859% | 1.927% | 0.529 |
| XHB | 1.724% | 1.797% | 0.723 |
| SPY | 0.833% | 0.923% | 0.543 |

Nothing, in the direction of *narrower* if anything. So the honest statement about 2026-09-10 is: **the
session is likely to be wide for homebuilders, the width belongs to the window rather than to the
release, and 36 prior instances of exactly this combination produced no extra motion.** That is a
reason to discount a Thursday ITB move, not to trade one.

### Leg 4 — the crowding lands on the index, not the builders · **SUPPORTED**

09-10's other distinguishing features are a same-session PPI print at 08:30 and the August CPI the
following morning. Both were measured, using PPI/CPI vintage dates read out of `ContribArchives`'
own `Data releases` field:

| Cut | n | SPY | ITB | XHB |
|---|---|---|---|---|
| **PPI vintage days** | 108 | **1.030%** vs 0.879%, p=**0.038** | 1.913%, p=0.650 | 1.662%, p=0.961 |
| Sessions **1 trading day before** a CPI vintage | 107 | 0.855% vs 0.885%, p=0.675 | **1.862%** vs 1.873%, p=**0.888** | 1.659%, p=0.923 |

**A PPI session is a wider session for the index and an ordinary one for homebuilders** — the single
5%-clearing cell in this document, and it points at SPY, which has no housing channel at all. **Sitting
the day before a CPI print does nothing to anyone**, which retires the "one day before the CPI the FOMC
hangs on" framing as a *corridor* fact rather than a tape fact. It also complements the sibling's
finding from the other side: 11-12 measured sessions two trading days *after* a CPI vintage as
marginally narrower (1.705%, n=111, p=0.084); the day *before* is flat. Neither direction widens.

For scale, the CPI print itself is the corridor's real homebuilder event: **CPI vintage days carry ITB's
widest macro median at 2.081%**, against 1.920% on EHS days, 1.913% on PPI days and 1.872% across all
2,514 sessions. If anything on this corridor deserves a homebuilder's attention it is Friday morning,
not Thursday's 10:00.

### Leg 5 — the print's own tape · **SUPPORTED (null)**, and it reproduces the siblings

The base rate was re-derived rather than inherited, on the same 2,514 sessions, median session range
against a baseline excluding EHS days, 20,000-iteration permutation tests:

| | All EHS days (n=114) | p | Solo-vintage EHS days (n=100) | p | Baseline |
|---|---|---|---|---|---|
| **SPY** | 0.912% | 0.652 | 0.899% | 0.805 | 0.881% |
| **ITB** | 1.920% | 0.566 | 1.915% | 0.625 | 1.868% |
| **XHB** | 1.733% | 0.459 | 1.724% | 0.547 | 1.665% |

Open-to-close absolute moves agree and are, if anything, *narrower* on EHS days — ITB **0.841%** against
**0.856%** all-session, XHB **0.704%** vs 0.734% — with 85.1% of EHS days keeping ITB inside ±2.0%.
These figures land within 0.01pp of both sibling ledgers on an independent pull, which is the strongest
available evidence that the null is the data and not a parser.

### Leg 6 — the sibling kill switch needs a **third** clause · **MIXED**, and 09-10 is where it bites

The `existing-home-sales-2026-12-09` ledger's third kill switch reads: *"ITB's session range on any EHS
release day between now and 12-09 exceeds 3.0%… with no FOMC, CPI or jobs print that session,"* naming
**09-10**, 10-13 and 11-12 as the dated chances to observe it. `existing-home-sales-2026-11-12` correctly
diagnosed that the switch is unconditioned and amended it with **VIX ≤ 16**. **09-10 is the first of the
three dates to arrive, and the amended switch is still not safe on it:**

| ITB session range > 3.0% | rate |
|---|---|
| All sessions 2016-09-06 → 2026-09-04 | 442 / 2,514 (**17.6%**) |
| EHS release days | 19 / 114 (16.7%) |
| **Blackout sessions** | 140 / 678 (**20.6%**) |
| All sessions at **VIX ≤ 16** | 53 / 1,051 (**5.0%**) |
| EHS release days at VIX ≤ 16 | 1 / 45 (**2.2%**) |
| **Blackout sessions at VIX ≤ 16** | **22 / 293 (7.5%)** |

The switch's own carve-out list — *"no FOMC, CPI or jobs print that session"* — is satisfied on 09-10:
the FOMC decision is 09-16, CPI is 09-11, jobs already passed. But the session is **inside the blackout**,
where the low-VIX trigger rate is **7.5%** rather than 5.0%, a **1.5×** inflation for reasons Leg 3 shows
have nothing to do with housing. **Fired on 09-10, the switch as amended would be a false positive read
as a housing signal.** The fix is one more clause, handed back to both siblings as an amendment rather
than a contradiction: *ITB > 3.0% on a clean EHS day with VIX ≤ 16 **and outside an FOMC blackout***.
For scale today: ITB's last-20-session median range is **1.809%** and VIX closed **14.53** on 09-04,
printing **15.68** intraday on 09-08 — so the tail is genuine but small either way.

### Primary content read — what the last published edition says

NAR's statistics page, current edition **July 2026 data**, released **August 11, 2026**: existing-home
sales **−1.7% m/m**, median sales price **$431,400**, inventory at a **4.6-month supply** — **4.06M**
SAAR; month over month sales rose in the Northeast, held steady in the West and declined in the Midwest
and South, while year over year they rose in the Midwest and West and were flat in the Northeast and
South. Chief Economist Lawrence Yun, verbatim: *"Home sales have been remarkably stable, even amid the
rising mortgage rate environment of the past few months… Year-to-date sales are up 2.4% and there's no
doubt that the housing market would be thriving if average mortgage rates were to return near 6%."*
The companion Pending Home Sales Index last read **−2.3%**.

**No content forward test is registered**, and the reason is stronger here than in the siblings. Their
refusal rested on FRED carrying only 13 months of `EXHOSLUSM495S` because NAR licenses and restricts the
series; **this session could not reach FRED at all** (timeout, recorded in `probe-ref.blocked`), so it
has *no* historical series of its own and would be guessing outright. A pre-scored guess is worse than a
refusal. Every figure above is quoted from NAR's own page and nothing is inferred from it.

### The adjacency sweep

- **Peer prints** — n/a, `symbols: []`. The homebuilder names were read as a *class* (Legs 3–6), not as
  holdings: ITB **93.91**, XHB **103.25**, SPY **770.19** (2026-09-04 closes, Nasdaq API, reproducing
  both siblings). Intraday 2026-09-08 10:18 ET: SPY **766.44**, ITB **92.16**, XHB **101.70** — builders
  off ~1.9% on the session, an observation, not a signal.
- **Macro surprises** — no last row to diff against; this is the baseline. In-session on 09-10: **PPI**
  08:30, this print 10:00, a **30-year bond auction** 13:00, the **ECB decision**, the Treasury coupon
  announcement, a 10y-20y buyback and OPEC's MOMR. Next morning: **CPI**, the August MTS and UMich
  preliminary sentiment. Ahead of that: **FOMC 09-16** with an SEP, then housing starts and the August
  PHSI on 09-17 as the blackout lifts.
- **Volatility regime** — **VIX 15.68** intraday 2026-09-08 (CBOE `delayed_quotes/_VIX.json`, 14:18 UTC),
  against a **14.53** close on 2026-09-04. The prior week ran 14.51 → 14.43 → 14.92 → 16.34 → 15.20 →
  14.32 → 14.53. This is load-bearing for Leg 6 rather than colour: at VIX ≤ 16 *and* inside a blackout,
  the sibling's 3.0% trigger is a 7.5% event rather than a 5.0% one, and 15.68 sits just under the line.
- **Geopolitical / policy** — the OPEC+ meeting (09-06) and MOMR (09-10) reach energy, not homebuilders.
  **This print is a NAR release, not a federal one**, so no US funding-cliff or shutdown mechanism
  reaches its publication. No channel to a series with no symbols.
- **Event tape** — no August consensus was findable at D-2 from a primary source, and this ledger
  publishes none rather than relay an aggregator's; the corridor's own implied-move commentary is priced
  off CPI 09-11, not off this release. Every content statement above is the last *published* edition,
  never a forecast.
- **One dated event proposed in this PR**, its own file owned by this lane:
  **`existing-home-sales-2026-10-13`** (NAR's own schedule, *"Tue., Oct. 13 | September
  Existing-Home Sales"*, plus the `.docx` twin). It is proposed **over a sibling's on-record decline**,
  and the reason is mechanical rather than a difference of taste. `existing-home-sales-2026-11-12`
  declined the October edition as *"routine… the thing worth watching is a workbook re-pull at the next
  pulse, not a calendar row"* — while in the same document making **2026-10-13** the dated observation
  for its own first kill switch (*"No `ContribArchives` vintage dated 2026-10-13 exists by
  2026-10-16"*). Those cannot both hold on that ledger's cadence: 11-12 is `low` impact, so
  `assessment-cadence.json` puts it in the `15+` band at every 30 days, its next pulse is **2026-10-06**
  and the one after **2026-11-05** — the **10-16** deadline falls in the gap, and `event-scan.mjs`
  surfaces nothing on either date because no calendar entry exists. A `never-assessed` row is what makes
  the rehearsal actually get looked at. It is also distinguishable on its own evidence: `PostedUpdates`
  schedules **no** posting on 10-13, the unscheduled shape that produced a solo vintage on all five of
  2026's unscheduled EHS dates, and unlike 09-10 it sits **outside** any blackout (the 10-28 meeting's
  window opens 2026-10-17).
- **Two classes considered and DECLINED**, so their absence reads as a decision. (i) **NAR Third Quarter
  Metro Home Prices, 2026-10-29** — found on the same primary schedule and genuinely untracked (the
  `fhfa-hpi-*` series is a different producer and a repeat-sales index, not NAR metro medians), but it is
  a quarterly metro-level table with **no GDPNow channel** and no house playbook, landing on a day
  already carrying the Q3 GDP advance, PCE and the ECB decision. A row buys no decision. (ii) **The
  August PHSI, 2026-09-17** — already proposed by the `fomc-2026-09-16` sweep as
  `pending-home-sales-2026-09-17.from-fomc-2026-09-16.json`; writing a competing proposal for an id
  another lane already owns is exactly what #1717 forbids.

### Honest limits

- **The blackout finding is an association on 678 sessions, and its confound is named.** Blackout
  windows are positioned by construction around mid-month meetings, so they systematically contain CPI
  and jobs prints — and CPI days carry ITB's widest macro median (2.081%). This ledger did **not**
  strip those out, so some unknown share of the 2.003%-vs-1.838% gap is macro-print composition rather
  than the blackout itself. The direction is not in doubt at p<0.001 across two correlated ETFs with SPY
  flat; the magnitude is an upper bound. What matters for the call survives either reading: whatever the
  cause, it is **not this print**, and the n=36 EHS-inside-blackout cut says so directly.
- **The blackout mask is built from an incomplete meeting set.** 90 end-dates parsed from the Fed's own
  pages, but the 2016–2020 historical-page parse recovers 36 of ~40 regular meetings and 2017/2023 come
  back short. Missing meetings mislabel true blackout sessions as non-blackout, which **dilutes** the
  measured contrast — a conservative bias, not an inflating one — and one 2025 entry (08-22) is a
  notation vote rather than a scheduled meeting.
- **p=0.038 is one cell out of nine simultaneous tape tests** (three cuts × three symbols) in Legs 4–5.
  Under any correction for multiplicity it is not significant on its own; it is reported because its
  *pattern* — index moves, homebuilders do not — is the same split Leg 3 finds in mirror image, not
  because the number clears a threshold.
- **"Solo" is read from free text.** The 123/17 split rests on a `Data releases` column whose spellings
  drift across a decade ("Existing home-sales" and "Existing-homes" both appear); a naive comma-split
  classifier gives 109/31 and a normalised one 123/17. Both readings support every substantive
  statement here, and the release-date join underneath does not depend on the classifier at all.
- **`ContribArchives` still ends 2026-07-28** — unchanged from the sibling's 2026-09-06 pull, i.e. the
  workbook is **42 days stale** today. The July edition (2026-08-11) has no vintage in it yet, so the
  "7 for 7" record is out-of-sample for August onward, and the two archive-keyed forward tests below
  carry a **2026-11-15** score-by date rather than a close-out-window one for exactly this reason.
- **No FRED, and no hourly source.** FRED timed out, so no series is restated from it; no hourly bar
  source was attempted, so nothing about the 10:00 hour specifically is claimed or registered.
- **All the nowcast work measures a model, not a market.** Every Δ describes the Atlanta Fed's estimate
  of GDP. The only price claims here are session-class studies, and all of them are reasons *not* to act.
- **`symbols: []` is doing real work.** Even were every measurement twice as strong, this event has no
  instrument attached and no house playbook keyed to it.

## Stance & kill switches

**Stance (date is `confirmed`, promoted this session on the publisher's own calendar).** Stand aside on
2026-09-10 and on every edition of this report. Hold four frames. **On the date:** it is NAR's own,
published in November 2025, stated three times across two NAR documents and a live page, and
corroborated by a second institution's forward schedule. **On the session:** it is the densest one this
corridor offers — PPI, this print, a 30-year auction, the ECB, inside an FOMC blackout, one day before
CPI — and the density is **real but misdirected**: the blackout widens homebuilders and only
homebuilders (ITB 2.003% vs 1.838%, XHB 1.784% vs 1.610%, both p<0.001 on n=678, SPY p=0.95), the PPI
widens the index and only the index (SPY 1.030% vs 0.879%, p=0.038, n=108, ITB/XHB null), and sitting a
day before CPI does nothing to anyone (n=107, ITB p=0.89). **On the print:** it is inert on all 114
instances, on the 100 solo ones, and — the cut that settles the proposal's own framing — on the **36**
that fell inside a blackout, which are no wider than the 78 outside (p=0.53). **On the nowcast:** the
Fed schedules this date with **three** releases, and composition matters — all **6** past ≥3-release EHS
vintages moved inventories past 0.0010pp against **17 of 123** solo ones, with \|ΔGDP\| median 0.1739pp
against 0.0410pp, while residential does not separate at all (\|Δ\|<0.10pp on 83.3% vs 81.3%). So read
**residential** and treat the headline and the inventories line as wholesale trade's. Nothing here
licenses an entry, and there is no instrument to enter.

**Kill switches** — any one of these ends the stance above and earns a ledger row:

- **ITB's session range on 2026-09-10 exceeds 3.0% with a VIX close ≤ 16.** The sibling switch on the
  first of the three dates it names — but read against the **7.5%** blackout-regime base rate, not the
  5.0% unconditional one. A clear-through would be a genuine tail and would put `symbols: []` back in
  question. Registered as `-1`.
- **Either ITB or XHB closes 2026-09-10 more than 2.0% from its open.** The directional form of
  inertness the siblings never registered; 85.1% / 87.7% of EHS days stay inside it. Registered as `-2`.
- **The GDPNow vintage dated 2026-09-10 posts solo**, naming existing-home sales alone despite the Fed's
  own schedule listing three releases. Leg 2's composition reading fails, and the forward schedule stops
  being informative about composition as well as about timing. Registered as `-3`.
- **That vintage moves the Q3-2026 change-in-inventory-investment contribution by less than 0.0010pp** —
  a solo-shaped reading on a three-release day, which would mean wholesale trade did not reach the
  inventories line and the composition split is weaker than 6-of-6 suggests. Registered as `-4`.
- **The 2026-09-10 vintage moves the Q3-2026 residential-investment contribution by ≥ 0.30pp.** Far past
  anything in the 140-vintage class; the commissions leaf would be carrying information the size of a
  real component surprise, and this print would acquire a reading worth waiting for.
- **NAR moves, delays or restructures the 2026-09-10 release on its own schedule.** The `confirmed`
  label reverts to `estimate` and Leg 1 is re-derived; the schedule page, its `.docx` twin and the live
  statistics page are the three places that would show it.
- **A macro- or housing-keyed house playbook lands in `docs/plans/trade-playbooks.md` before 2026-09-10.**
  The stand-aside is partly an absence-of-instrument argument; a housing-keyed playbook makes it a live
  question rather than a settled one.

**Registered predictions** (zero capital by design, scored from re-run data, never from memory) — see
[`forward-tests/existing-home-sales-2026-09-10.md`](../forward-tests/existing-home-sales-2026-09-10.md):

- `FT-existing-home-sales-2026-09-10-1` — **ITB's 2026-09-10 session range stays below 3.0%**, scored
  only if that session's VIX close is ≤ 16. Base **92.5%** for blackout sessions in that regime (the
  strictest relevant conditioning), 97.8% for EHS days, 95.0% for all low-VIX sessions. Score by
  2026-09-16.
- `FT-existing-home-sales-2026-09-10-2` — **neither ITB nor XHB closes 2026-09-10 more than 2.0% from
  its open.** Base 85.1% / 87.7% on 114 EHS days. Score by 2026-09-16.
- `FT-existing-home-sales-2026-09-10-3` — the **GDPNow vintage dated 2026-09-10 names existing-home
  sales alongside at least one other release.** Base: the Fed's own schedule names three, and 2 of 2
  scheduled 2026 EHS dates were multi-release against 5 of 5 unscheduled ones solo. Score by 2026-11-15
  (the archive lags ~6 weeks).
- `FT-existing-home-sales-2026-09-10-4` — that vintage moves the Q3-2026 **change-in-inventory-investment**
  contribution by **more than 0.0010pp**. Base **6 of 6** on ≥3-release shared vintages against **17 of
  123 (13.8%)** solo. Score by 2026-11-15.

No content forward test is registered (FRED was unreachable this session, so there is no base rate to
register one against) and no hourly test is registered (no hourly bar source was attempted, so this lane
could neither derive nor score one) — both refusals argued above.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-08 | D-2 | **Initial research on an id that existed only as a proposal (`from-fomc-2026-09-16`), now shadowed by the canonical file written this session. The corridor density the proposal filed this event for is REAL and MEASURABLE — and it splits by instrument in a way that leaves this print with none of it.** **Leg 1 — the date:** NAR's schedule page (HTTP 200, 483,177 B), its `.docx` twin published **2025-11** (55,384 B) and its live statistics page all read Thu., Sep. 10, 10:00 ET; the Atlanta Fed's `PostedUpdates` independently schedules a 09-10 10:00 posting. Status `estimate`→**`confirmed`**, `EST:`→**`IR:`**, on the `challenger-job-cuts-2026-09-03` precedent 11-12 used on the identical page. **Leg 2 — this vintage is SCHEDULED and SHARED, the inverse of 11-12:** the Fed names 09-10 *"Wholesale trade, Producer Price Index, Existing-home sales"* — a three-release composition never before paired with EHS. On 1,822 same-quarter deltas: **solo (n=123)** moves inventories a median **0.0001pp** and clears 0.0010pp **17/123 (13.8%)**; **≥3-release shared (n=6)** clears it **6/6**, \|ΔGDP\| median **0.1739pp** vs solo 0.0410pp. Residential does NOT separate (\|Δ\|<0.10pp on **83.3%** vs **81.3%**). Closest analogues **2026-01-14** (+0.1863pp GDP) and **2026-06-09** (+0.1615pp) both had ordinary residential moves. **So read residential; the headline and inventories are wholesale trade's.** **Leg 3 — the blackout is the real widener, and it is a regime not a print (this ledger's central new finding):** mask built from **90** FOMC end-dates (Fed's own current + 2016–2020 historical pages), second-Saturday-before → Thursday-after, reproducing `fomc-blackout-start-2026-09-05` exactly. **678/2,514** blackout sessions: ITB **2.003%** vs 1.838% (p<**0.001**), XHB **1.784%** vs 1.610% (p<0.001), **SPY untouched** 0.882% vs 0.885% (p=0.948); threshold form ITB 55.3% vs 48.0%, XHB 57.7% vs 47.2%, SPY 49.9% vs 50.1%. **But it does not attach to this print:** the **36** EHS days inside a blackout are no wider than the 78 outside (ITB 1.859% vs 1.927%, p=**0.529**; XHB p=0.723; SPY p=0.543). **Leg 4 — the crowding lands on the index, not the builders:** **108** PPI vintage days give SPY **1.030%** vs 0.879% (p=**0.038**) with ITB p=0.650 and XHB p=0.961; **107** sessions one trading day BEFORE a CPI vintage are flat (ITB **1.862%** vs 1.873%, p=**0.888**) — complementing 11-12's CPI+2 cut from the other side. The corridor's real homebuilder event is **CPI 09-11**: ITB median **2.081%** on CPI days vs 1.920% EHS / 1.913% PPI / 1.872% all. **Leg 5 — the print's own tape, reproduced independently:** Nasdaq API, **2,514 sessions 2016-09-06 → 2026-09-04**; all **114** EHS days SPY 0.912% (p=0.652), ITB 1.920% (p=0.566), XHB 1.733% (p=0.459); the **100 solo** ones SPY 0.899% (p=0.805), ITB 1.915% (p=0.625), XHB 1.724% (p=0.547). Open→close *narrower* on EHS days (ITB 0.841% vs 0.856%). Lands within 0.01pp of both siblings on an independent pull. **Leg 6 — the sibling kill switch needs a THIRD clause, and 09-10 is where it bites:** 12-09 names 09-10 as the first of three dated chances; 11-12 amended it with VIX ≤ 16. Still unsafe here — ITB >3.0% fires on **5.0%** (53/1,051) of all low-VIX sessions but **7.5%** (22/293) of low-VIX **blackout** sessions, a **1.5×** inflation from Leg 3's regime. The switch's carve-outs (no FOMC/CPI/jobs that session) are all satisfied on 09-10, so **as amended it would fire as a false positive read as housing**. Amendment handed back to both siblings: add **"and outside an FOMC blackout"**. ITB last-20 median range **1.809%**; VIX **14.53** (09-04 close), **15.68** intraday 09-08. **Collection:** FRED **timed out** (in `probe-ref.blocked`) so NO series is restated from it and the siblings' mortgage line is dropped rather than repeated; all content figures are quoted from NAR's own page. **Data-quality catch:** CBOE's `VIX_History.csv` carries a **09/07/2026** row at 15.30 on a full market closure, but CBOE's own `delayed_quotes/_VIX.json` reports `prev_day_close` **14.53** (=09-04) and Nasdaq's bars end 09-04 — the CSV row is treated as spurious, and this is independent corroboration for `labor-day-market-closure-2026-09-07`, whose own lane owns it (nothing written there). **Primary content:** July 2026 edition (released 08-11) — **4.06M** SAAR, **−1.7% m/m**, median **$431,400**, supply **4.6 months**; NE up, West steady, Midwest and South down; Yun quoted verbatim; PHSI last **−2.3%**. **No content forward test** — a stronger refusal than the siblings' since FRED was unreachable entirely. **Adjacency — peers:** n/a, `symbols: []`; ITB 93.91 / XHB 103.25 / SPY 770.19 (09-04), intraday 09-08 92.16 / 101.70 / 766.44. **Macro:** in-session PPI 08:30, 30Y auction 13:00, ECB, coupon announcement, 10y-20y buyback, OPEC MOMR; next morning CPI + MTS + UMich; then FOMC 09-16 (SEP), housing starts + PHSI 09-17. **Volatility:** VIX 15.68, just under the 16 line that conditions Leg 6. **Geopolitical:** OPEC+ 09-06 and MOMR 09-10 reach energy, not builders; a NAR release carries no federal funding mechanism. **Event tape:** no primary-sourced August consensus findable at D-2 and none relayed from an aggregator. **One dated event proposed** (own file, `estimate`): **`existing-home-sales-2026-10-13`**, proposed OVER 11-12's on-record decline on a mechanical ground that lane did not check — it made 10-13 the dated observation for its own first kill switch (*"no vintage dated 2026-10-13 by 2026-10-16"*) while its `low`-band cadence puts its pulses at **2026-10-06** and **2026-11-05**, straddling the deadline, and no calendar row exists for `event-scan.mjs` to surface. 10-13 is also unscheduled by the Fed (the solo shape, 5/5 in 2026) and sits **outside** any blackout. **Two classes declined on the record:** NAR **Q3 Metro Home Prices 2026-10-29** (untracked and primary-sourced, but no GDPNow channel, no playbook, and a day already carrying Q3 GDP advance + PCE + ECB) and the **August PHSI 09-17** (already owned by `pending-home-sales-2026-09-17.from-fomc-2026-09-16`; a competing proposal is what #1717 forbids). **Four forward tests registered**, two scoreable from one day of bars and two from a workbook re-pull: `-1` (ITB range <3.0% at VIX ≤ 16; base 92.5% blackout / 97.8% EHS), `-2` (neither ITB nor XHB open→close >2.0%; base 85.1%/87.7%), `-3` (the 09-10 vintage names EHS with ≥1 co-release; base 2/2 scheduled multi vs 5/5 unscheduled solo), `-4` (that vintage moves inventories >0.0010pp; base 6/6 multi vs 17/123 solo). The archive-keyed pair carry **2026-11-15** score-by dates because `ContribArchives` still ends **2026-07-28** — 42 days stale today. **Honest limits stated rather than implied:** the blackout gap is an association whose CPI/jobs composition confound was NOT stripped (magnitude is an upper bound; direction survives, and the n=36 cut settles the decision either way), the mask is built from an incomplete meeting set (a diluting, conservative bias), and p=0.038 is one cell of nine simultaneous tests, reported for its pattern rather than its threshold. | **Initial stance set: stand aside on every horizon; date promoted to `confirmed` on NAR's own calendar (three primary sources plus the Fed's schedule), the proposal's corridor-density premise CONFIRMED but REDIRECTED — the blackout widens homebuilders and only homebuilders (p<0.001, n=678) while same-session PPI widens the index and only the index (p=0.038, n=108) and the day before CPI does nothing (p=0.888, n=107), and the print itself is inert on all 114 instances INCLUDING the 36 inside a blackout (p=0.529) — the sibling's solo-vintage framing INVERTED for this edition because the Fed schedules 09-10 with three releases, so only the residential leaf is attributable (6/6 of ≥3-release vintages move inventories past 0.0010pp against 17/123 solo, while residential does not separate at all), and the 12-09 kill switch amended a second time: `VIX ≤ 16` is insufficient inside a blackout (7.5% vs 5.0%), so `and outside an FOMC blackout` is handed back to both siblings and registered as `-1`.** | 2026-09-15 (low, 0+ band: every 7d) — in practice the close-out, due by **2026-09-16** (`closeOutWithinDays: 6`) |

| 2026-09-15 | D+5 | **Close-out, scored from bars and workbooks re-pulled today after the mandated cache bust — never from memory.** **The print landed 10:00 ET as scheduled:** August EHS **3.98M** SAAR, **−2.0% m/m**, inventory **1.62M**, prices **+1.6%**, supply **4.9 months** — Yun, verbatim, *"its highest level in over ten years"*, and YTD sales decelerating to **+1.6%** from July's +2.4%. **The stand-aside was right, and the corridor made it a real test rather than a quiet one:** ITB fell **−6.06%** and XHB **−6.14%** across 09-04 → 09-10, yet the print's own session carried the *smallest* open→close slice of it (ITB **−0.932%**, XHB **−1.042%**), the largest single-session move came **two days before** the release (09-08, ITB **−2.506%** open→close), and **60%** of 09-10's own −2.314% close-to-close was already in the **overnight gap** (90.31 → 89.05), i.e. priced before 10:00. **FT scoring: `-2` PASS** (both ETFs inside ±2.0%; void clauses all clear — full session, release not moved, and ITB's ex-date is **Sep 15**, $0.753908, not 09-10, per iShares' own distributions table). **`-1` VOID by its own stated clause** — **VIX closed 17.84** on 09-10, above the 16 the row conditioned on, exactly the possibility it flagged as live; the observable *would* have passed (ITB range **2.176%** < 3.0%), so the sibling switch had no chance to fire either way and **09-10 is spent without an observation**, which `existing-home-sales-2026-12-09` and `-11-12` should read as one of three dated chances gone. **`-3` and `-4` remain open to 2026-11-15 as registered** — `ContribArchives` **still ends 2026-07-28** (1,871 vintages; **49 days stale**), so no 09-10 vintage exists to score. The *schedule* half of Leg 2 held: `PostedUpdates` re-read today still names 09-10 verbatim *"Wholesale trade, Producer Price Index, Existing-home sales"*, and **10-13 remains unscheduled** (10-08 is Wholesale trade alone, 10-15 Retail sales + PPI) — the solo shape this lane's 10-13 proposal argued from. **Three tape legs got no support on their first out-of-sample instance, none of which moved the decision:** SPY's 09-10 range was **0.458%**, the corridor's *narrowest* and below the 0.881% all-session baseline, against Leg 4's PPI-day median of 1.030%; ITB's CPI-day (09-11) range **1.910%** was the corridor's narrowest blackout session, against Leg 4's claim that CPI is the corridor's real homebuilder event (ITB in fact **rallied +1.496%** that day); and the day-before-CPI "flat" finding met a 2.176% ITB session. n=1 each, and the ledger had already flagged p=0.038 as one cell of nine. **Leg 3 held:** 09-10's ITB range sat above the blackout median (2.176% vs 2.003%) and the corridor's widest ITB session (**09-08, 2.603%**) was a blackout day with **no** EHS print. **The mechanism the D-2 session could not reach, now sourced:** FRED timed out again today (both `MORTGAGE30US` and `DGS10`, recorded in `probe-ref.blocked`), but **Freddie Mac's own `pmms/docs/PMMS_history.csv` answers on this runner** — PMMS 30-year fixed printed **6.76%** dated **2026-09-10**, the **high of 2026** (36 weeks, 5.98–6.76) and the highest since **6/26/2025 (6.77%)**, up from 6.71% a week earlier. That is a same-week rate print at a multi-year high and a better explanation for a −6% builder drawdown than anything in this ledger's legs — and the reusable finding is that **PMMS is the publisher and FRED only the mirror**, so a blocked FRED housing series is not a dead end for any lane on this calendar. **Adjacency:** ITB 88.22 → **90.05** and XHB 96.91 → **98.27** by 09-14, SPY 757.83 → **760.88**; **VIX 14.53 → 17.84 → 15.84 → 17.10**, a **+3.31** point move off the reference (past the screen's 3-point bar); CBOE's `VIX_History.csv` **still** carries the spurious 09/07/2026 Labor Day row at 15.30, a week on, confirming the D-2 catch. **No new dated event to propose** — every candidate this sweep surfaced is already tracked, and this lane's own `existing-home-sales-2026-10-13` proposal was **adopted as a canonical entry with its own ledger**, so 11-12's 2026-10-16 kill-switch deadline will now actually be looked at; NAR's live page independently re-states *"Tuesday, October 13, 2026 at 10:00 a.m. Eastern"*. The NAR Q3 Metro Home Prices class this lane declined is now carried by `nar-metro-home-prices-2026-10-29.from-pending-home-sales-2026-09-17`. | **Stand aside CONFIRMED on every horizon, at zero cost, on a session that was genuinely hostile to it: builders fell 6% through this corridor and the print's own hours are the one slice that cannot be charged with it.** The decision leg held; three attribution legs got no n=1 support and are handed forward as weaker than the ledger stated, not as falsified. `-2` PASS, `-1` VOID on its VIX clause (and 12-09's switch is now one dated chance poorer with nothing observed), `-3`/`-4` open to 2026-11-15 on a 49-day-stale archive. `symbols: []` and the absence of any housing-keyed playbook were never in question and remain the load-bearing reason. | — (closed; `## Outcome` filled, the scanner goes quiet on this event) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-existing-home-sales-2026-09-10.json`
(`status: "estimate"`) in the same PR — your own file, never another event's canonical one (#1717).
Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from
memory — after which this doc goes quiet.

## Outcome

**Close-out (2026-09-15, D+5, inside the 6-day `closeOutWithinDays` window).** Macro-print mode runs no
`earnings-cycle` / `intraday-edges` instrument — `symbols: []` by design — so the mandated cache bust
(`rm -rf node_modules/.cache/earnings-cycle node_modules/.cache/intraday-edges`) had no target and every
figure below comes from a source re-fetched **today**, never from memory of the tape: Nasdaq's
historical-quote API for SPY/ITB/XHB daily bars, CBOE's `VIX_History.csv` and `delayed_quotes/_VIX.json`,
NAR's live statistics and schedule pages, the Atlanta Fed's `GDPTrackingModelDataAndForecasts.xlsx` and
`GDPNowcastDataReleaseDates.xlsx`, iShares' ITB distributions table, and — new this session — Freddie
Mac's own `pmms/docs/PMMS_history.csv`.

### The print landed on schedule, and it was a soft one

| Field | August 2026 (released 2026-09-10, 10:00 ET) | July 2026 (prior) |
|---|---|---|
| Sales, SAAR | **3.98M** | 4.06M |
| Month over month | **−2.0%** | −1.7% |
| Inventory | **1.62M** homes | — |
| Months' supply | **4.9** — *"its highest level in over ten years"* | 4.6 |
| Median price | **+1.6%** | $431,400 |
| Year-to-date sales | **+1.6%** | +2.4% |

Regionally, month over month sales held steady in the West and declined in the Northeast, Midwest and
South; year over year they were unchanged in the South and declined in the Northeast, Midwest and West.
Lawrence Yun, verbatim: *"Mortgage rates and home sales move in opposite directions, so it's not
surprising to see a mild dip in home buying activity due to high mortgage rates,"* and *"The number of
months it would take to exhaust the total inventory at the current sales pace has grown to 4.9 months'
supply—its highest level in over ten years."* NAR's page independently re-states the next edition:
*"Existing-Home Sales for September 2026 will be released on Tuesday, October 13, 2026 at 10:00 a.m.
Eastern."* The two linked release PDFs (`ehs-08-2026-summary-2026-09-10.pdf`, 504,931 B;
`ehs-08-2026-supplemental-data-2026-09-10.pdf`, 138,219 B) fetched **HTTP 200** but their text layer is
font-encoded and this runner has no PDF toolchain, so nothing is quoted from them — the figures above
are NAR's own HTML, which is equally primary.

### Scoring the stance — right call, on a session that genuinely tested it

**The corridor was not quiet, and that is what makes the result worth something.** ITB fell **−6.06%**
and XHB **−6.14%** from the 2026-09-04 close to the 2026-09-10 close. A stand-aside on a flat week proves
nothing; a stand-aside through a 6% drawdown in the exact names the event is keyed to is a real
observation — provided the drawdown is not attributable to the print. It is not:

| Session | ITB range | ITB open→close | ITB close→close | XHB open→close | SPY range |
|---|---|---|---|---|---|
| 09-04 | 1.555% | +0.794% | — | +1.385% | 0.502% |
| **09-08** | **2.603%** | **−2.506%** | −3.045% | −2.127% | 0.595% |
| 09-09 | 1.949% | −0.572% | −0.813% | −1.106% | 0.463% |
| **09-10 (the print)** | 2.176% | **−0.932%** | −2.314% | −1.042% | **0.458%** |
| 09-11 (CPI) | 1.910% | −0.178% | **+1.496%** | +0.521% | 0.364% |
| 09-14 | 2.199% | +1.328% | +0.570% | +1.111% | 0.735% |

Three facts in that table carry the verdict. The **largest** single-session homebuilder move in the
corridor was **09-08**, two sessions *before* the release. The print's own session carried the
**smallest** open-to-close decline of the three down days. And **60%** of 09-10's −2.314% close-to-close
was the **overnight gap** — ITB's 09-09 close of 90.31 to its 09-10 open of 89.05 is **−1.395%**, a move
already priced hours before the 10:00 print existed (XHB's gap share: **56%**). Whatever repriced
homebuilders that week had substantially finished doing so before this report was published.

### Scoring the four registered forward tests

| # | Prediction | Observed | Verdict |
|---|---|---|---|
| `-1` | ITB 09-10 session range < 3.0%, **scored only if VIX close ≤ 16** | range **2.176%** (H 89.52 / L 87.60 / C 88.22); **VIX close 17.84** | **VOID** — its own stated clause |
| `-2` | Neither ITB nor XHB closes > 2.0% from its 09-10 open | ITB **−0.932%**, XHB **−1.042%** | **PASS** |
| `-3` | A 09-10 GDPNow vintage names EHS + ≥1 co-release | no 09-10 vintage exists; archive ends **2026-07-28** | **OPEN** → 2026-11-15 |
| `-4` | That vintage moves inventories > 0.0010pp | same — nothing to diff | **OPEN** → 2026-11-15 |

**`-1` voided, and the void is the informative part.** The row conditioned itself on a VIX close ≤ 16 and
said in writing that 15.68 intraday at D-2 *"sits close enough to the line that this is a live
possibility rather than a formality."* It was: VIX ran **14.53 → 15.72 → 16.46 → 17.84** into the print,
a **+3.31** point move that took the regime out from under the test. Two things follow that the siblings
need. First, the *observable* would have passed anyway — 2.176% is comfortably under 3.0% — so nothing
about the underlying claim is in doubt. Second, and less comfortable: `existing-home-sales-2026-12-09`'s
third kill switch named **three** dated chances to observe an ITB blow-out on a clean EHS day, and the
first of them is now **spent with no observation at all**, because the VIX clause `-11-12` added (and
this ledger endorsed) is exactly what disqualified it. A conditioning clause that makes a switch safer
also makes it rarer; with two dates left (10-13, 11-12) that trade-off is now a measured cost, not a
theoretical one.

**`-2` passes cleanly, and all three void clauses were checked rather than assumed.** 2026-09-10 was a
full session (SPY volume 42.7M, in line with the corridor). NAR did not move the release. And the
distribution check settles on the primary: iShares' own table gives ITB's next ex-date as **Sep 15,
2026** at **$0.753908** — today, not the print date — with the prior one Jun 15; SSGA reports XHB's fund
distribution yield at **0.73%**. No ex-distribution touched 09-10, and none of a quarterly size on a
sub-1% yielder could have accounted for a 2% move in any case.

**`-3` and `-4` stay open on exactly the reason they were registered.** `ContribArchives` re-pulled today
holds **1,871 vintages** ending **2026-07-28** — unchanged from the 09-06 and 09-08 pulls, now **49 days
stale**. The initial research gave this pair a **2026-11-15** score-by date rather than a close-out-window
one precisely because the archive lags ~6 weeks; that judgment is vindicated and the rows are left
untouched for whichever session picks them up. The *schedule* half of Leg 2 did get a check and held:
`PostedUpdates`, re-read today, still carries 2026-09-10 verbatim as *"Wholesale trade, Producer Price
Index, Existing-home sales."*

### Three attribution legs got no support on their first out-of-sample instance

The decision leg — *this print is not tradeable* — held. The legs that explained **where the session's
width would come from** mostly did not, and the honest close-out says so:

- **Leg 4's PPI claim (SPY 1.030% vs 0.879%, p=0.038, n=108) got nothing here.** SPY's 09-10 range was
  **0.458%** — the *narrowest* of the corridor's six sessions and well under the 0.881% all-session
  baseline, on a day carrying both PPI and this print. The ledger had already flagged that cell as one of
  nine simultaneous tests that survives no multiplicity correction; this instance is consistent with it
  being noise.
- **Leg 4's CPI claim fared no better.** *"The corridor's ITB-relevant event is Friday's CPI"* met an
  ITB CPI-day range of **1.910%** — the narrowest blackout session of the six — against the claimed
  CPI-day median of 2.081%. ITB **rallied +1.496%** that day; CPI was relief, not the corridor's
  homebuilder event.
- **The "day before a CPI is flat" finding (n=107, ITB p=0.888) met a 2.176% session.** Confounded with
  the blackout, so it is weak evidence either way — but it is not support.
- **Leg 3 did hold.** 09-10's ITB range sat above the blackout median (2.176% vs 2.003%) and above the
  all-session 1.868%, and the corridor's **widest** ITB session was **09-08 at 2.603%** — a blackout day
  with no EHS print on it. That is the regime-not-print shape the leg predicted, observed twice.

**n=1 on each, which is the whole caveat.** A single session below a median falsifies nothing — roughly
half of PPI sessions sit below the PPI-day median by construction. What is being recorded is that the
one out-of-sample instance available gave these legs no support, so a later lane should treat them as
weaker than this ledger's prose stated, and should not cite p=0.038 as though it had been confirmed.

### The mechanism this event's D-2 session could not reach — and a reusable fix

The initial research dropped the siblings' mortgage-rate line entirely rather than restate it from a
source it could not fetch, which was the right call under the honesty rules. FRED timed out **again**
today (`MORTGAGE30US` and `DGS10`, both recorded in `probe-ref.blocked`). But the series has a publisher,
and the publisher answers: **Freddie Mac's `pmms/docs/PMMS_history.csv` returned HTTP 200 on the first
try.**

| PMMS 30-year fixed | 8/20 | 8/27 | 9/3 | **9/10** |
|---|---|---|---|---|
| Rate | 6.65 | 6.66 | 6.71 | **6.76** |

**6.76% is the high of 2026** across 36 weekly prints (range 5.98–6.76) and the highest reading since
**6/26/2025 (6.77%)** — dated the same Thursday as this release, and it is precisely what Yun's quote
blames. A same-week mortgage-rate print at a multi-year high is a materially better explanation for a 6%
homebuilder drawdown than anything in this ledger's legs, and it was unavailable at D-2 for a purely
mechanical reason.

**The transferable finding is the plumbing, not the number: PMMS is the producer and FRED only a
mirror.** Any lane on this calendar that has recorded a blocked FRED housing or mortgage series has a
working primary it was not using. This ledger states the rate as context for the tape it just scored; it
does not retrofit it into a leg, and no forward test is registered against it, because registering a
prediction after seeing the data is exactly the falsification the rules forbid.

### Adjacency at close-out, and no new proposal

- **Peers** — n/a, `symbols: []`. Class recovered after the print: ITB **88.22 → 90.05**, XHB
  **96.91 → 98.27**, SPY **757.83 → 760.88** by 09-14.
- **Volatility** — VIX **14.53** (09-04 reference) → **17.84** (09-10) → 15.84 (09-11) → 17.10 (09-14),
  **17.09** intraday today. The **+3.31** point move past the reference clears the deterministic screen's
  3-point materiality bar on its own, and it is what voided `-1`. CBOE's `VIX_History.csv` **still**
  carries the spurious **09/07/2026** row at 15.30 on a full market closure — a week later, unfixed —
  which confirms the D-2 data-quality catch; `labor-day-market-closure-2026-09-07` owns that finding and
  nothing is written to its file here.
- **Geopolitical / policy** — nothing new reaching a symbol-less NAR release.
- **No dated adjacent event is proposed.** Every candidate this sweep surfaced is already tracked, and
  the one this lane *did* propose in its initial-research PR — **`existing-home-sales-2026-10-13`** — has
  been **adopted as a canonical calendar entry with its own ledger**, over `-11-12`'s on-record decline.
  That closes the loop the proposal was filed to close: 11-12's first kill switch (*"no vintage dated
  2026-10-13 by 2026-10-16"*) fell in the gap between that lane's own 10-06 and 11-05 pulses, and now has
  a row that will surface it. The NAR Q3 Metro Home Prices class this lane declined on the record is
  carried by another lane's proposal (`nar-metro-home-prices-2026-10-29.from-pending-home-sales-2026-09-17`),
  so the decline cost nothing.

### What the next lane inherits

1. **`-3` and `-4` are live to 2026-11-15** and score off one `ContribArchives` re-pull. They pair with
   `FT-existing-home-sales-2026-11-12-2` on opposite sides of the composition split — one workbook scores
   both, which is worth more than either alone.
2. **12-09's kill switch is one dated chance poorer with nothing observed.** Two remain (10-13, 11-12),
   and the VIX ≤ 16 clause is why. The *"and outside an FOMC blackout"* amendment this ledger handed the
   siblings was never exercised and is neither confirmed nor refuted.
3. **Treat Legs 3–6's magnitudes as this ledger's weakest claims.** The blackout split survived its first
   instance; the PPI and CPI splits did not. None of it changes the action, which rests on `symbols: []`
   and the absence of a housing-keyed playbook, neither of which moved.
4. **FRED is not the only door.** `freddiemac.com/pmms/docs/PMMS_history.csv` works from this runner.

**Final verdict: the call was correct and cost nothing, on the hardest instance the 2026 calendar had to
offer.** Stand aside was right on every horizon; the date promotion to `confirmed` held (the release
landed 10:00 ET as NAR's own calendar said, and the Atlanta Fed's schedule row is unchanged); one forward
test passed, one voided on a regime shift it had itself flagged as a live possibility, and two remain
open on a stale archive exactly as registered. This document now goes quiet.
