# Bank of England MPC decision + April Monetary Policy Report — the forecast round whose conditioning window closes before the Fed decides, on a VAT step it has no data on — boe-decision-2027-04-29

**Kind:** macro-print · **Date:** 2027-04-29 (estimate, EST: bankofengland.co.uk/monetary-policy/upcoming-mpc-dates, fetched direct 2026-09-09 — the 2027 panel is headed "Provisional dates" and lists "Thursday 29 April" as one of four Monetary Policy Report rounds (4 February, 29 April, 29 July, 4 November); corroborated the same day from a second BoE surface, bankofengland.co.uk/news/2025/december/mpc-dates-for-2027, the Bank's own announcement "Published on 18 December 2025" headed "Provisional dates for Monetary Policy Committee (MPC) announcements on Bank Rate and publication of MPC meeting minutes and the quarterly Monetary Policy Report". Filed estimate on two counts, and the first is real rather than taxonomic — the Bank labels its own 2027 dates **provisional**, unlike its 2026 dates — plus the standing gap that market-events-data.ts's confirmed-prefix taxonomy has `FED:` and no slot for a non-Fed central bank) · **Impact:** medium
**Last assessed:** 2026-09-09
<!-- probe-ref: {"symbols":{},"vix":16.19,"daysBand":"medium:31+","adjacentIds":["boj-decision-2027-04-28","consumer-confidence-2027-04-27","fhfa-hpi-2027-04-27","fomc-2027-04-28","russell-style-month-end-capping-effective-2027-04-30","tic-annual-survey-final-2027-04-30","treasury-borrowing-estimates-2027-05-03"],"screenStreak":0,"blocked":[{"url":"https://www.ons.gov.uk/releasecalendar?fromDateDay=1&fromDateMonth=4&fromDateYear=2027&toDateDay=31&toDateMonth=5&toDateYear=2027&keywords=consumer+price+inflation","status":"NO_CONTENT_RETURNED","at":"2026-09-09"},{"url":"https://www.ons.gov.uk/releases/consumerpriceinflationukapril2027previousReleases","status":"404","at":"2026-09-09"}]} -->

## At a glance

**TL;DR.** **The three sibling BoE ledgers were all built on one thing — centralbank.watch's rate
strip — and that thing does not reach this meeting. Its Bank of England page, fetched today, stops at
2026-12-17; there are no 2027 rows.** So this ledger makes **no rate call**, registers **no
directional Bank Rate test**, and says so rather than manufacturing one from a curve nobody published.
What it hands the family instead is a **mechanic**, measured off two BoE primaries: an MPR's
projections are conditioned on the market path over the **15 working days to a stated cut-off**, and
that cut-off runs **8–10 days before publication** — the April 2026 MPR (published **30 April 2026**)
names *"the 15 days to 22 April"*; the July 2026 MPR (published **30 July 2026**) names *"the 15
working days to 20 July"*. Applied to **2027-04-29**, the cut-off lands **~2027-04-19 to 2027-04-21**,
with two consequences nobody had written down. It falls **on or within two days of the March 2027 CPI
print** (ONS, fetched: **2027-04-21 07:00 London**) — and on the exact April analogue it fell **on**
the print date, because the March 2026 CPI bulletin was released **22 April 2026**, the very cut-off
that Report names. And it falls **seven to ten days before `fomc-2027-04-28`**, so the **published
April 2027 forecast is conditioned on a curve struck before the Fed decides**. Second, the proposing
lane's sequencing claim is **verified against fetched ONS pages**: MPC **03-18** (no MPR, pre-lapse) →
VAT reversion **04-01** → March CPI **04-21** (still a zero-rated collection month) → **this MPR,
booking the step blind** → April CPI **05-19**, the first observation → MPC **06-17**, the first
committee to see it. Forecast to first-committee is **49 days — exactly seven weeks**. Third, this
inverts the December ledger's attribution rule: the BoE is the **last of three central banks in ~36
hours** and, per `fomc-2027-04-28`'s own header (no SEP asterisk on that Fed row), the **only one of
the three publishing a full forecast round**. **None of it is ours to trade** — `symbols: []`, no
rates- or sterling-keyed playbook. Date is **estimate**, and here that label is load-bearing rather
than cosmetic: the Bank's 2027 dates are its own **provisional** ones.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — nothing here is ours to hold, and nothing will be at D-232 | High | `symbols: []`, no rates-keyed playbook, and this calendar's whole tracked universe is AAPL/AMZN/AVGO/CRWV/GOOG/META/MRVL/MSFT — no UK listing, no gilt, no sterling leg | A tracked name moving **>2%** in the **07:00–09:30 ET** window on **2027-04-29** attributable to the BoE — the "no price channel" premise is false and this doc is rebuilt |
| This week | **Record the pricing gap as a fact about our sources, not a view about the Bank** | High | centralbank.watch's BoE page, **fetched 2026-09-09**, publishes rows only through **2026-12-17**. The decomposition that is the entire contribution of [`boe-decision-2026-12-17`](boe-decision-2026-12-17.md) — no hike 5.4% · one 45.2% · two 49.4% — **has no 2027 analogue to run**. A later session that quotes a 2027 probability must name where it came from | The BoE page (or a second fetched curve source) publishing **2027 meeting rows**, at which point the decomposition method becomes available here and this ledger gains a rate-direction test it currently refuses to register. Re-check every pulse; first chance **2026-09-30** |
| This month | **Do not diarise 2027-04-29 as a fixed date. Carry it as provisional and re-check the Bank's calendar each pulse** | Medium | Both BoE surfaces fetched today head the 2027 list *"Provisional dates"* — a materially weaker label than the 2026 rows the three sibling ledgers rest on, and the honest reason `estimate` sits here on top of the taxonomy gap. The Bank has published these since **18 December 2025** and has not moved them | The Bank re-publishing its 2027 schedule with **29 April moved, or without a Monetary Policy Report beside it** (**FT-boe-decision-2027-04-29-2**) — the header and the whole forecast-round framing break together |
| This quarter | **Carry the conditioning-window mechanic across the family — it is the transferable output of this session, and it is testable on this meeting's own document** | Medium | Measured off two BoE primaries (**April 2026** MPR: *"the 15 days to 22 April"*, published 30 April; **July 2026** MPR: *"the 15 working days to 20 July"*, published 30 July), the cut-off is **8–10 days before publication** — so the April 2027 MPR's market path is struck **before `fomc-2027-04-28`**, and on the April analogue **on the day of** the March CPI print. The November lane already told sessions to read *"the conditioning path"*; none had established **when it closes** | The **2027-04-29 Monetary Policy Report** naming a conditioning cut-off **outside 2027-04-16 to 2027-04-23** (**FT-boe-decision-2027-04-29-1**) — the 8–10 day regularity is not a convention, and every claim built on it here is re-derived from scratch |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit, hedge or size is keyed to 07:00 ET on 2027-04-29. A `medium`-tiered `estimate` event on a foreign central bank with `symbols: []` licenses nothing.
- **The honest headline is an absence.** There is **no published market pricing for this meeting**. Any later session quoting a 2027 BoE probability must state its source and date; this ledger has none and registers no rate-direction test.
- **The mechanic to carry — an MPR's conditioning window closes 8–10 days before it publishes.** For 2027-04-29 that is **~2027-04-19 to 2027-04-21**. Read the Report's own stated cut-off first; everything below depends on it.
- **Consequence one: the forecast pre-dates the Fed.** `fomc-2027-04-28` is **the day before this meeting** and **7–10 days after** the conditioning cut-off. Comparing the April 2027 projections to the post-FOMC curve compares two different worlds; say so rather than calling it a forecast error.
- **Consequence two: the last UK CPI print may be inside the window by one session, or outside it.** March 2027 CPI is **2027-04-21 07:00 London** (ONS, fetched, *"not yet published"*; **proposed here** as `uk-cpi-2027-04-21`). On the April-2026 analogue the print date **was** the cut-off date (22 April 2026, both).
- **The VAT sequencing, verified, and it is a look-through argument — not a rate call.** MPC **03-18** → reversion **04-01** → March CPI **04-21** (still zero-rated) → **this MPR, forecasting the step with no observation of it** → April CPI **05-19** (first observation) → MPC **06-17** (**proposed here**), **49 days** after the forecast. A self-reversing tax notch whose forecast and observation never coincide is what a committee looks through.
- **Attribution rule, inverted from December's.** Seven tracked events within five days; the two that matter are **`boj-decision-2027-04-28`** (Outlook Report) and **`fomc-2027-04-28`** (high, **no SEP** per its own header), both the **day before**. December's rule was *check the ECB before crediting the BoE, because the ECB has projections and the BoE has only minutes*. Here the BoE is the **only** one of the three with a forecast round — so it outranks the Fed for **interpretive content on the cluster**, and **not** for market impact on eight US mega-caps, where the Fed still outranks it.
- **The one number the Bank has already put in this window.** The **July 2026** MPR's conditioning path *"factor[ed] in a high chance of two rate hikes by Q3 2027"* while its modal CPI **undershot** at both two years (**1.7%**) and three (**1.9%**) — inherited from [`boe-decision-2026-11-05`](boe-decision-2026-11-05.md), not re-fetched. **2027-04-29 sits inside that window**, which makes this the round most likely to be publishing a walk-back of a path the committee never endorsed. Registered as **FT-boe-decision-2027-04-29-3**.
- **What is NOT here.** No annual QT review (that is the September round's, per the 19 June 2026 APF notice), and no UK labour-market date — gov.uk statistics announcements, fetched today, publishes **no 2027 labour-market overview at all**, so none is proposed.
- **Watch (dated)** — **BoE 2026-09-17** (est; vote split + annual QT + the new MaPS) · **UK Budget 2026-10-28** · **BoE 2026-12-17** (est; the sibling's scoring venue) · **BoE MPR 2027-02-04** (est) · **UK CPI 2027-02-17** (est; the 2027 electricity weight is drawn here) · **MPC 2027-03-18** (est) · **VAT reversion 2027-04-01** · **UK CPI 2027-04-21** (est, proposed here) · **FOMC + BoJ 2027-04-28** · **this meeting 2027-04-29** (est) · **UK CPI 2027-05-19** (est) · **MPC 2027-06-17** (est, proposed here).

## Initial research

### The question, plainly

Three sibling ledgers already cover this cycle's BoE meetings, and all three are built on the same
object: centralbank.watch's Bank of England rate strip. September called its own rate "dead
information", November called itself "the one live rate decision on the UK strip", and December
decomposed the strip's cumulative column into a three-outcome distribution and used it to re-price two
sibling forward tests. The proposal that created *this* entry came from a different direction
entirely — the `uk-electricity-vat-reversion-2027-04-01` lane, which noticed a **sequencing** property
and explicitly declined to register any rate view.

So the question is: **at D-232, with a proposal that carries a sequencing argument and no rate view,
what can this ledger actually establish — and what must it refuse to establish?**

**One-line verdict:** the strip **does not reach 2027**, so the family's whole method is unavailable
here and no rate call is made; what this session can establish instead is **when an MPR's forecast is
locked**, which turns out to place the April 2027 projections **before the Fed's decision** and, on
the exact April analogue, **on the day of** the last UK CPI print.

**Method:** sourced web research per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md). Fetched
direct 2026-09-09: the **BoE MPC announcement-dates page** (2026 confirmed + 2027 provisional); the
**Bank's own 18 December 2025 news release** announcing the 2027 dates — a second independent BoE
surface the proposal did not have; the **April 2026 Monetary Policy Report** page and the **July 2026**
one, for their stated conditioning cut-offs; **centralbank.watch's** BoE page (data as-of
**2026-09-08**); the **ONS** release pages for the **March 2027** and **April 2027** CPI bulletins; the
**ONS March 2026 CPI bulletin**, for the April-analogue print date; **gov.uk** statistics announcements
filtered to labour-market overview; **Ofgem's** energy-price-cap page; and Yahoo `^VIX` (**16.19**
close 2026-09-09; prior close **15.72**). Survey, minutes and MPR-projection evidence is **inherited
from the sibling lanes' fetched primaries** and cited as such rather than re-fetched. Two fetches
failed and are recorded in `probe-ref.blocked`; see *Honest limits*. No price instruments run:
`symbols: []`, no issuer, and `earnings-cycle.mjs` / `intraday-edges.mjs` have no macro mode.

### Conviction legs, tested

1. **The rate strip this family is built on does not extend to 2027, and that is the first thing this
   ledger has to say.** SUPPORTED, and it is a negative result deliberately placed first.
   centralbank.watch's Bank of England page, fetched today (data as-of **2026-09-08**), publishes
   exactly three meeting rows — **2026-09-17** (6.9% higher / 3.77% implied), **2026-11-05** (54.2% /
   3.89%) and **2026-12-17** (94.6% / 4.11%) — and nothing beyond. There is **no February, March or
   April 2027 row**. The consequence is precise rather than rhetorical: the December ledger's entire
   contribution was an identity (`implied = 3.75 + 0.25 × E[hikes]`) applied to a published cumulative
   probability, and **there is no published cumulative probability here to apply it to**. Every number
   in that decomposition — 5.4 / 45.2 / 49.4 — describes December 2026 and says nothing about April
   2027. This ledger therefore **registers no directional Bank Rate test**. Inventing one from the
   December distribution extrapolated forward would be exactly the aggregator error this calendar's
   seeding was built to avoid, one step worse: not a wrong source, but no source at all.

2. **An MPR's projections are locked 8–10 days before the Report publishes, and the family had never
   established that.** SUPPORTED, from two BoE primaries fetched today, and this is the session's
   transferable output. The [`boe-decision-2026-11-05`](boe-decision-2026-11-05.md) ledger already
   tells later sessions to read *"the conditioning market path"* the forecast was run on — good
   advice — but nobody had asked **when that path stops moving**. It stops at a stated cut-off, and the
   Bank names it in the Report:

   | Report | Published | Conditioning cut-off (Bank's own words) | Gap |
   |---|---|---|---|
   | April 2026 MPR | 30 April 2026 | *"the 15 days to 22 April"* | 8 days |
   | July 2026 MPR | 30 July 2026 | *"the 15 working days to 20 July"* | 10 days |

   Two points is a thin sample and is named as such in *Honest limits* — but both are **BoE primaries**,
   both are **2026**, and one is the **exact April analogue** of this meeting. Applied to **2027-04-29**,
   the cut-off band is **2027-04-19 to 2027-04-21**. The claim registered as
   **FT-boe-decision-2027-04-29-1** is deliberately written a shade wider than the measured band
   (2027-04-16 to 2027-04-23) so that a pass is genuinely informative about the convention rather than
   about two data points.

3. **Therefore the April 2027 forecast is conditioned on a curve struck before the Fed decides.**
   SUPPORTED, arithmetic on leg 2, and it is the consequence that actually matters for reading the
   document. [`fomc-2027-04-28`](fomc-2027-04-28.md) is **the day before** this meeting; the
   conditioning cut-off is **7 to 10 days before that**. So on 2027-04-29 the Bank publishes a
   projection whose market path cannot contain the Fed's decision, the BoJ's Outlook Report, or
   whatever the eight days between the cut-off and the announcement did to the curve. **The committee**
   sees all of it — it votes on the day. **The published forecast** does not. The practical rule is
   modest and worth stating anyway, because it is the kind of thing that gets read wrong at 07:00 ET:
   a gap between the April 2027 projections and the then-current curve is a **dating artefact first**,
   and evidence about the Bank's view only after the cut-off has been read off the Report itself.

4. **On the exact April analogue, the conditioning cut-off fell on the day of the March CPI print — and
   the 2027 dates line up the same way.** SUPPORTED, and this is the leg that connects the mechanic to
   the calendar. The April 2026 MPR names *"the 15 days to 22 April"*; the ONS bulletin *Consumer price
   inflation, UK: March 2026* was **released 22 April 2026** (fetched today; headline **3.3%**, services
   **4.5%**). Same date. For 2027, ONS's release page for *"Consumer price inflation, UK: March 2027"*
   reads **"Provisional release date: 21 April 2027 7:00am"** and **"This release is not yet
   published"** — which sits inside the 2027-04-19/21 band and, on the 8-day April gap, **on** it. So the
   last UK inflation datum before this meeting is either inside the published forecast's market path by
   a single session or just outside it, and **the Report will say which**. That print is **proposed to
   the calendar in this PR** as `uk-cpi-2027-04-21`; nobody had it, and the `uk-cpi` series on this
   calendar currently runs only to a proposed 2027-05-19.

5. **The proposing lane's sequencing argument is verified, and the "seven weeks" is exactly 49 days.**
   SUPPORTED, every date now from a fetched primary rather than from the proposal's assertion. SI
   2026/987 has effect *"for supplies made in the period beginning with 1st October 2026 and ending
   with 31st March 2027"* (legislation.gov.uk, fetched by the
   [`uk-electricity-vat-reversion-2027-04-01`](uk-electricity-vat-reversion-2027-04-01.md) lane
   2026-09-09). ONS collects prices around the Tuesday nearest the 13th, so the chain is:

   | Date | Event | What it does *not* have |
   |---|---|---|
   | 2027-03-18 | MPC decision, **no MPR** | the reversion has not happened |
   | 2027-04-01 | electricity VAT 0% → 5% | — |
   | 2027-04-21 | UK CPI, **March** data (ONS, fetched) | a post-reversion collection month |
   | **2027-04-29** | **this meeting — MPR must book the step** | **any observation of it** |
   | 2027-05-19 | UK CPI, **April** data (ONS, fetched) | — (the first observation) |
   | 2027-06-17 | MPC decision, no MPR | — (first committee to see it) |

   **2027-04-29 → 2027-06-17 is 49 days.** The proposal said "seven weeks"; it is seven weeks to the
   day. The inference the proposing lane drew — and this lane keeps it as **a look-through argument,
   not a rate call** — is that a self-reversing tax notch whose forecast round and first observation
   never coincide is precisely what a committee looks through. The resolution venue, **2027-06-17**, is
   **proposed to the calendar in this PR**: it is the first set of minutes that *can* discuss the
   observed step, and it carries no MPR to bury it in.

6. **The size of the step is a range, not a number, and the range is not drawn until February 2027.**
   SUPPORTED, inherited arithmetic, restated because a later session reading this ledger alone would
   otherwise carry a false precision. The reversion raises a now-VAT-free price by **5/100 = 5.0%**,
   not the 4.7619% (5/105) the cut removed; what makes the two nearly cancel is a weighting convention
   — ONS price-updates CPI weights to December of the prior year and January of the current year, both
   of which sit **inside** the zero-rate window, so the 2027 electricity weight comes in ≈1/1.05 of its
   counterfactual and `(1/1.05) × (5/100) = 5/105` exactly. What does **not** cancel is the weight
   vintage: CJXA has moved **27.0 → 23.31 → 19.15 → 20.61** per 1000 across 2023–2026, which maps the
   April step to **≈0.091–0.129pp**. The 2027 weight is undrawn until the January print on
   **2027-02-17**. All of this is the
   [`uk-electricity-vat-reversion-2027-04-01`](uk-electricity-vat-reversion-2027-04-01.md) lane's work,
   fetched and reproduced there, **inherited here and not re-derived**.

7. **The Bank's own most recent published forecast already assumes rates are materially higher by
   around this meeting, while its modal CPI undershoots.** SUPPORTED on the numbers, **inherited** and
   flagged as such. Per [`boe-decision-2026-11-05`](boe-decision-2026-11-05.md)'s fetched record, the
   **July 2026** MPR's conditioning path factored in *"a high chance of two rate hikes by Q3 2027 as
   priced by financial markets"*, and on that path the modal CPI projection is **1.7% at Q1 2028**
   (two years) and **1.9% at Q3 2029** (three) — below target at both. **2027-04-29 sits inside that
   assumed hiking window.** An MPR projection is a conditional forecast, so a central path below 2% on
   a curve that tightens is the Committee saying, in its own arithmetic, that delivering the priced
   path over-tightens. The testable consequence for *this* round is narrow and registered as
   **FT-boe-decision-2027-04-29-3**: the April 2027 modal CPI at the two-year horizon comes in **below
   2.0%** again. It is graded **low** — it is a call on a forecast eight months out, made from an
   inherited reading of the round before last, and it drives no size because nothing here drives size.

8. **Attribution inverts the December ledger's rule, and the inversion is about content, not price.**
   SUPPORTED, mechanical. Seven tracked events sit within five days of 2027-04-29:
   [`consumer-confidence-2027-04-27`](consumer-confidence-2027-04-27.md),
   [`fhfa-hpi-2027-04-27`](fhfa-hpi-2027-04-27.md),
   [`boj-decision-2027-04-28`](boj-decision-2027-04-28.md),
   [`fomc-2027-04-28`](fomc-2027-04-28.md) (**high**),
   [`russell-style-month-end-capping-effective-2027-04-30`](russell-style-month-end-capping-effective-2027-04-30.md),
   [`tic-annual-survey-final-2027-04-30`](tic-annual-survey-final-2027-04-30.md) and
   [`treasury-borrowing-estimates-2027-05-03`](treasury-borrowing-estimates-2027-05-03.md). Three
   central banks land inside about 36 hours — BoJ and Fed on **04-28**, BoE at **12:00 London / 07:00
   ET on 04-29** — and the BoE is **last**. December's ledger wrote the rule *"a projection round
   outranks a set of minutes"* and used it to rank the ECB above the BoE. Applied here it points the
   other way: the BoJ publishes an **Outlook Report** and the BoE a **Monetary Policy Report**, but
   the Fed's 2027-04-28 row on its own calendar carries **no SEP asterisk** (`fomc-2027-04-28`'s
   header, fetched 2026-09-05), so of the three, the **BoE is the one arriving with a full forecast
   round and the Fed is the one without**. That inverts the *interpretive* ranking and **only** that:
   for price impact on eight US mega-caps the Fed's decision outranks a UK forecast round and nothing
   in this ledger disturbs that. The practical rule for the morning of 04-29 is that any global-rates
   move at 07:00 ET is running **17 hours after the Fed** and into **month-end** on 04-30 — the BoE has
   to be argued for, not assumed.

9. **The tier the proposal set is wrong on this calendar's own precedent, and this session changes
   it.** SUPPORTED, and stated plainly because writing the canonical file is the moment to fix it. The
   proposal tiered this **low**, reasoning from `symbols: []` and the absence of any UK instrument in
   the book. That reasoning is correct and it is also the reason the *call* is a stand-aside at **high**
   confidence — but it applies **identically** to `boe-decision-2026-09-17`, `boe-decision-2026-11-05`
   and `boe-decision-2026-12-17`, all tiered **medium**, and to `boj-decision-2027-04-28`, also
   **medium**. Tiering the same class of event two ways buys no safety and makes the cadence
   incoherent: at `low` this event is screened every 30 days, at `medium` every 21 until D-31. The
   canonical file written in this PR is **medium**. The no-instrument fact belongs in the call sheet,
   where it already is, not in the tier.

10. **The date is provisional in a way the 2026 siblings' dates are not, and the `estimate` label here
    is load-bearing.** SUPPORTED, from both BoE surfaces. The three sibling ledgers carry `estimate`
    almost entirely as a taxonomy artefact — the Bank's 2026 dates are firm and one sibling even
    upgraded its clock to the Bank's own words off a live minutes page. Here both surfaces head the
    2027 list **"Provisional dates"**, and the Bank's announcement of them is itself titled
    *"Provisional dates for Monetary Policy Committee (MPC) announcements…"*. They have stood
    unchanged since **18 December 2025**, which is evidence they are stable, not evidence they are
    confirmed. So the honesty rule bites harder here than on the siblings: **estimates widen caution
    and license nothing**, and a session keying anything to 2027-04-29 must re-read the Bank's calendar
    first. Registered as **FT-boe-decision-2027-04-29-2**.

11. **The April 2027 UK labour-market date does not exist yet, and is deliberately not proposed.**
    SUPPORTED by a negative result, stated rather than filled in. gov.uk's statistics-announcement
    search for *labour market overview*, fetched today, returns **no 2027 announcements at all** — its
    upcoming list runs only to October 2026. The `uk-labour-market` series on this calendar likewise
    ends at a proposed **2027-01-19**. gov.uk announces roughly a quarter ahead, so an April 2027 slot
    is simply not published on 2026-09-09. **No date, no proposal** — inventing "the usual mid-month
    Tuesday" is the aggregator error this calendar exists to avoid, and the December sibling set the
    precedent by refusing the same guess.

12. **No tracked symbol carries a sterling channel, and no play is proposed.** SUPPORTED, stated as a
    null claim rather than a hedge. `symbols: []`. The house playbooks (S1/S2/E1/S3/S4 + G1,
    [`trade-playbooks.md`](../../plans/trade-playbooks.md)) are equity- and earnings-keyed; none is
    rates-keyed, let alone sterling-rates-keyed. The only channel that exists is **global term
    premium**, second-order, and the only transmission this repo has ever *measured* is the
    gilt-to-Treasury pipe quantified in `uk-autumn-budget-2026-10-28`, which opens on roughly the worst
    1% of gilt days. The "Today" kill switch is therefore written as a **measurable price test** rather
    than a restatement of the claim — a null claim's failure mode is that a channel exists and is
    simply not instrumented here.

### What plays the conditions support (date estimate)

**None.** No entry, exit, hedge or size is keyed to 2027-04-29. Four rules:

- **Read-only, and read the Report before the rate.** The document set is the Monetary Policy Report,
  the Summary and minutes, the vote, and a press conference. Of the three central banks in this
  cluster, this is the one with published arithmetic.
- **Search order when it lands** — (1) the **stated conditioning cut-off date**, which is this
  session's own test and determines how everything else should be read; (2) the **modal CPI at the
  two-year horizon** against July 2026's 1.7%; (3) whether the **VAT reversion** appears in the
  near-term profile as a mechanical step the Committee explicitly looks through, or as something it
  treats as signal; (4) the **vote split** against whatever the meetings between now and then produce,
  never against July 2026's 6–3, which four meetings will have re-based.
- **The anti-attribution rule.** Any read of the 04-29 tape that has not first accounted for
  **`fomc-2027-04-28` 17 hours earlier**, **`boj-decision-2027-04-28`** and **month-end on 04-30** is
  not entitled to its attribution. Leg 8 is the whole of it.
- **The branch to pre-decide** — if a 2027 rate strip becomes fetchable before this meeting, this
  ledger gains the method it currently lacks and **should register a rate-direction test at that
  pulse**, saying so in the row. Until then the refusal is the position, not a gap to be papered over.

### Honest limits

**The conditioning-window mechanic rests on two observations, and that is the largest weakness here.**
Legs 2, 3 and 4 — this session's whole contribution — generalise from **two** BoE Reports (April 2026,
8 days; July 2026, 10 days). Both are primaries and one is the exact April analogue, but two points
are a convention only by assumption; the November 2025 and May 2025 cut-offs surfaced in search
(*"the 15 days to 28 October"* for a 6 November Report; *"the 15 working days to 29 April"* for an 8
May Report) are consistent at 9 days each but were **not fetched from the Bank** and are therefore not
used as evidence. **FT-boe-decision-2027-04-29-1** is written to score exactly this, and a pulse that
fetches two more Reports would settle it years before the event.

Four further limits. **Nothing in this ledger prices the meeting**, by construction (leg 1) — a reader
wanting a rate view will not find one, and that is the honest state of the sources, not an omission.
**Survey, minutes and MPR-projection evidence is inherited**, not re-fetched: the July 2026 "two rate
hikes by Q3 2027" phrase and the 1.7%/1.9% modal path come from the November sibling's fetch, and
leg 6's VAT arithmetic comes wholly from the reversion lane — a chain of inheritance two lanes deep in
places, and **FT-boe-decision-2027-04-29-3** rests on it. **Ofgem's price-cap page returned no
announcement dates** (fetched 2026-09-09, HTTP 200: *"We set the price cap level every 3 months"* and
nothing more), so the April–June 2027 cap — the mechanism by which the reversion actually reaches
bills — is **not proposed**; the reversion lane hit 404s on the same publisher's cap pages. That is a
known gap, not a closed question. Finally, **two fetches failed** and are in `probe-ref.blocked`: the
ONS release-calendar filtered to April–May 2027 returned August-2026 results instead of the requested
window, and a speculative previous-releases URL 404'd — neither mattered in the end, because both CPI
dates were obtained from the ONS's own per-release pages, which is the better source anyway.

## Stance & kill switches

**Stance (date `estimate`, and provisional in the Bank's own words):** **stand aside completely, make
no rate call, and bank the mechanic.** This book holds nothing with a sterling-rates channel and none
is proposed; the ledger's positions are **analytical**, and the first of them is a **refusal**. The
family's three sibling BoE ledgers all reason from centralbank.watch's rate strip; that strip
publishes no 2027 rows, so the decomposition method that produced the December ledger's entire
contribution **cannot be run here**, and this ledger registers **no directional Bank Rate test** rather
than extrapolating one. What it does register is the mechanic the family was missing: an MPR's
projections are conditioned on the market path over the **15 working days to a stated cut-off**, and
that cut-off runs **8–10 days before publication** (April 2026 Report: *"the 15 days to 22 April"*,
published 30 April; July 2026 Report: *"the 15 working days to 20 July"*, published 30 July). For
2027-04-29 that puts the cut-off at **~2027-04-19 to 2027-04-21**, from which two things follow that
later sessions must carry: **the published April 2027 forecast is conditioned on a curve struck before
`fomc-2027-04-28`**, so a gap between those projections and the then-current curve is a **dating
artefact first**; and the **March 2027 CPI print (2027-04-21, ONS, fetched)** is either inside that
window by one session or just outside it — on the April-2026 analogue the print date **was** the
cut-off date. Third, it verifies and keeps the proposing lane's **sequencing** finding — MPR
2027-04-29 forecasts the VAT reversion with **no observation of it**, the first observation lands
2027-05-19, the first committee to see it sits **49 days later on 2027-06-17** — and keeps it, as that
lane did, as a **look-through argument and not a rate view**. Fourth, it commits the calendar to an
attribution rule that **inverts December's**: the BoE is the last of three central banks in ~36 hours
and the only one of the three publishing a full forecast round (the Fed's 04-28 row carries no SEP),
so it outranks the Fed for **interpretive content** on this cluster and **not** for price. Fifth, this
session **raised the tier from the proposal's `low` to `medium`**, matching every other BoE MPC
decision on this calendar. The quarter call is **medium**, not high, for one stated reason: the
conditioning-window regularity rests on **two** fetched Reports. Estimates widen caution and license
nothing — and here the label is load-bearing, because the Bank calls its own 2027 dates provisional.

**Kill switches:**

- **Channel kill (the one that would rebuild this doc):** a tracked name (AAPL/AMZN/AVGO/CRWV/GOOG/
  META/MRVL/MSFT) moving **>2%** in the **07:00–09:30 ET** window on **2027-04-29** in a way the tape
  attributes to the BoE. Leg 12's "no price channel" claim would be false. Score by **2027-04-30**.
- **Mechanic kill (registered):** the **2027-04-29 Monetary Policy Report** naming a conditioning
  cut-off **outside 2027-04-16 to 2027-04-23**. The 8–10 day regularity is not a convention and legs
  2–4 are re-derived from scratch. Registered as **FT-boe-decision-2027-04-29-1**, score by
  **2027-04-30**. Also **falsifiable early and cheaply**: two more fetched Reports settle it at any
  pulse.
- **Date / payload kill (registered):** the Bank re-publishing its 2027 schedule with **29 April moved,
  or without a Monetary Policy Report beside it**. The header and the entire forecast-round framing
  break together, and the `estimate` label will have earned its keep. Registered as
  **FT-boe-decision-2027-04-29-2**, score by **2027-04-30**; re-check the calendar every pulse.
- **Forecast-profile kill (registered):** the **April 2027 MPR's modal CPI at the two-year horizon at
  2.0% or above**. The July 2026 round's "the priced path over-tightens" message would have reversed
  across four meetings, and leg 7's inherited reading stops describing the Bank's arithmetic.
  Registered as **FT-boe-decision-2027-04-29-3**, score by **2027-04-30**.
- **Method-availability branch (not a kill, a scope change):** a **fetchable 2027 BoE rate strip** —
  centralbank.watch extending its table, or a second curve source. Leg 1's refusal expires and this
  ledger **should** register a rate-direction test at that pulse rather than continuing to stand mute.
  Record it as a scope change in the row, not as a stance reversal. Re-check every pulse.
- **Sequencing kill (not registered; it fires on another lane's event):** a **fresh statutory
  instrument extending the electricity zero rate beyond 2027-03-31**, or the **2026-10-28 Budget**
  doing so. The 04-01 reversion stops existing, legs 5 and 6 stop describing anything, and this meeting
  reverts to an ordinary MPR round. That is the reversion lane's own
  **FT-uk-electricity-vat-reversion-2027-04-01-1** and is deliberately **not** re-registered here —
  reading a sibling's result is not owning it. Re-check at the first pulse after **2026-10-28**.
- **Weight-vintage kill (inherited, not registered):** the **2027-02-17** CPI print showing an
  electricity weight **outside 19–27 per 1000**. The ≈0.091–0.129pp bound in leg 6 is wrong. That is
  the reversion lane's kill switch; carry it, do not re-register it.
- **Attribution kill:** the **2027-04-28 FOMC** turning out to carry a Summary of Economic Projections
  after all (the Fed's calendar states each meeting is tentative until confirmed at the preceding one,
  per `fomc-2027-04-28`'s header). Leg 8's inversion — "the BoE is the only one of the three with a
  forecast round" — would be false and the interpretive ranking reverts to December's. Re-check every
  pulse after the **2027-03-16/17** FOMC.

Three forward tests registered in
[`forward-tests/boe-decision-2027-04-29.md`](../forward-tests/boe-decision-2027-04-29.md) — **-1** (the
conditioning cut-off lands in 2027-04-16…04-23), **-2** (the date and the MPR both survive to the
meeting) and **-3** (the April 2027 modal CPI still undershoots at two years). **No rate-direction test
is registered, deliberately** — there is no published 2027 pricing to take a side against, and no
house instrument that would price one.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-09 | D-232 | Initial research banked (above), on an id that existed only as `proposals/boe-decision-2027-04-29.from-uk-electricity-vat-reversion-2027-04-01.json` — read in full first, its sequencing finding **verified against fetched ONS primaries** and carried into the canonical `src/domain/market-events/boe-decision-2027-04-29.json` written in this PR. **Headline finding is a refusal plus a mechanic.** (i) **The strip does not reach 2027.** centralbank.watch's BoE page (fetched, as-of 2026-09-08) publishes rows only through **2026-12-17**; there is no 2027 row, so the December ledger's decomposition identity has **nothing to apply**. This ledger registers **no directional Bank Rate test** rather than extrapolating one. (ii) **An MPR's conditioning window closes 8–10 days before publication** — two BoE primaries fetched today: **April 2026** MPR, published **30 April 2026**, *"the 15 days to 22 April"* (**8d**); **July 2026** MPR, published **30 July 2026**, *"the 15 working days to 20 July"* (**10d**). For **2027-04-29** that is a cut-off of **~2027-04-19 to 2027-04-21**, with two consequences nobody had written down: the published forecast's market path is **struck before `fomc-2027-04-28`** (so a gap vs the then-current curve is a **dating artefact first**), and it lands **on or within two days of the March 2027 CPI print** — on the exact April analogue it fell **on** it, since the **March 2026** CPI bulletin was released **22 April 2026**, the very cut-off the April 2026 Report names. The November sibling told sessions to read *"the conditioning path"*; none had established **when it closes**. (iii) **Sequencing verified, "seven weeks" is 49 days to the day:** MPC **03-18** (no MPR) → reversion **04-01** (SI 2026/987 lapses 31 Mar) → **UK CPI March data 2027-04-21** (ONS release page fetched, *"Provisional release date: 21 April 2027 7:00am"*, *"not yet published"* — still a zero-rated collection month) → **this MPR, booking the step blind** → **UK CPI April data 2027-05-19** (ONS, fetched, first observation) → **MPC 2027-06-17**, first committee to see it. Kept as a **look-through argument, not a rate call**, exactly as the proposing lane framed it. (iv) **Two corrections to the proposal.** Tier raised **`low` → `medium`**: the "no instrument" reasoning is right but applies identically to the three 2026 BoE entries and to `boj-decision-2027-04-28`, all **medium**; that fact belongs in the call (stand aside, **high**), not the tier. And a **second BoE primary** the proposal lacked — bankofengland.co.uk/news/2025/december/mpc-dates-for-2027, *"Published on 18 December 2025"* — corroborates the eight 2027 dates and the four MPR months, while confirming the Bank's own **"Provisional dates"** label, which is why `estimate` here is **load-bearing** rather than the taxonomy artefact it is on the siblings. Adjacency sweep: **peers** — none, `symbols: []`. **Macro** — the run-in is **one print, 8 days out**, `uk-cpi-2027-04-21` (**PROPOSED here**; unproposed by anyone, and the `uk-cpi` series otherwise jumps to a proposed 2027-05-19). The **April 2027 UK labour-market date is NOT proposed** — gov.uk statistics announcements, fetched, returns **no 2027 labour-market overview at all**; a negative result stated, never filled in. **Volatility** — VIX **16.19** close 2026-09-09 (Yahoo `^VIX`), prior close **15.72**; the 12-17 sibling carries 16.39 intraday the same day. **Geopolitical/policy** — the live vector is the reversion's own survival (the 10-28 Budget or a fresh SI could extend the zero rate); that is the reversion lane's FT-1 and is **not** re-registered here. **Event tape — attribution INVERTS December's rule.** Seven tracked events within five days: **`boj-decision-2027-04-28`** (Outlook Report) and **`fomc-2027-04-28`** (**high**) **the day before**, plus consumer-confidence 04-27, FHFA HPI 04-27, Russell style capping 04-30, TIC annual survey 04-30, Treasury borrowing estimates 05-03. Three central banks in **~36 hours**, BoE **last** at 12:00 London / 07:00 ET — and per `fomc-2027-04-28`'s own header the Fed's 04-28 row carries **no SEP asterisk**, so the **BoE is the only one of the three with a full forecast round**. December's *"a projection round outranks a set of minutes"* therefore ranks the **BoE above the Fed for interpretive content — and only that**; for price impact on eight US mega-caps the Fed still outranks it. **Two dated adjacencies PROPOSED** (`estimate`, own-owner files): **`uk-cpi-2027-04-21`** (the conditioning-cut-off print) and **`boe-decision-2027-06-17`** (the venue where the look-through question resolves). **Three forward tests registered, none directional on Bank Rate:** FT-1 (the Report's stated cut-off lands **2027-04-16…04-23**), FT-2 (the date and the MPR both survive), FT-3 (April 2027 modal CPI at two years **below 2.0%**, from the July 2026 round's 1.7% — inherited, graded **low**). **Named weakness, up front:** the conditioning mechanic rests on **two** fetched Reports; two consistent 2025 cut-offs surfaced in search were **not fetched** and are not used as evidence — **fetching two more Reports is the first pulse's highest-value task** and settles FT-1 years early. Survey/MPR-projection evidence is **inherited** from the November sibling and the VAT arithmetic wholly from the reversion lane — a chain two lanes deep in places. **Ofgem's cap page returned no announcement dates** (HTTP 200, *"We set the price cap level every 3 months"*), so the April–June 2027 cap is a **known gap, not proposed**. Two fetches failed and are in `blocked`; neither mattered, since both CPI dates came from ONS per-release pages. | — (stance set: stand aside, no position, no play; and one **refusal** — **no rate call and no directional Bank Rate test**, because no 2027 pricing exists to take a side against. Four analytical commitments: carry the **8–10 day MPR conditioning window** and its two consequences; carry the verified **49-day forecast-to-first-committee** sequencing as a **look-through** argument; rule the **BoE above the Fed for interpretive content but not for price** on the 04-28/04-29 cluster; and treat the **provisional** 2027 date as load-bearing) | 2026-09-30 (medium, 31+d band: every 21d — lands at D-211, still deep inside the same band; that pulse's task is to **fetch two more MPRs** and settle FT-1's cut-off convention, and to re-check whether any curve source has extended to 2027) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-boe-decision-2027-04-29.json` (`status: "estimate"`)
in the same PR — your own file, never another event's canonical one (#1717). Close-out fills
`## Outcome` below from re-run instrument data (cache busted first), never from memory — after
which this doc goes quiet.
