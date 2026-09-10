# Bank of England MPC decision + February Monetary Policy Report — the first forecast round of 2027, the next meeting after the strip's last priced row, and the same day as the ECB — boe-decision-2027-02-04

**Kind:** macro-print · **Date:** 2027-02-04 (estimate, EST: bankofengland.co.uk/monetary-policy/upcoming-mpc-dates, re-fetched direct 2026-09-10 — the page carries two panels, *"2026 confirmed dates"* and *"2027 provisional dates"*, and the 2027 panel opens with *"Thursday 4 February: February MPC Summary and minutes and February Monetary Policy Report"*. Filed estimate on two counts, and the first is real rather than taxonomic — the Bank labels its own 2027 dates **provisional** while labelling its 2026 dates **confirmed** on the same page — plus the standing gap that market-events-data.ts's confirmed-prefix taxonomy has `FED:` and no slot for a non-Fed central bank) · **Impact:** medium
**Last assessed:** 2026-09-10
<!-- probe-ref: {"symbols":{},"vix":17.84,"daysBand":"medium:31+","adjacentIds":["boj-summary-of-opinions-2027-02-01","eia-steo-2027-02-09","ism-manufacturing-2027-02-01","ism-services-2027-02-03","jobs-2027-02-05","sloos-2027-02-01","treasury-refunding-2027-02-03"],"screenStreak":0,"blocked":[{"url":"https://www.bankofengland.co.uk/-/media/boe/files/monetary-policy-report/2026/february/monetary-policy-report-february-2026.pdf","status":"TEXT_NOT_EXTRACTABLE","at":"2026-09-10"},{"url":"https://www.bankofengland.co.uk/monetary-policy-report/2026/february-2026/monetary-policy-report-february-2026","status":"404","at":"2026-09-10"},{"url":"https://www.bankofengland.co.uk/news/2025/november/monetary-policy-report-november-2025","status":"404","at":"2026-09-10"},{"url":"https://www.ecb.europa.eu/press/press_conference/monetary-policy-statement/2026/html/index.en.html","status":"404","at":"2026-09-10"}]} -->

## At a glance

**TL;DR.** **Nothing here is ours to trade** — `symbols: []`, no UK listing, no rates- or sterling-keyed
playbook — so every call below is a refusal or a watch. What this session establishes instead is three
things the family did not have. **First, the pricing refusal is narrower than the sibling ledger
thought.** [`boe-decision-2027-04-29`](boe-decision-2027-04-29.md) found centralbank.watch's BoE strip
stops at **2026-12-17** and therefore registered no rate call; that is still true today (re-fetched
2026-09-10, data as-of 2026-09-09) and this ledger makes **no call on what the February 2027 meeting
does** either. But the BoE calendar has **no meeting at all between 2026-12-17 and 2027-02-04** — a
**49-day gap, the longest on its schedule** — so the strip's **last row is the meeting immediately
before this one**: **98.9% priced higher, implied 4.15%** against a Bank Rate of **3.75%**, i.e.
**E[hikes] ≈ 1.60** by the time this committee sits. **2027-02-04 is the only 2027 BoE meeting whose
*entry level* the published strip actually prices.** "No pricing exists" is true of the **decision**
and false of the **level**. **Second, the dissent is not a stable minority.** Six BoE minutes pages
fetched today give a clean series — **2025-11-06 5–4** (four for a **cut**) · **2026-02-05 5–4** (four
for a **cut**) · **2026-03-19 9–0** · **2026-04-30 8–1** (one for a **hike**) · **2026-06-18 7–2** ·
**2026-07-30 6–3** — that is **+1 hawkish dissenter per meeting for three consecutive meetings** since
the March 9–0 pivot. [`boe-decision-2026-11-05`](boe-decision-2026-11-05.md) calls it *"a stable
minority"*; the primaries say it is a march, and naive continuation puts the majority on the hike side
at **2026-11-05/2026-12-17** — exactly where the strip already puts it. **Third, the ECB decides the
same day, 75 minutes later, with no projections** (ECB calendar and projections page, both fetched
today: *"3-4 February 2027"*, Frankfurt; projections *"four times a year (in March, June, September and
December)"*). So the **BoE is the only full forecast round on the day**, inverting December's
*"check the ECB before crediting the BoE"* rule. `ecb-decision-2027-02-04` is **proposed in this PR** —
this calendar carried no 2027 ECB entry at all. Date is **estimate**, and the label is load-bearing:
the Bank's own 2027 dates are **provisional**.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — nothing here is ours to hold, and nothing will be at D-147 | High | `symbols: []`, no rates-keyed playbook, and this calendar's tracked universe is AAPL/AMZN/AVGO/CRWV/GOOG/META/MRVL/MSFT — no UK listing, no gilt, no sterling leg | A tracked name moving **>2%** in the **07:00–09:30 ET** window on **2027-02-04** attributable to the BoE — the "no price channel" premise is false and this doc is rebuilt |
| This week | **Record the VIX regime move as a fact about the tape, not a view about this meeting** | High | Yahoo `^VIX` closes, fetched 2026-09-10: **14.53 (09-04) → 15.30 → 15.72 → 16.46 → 17.84 (09-10)**. That is **+3.31 points in five sessions**, past the **≥3-point** threshold this calendar's own deterministic screen calls material. The sibling [`boe-decision-2027-04-29`](boe-decision-2027-04-29.md) baselined **16.19** yesterday; a session quoting a mid-16s VIX on this family after today is quoting a stale number | VIX closing back **below 15.0** before the first pulse (**2026-10-01**) — the move was a two-day blip and the baseline reverts. Recorded either way; **nothing is keyed to it**, since no position exists |
| This month | **Watch the 2026-09-17 BoE vote — it is the cheap, seven-day falsifier for everything this ledger's Bank-Rate-level view rests on** | Medium | The dissent series is **+1 hawkish member per meeting, three meetings running** (8–1 → 7–2 → 6–3, from a 9–0 pivot in March). Naive continuation says **four** for an increase on 09-17. If it lands, the march and the strip's 98.9%-by-December agree and the ≥4.00% entry level is well founded; if it does not, the march was three coincidences | The **2026-09-17** minutes showing **fewer than four** members voting for an increase (**FT-boe-decision-2027-02-04-3**'s early kill). That is also [`boe-decision-2026-09-17`](boe-decision-2026-09-17.md)'s own registered kill switch — **read there, not re-registered here** |
| This quarter | **Carry the entry-level finding and the February conditioning geometry — they are the transferable outputs, and both are testable on this meeting's own document** | Medium | Two measured things. (i) The strip's terminal row **is** the preceding meeting, so this meeting's **entry rate** is priced (**implied 4.15%**, 98.9% higher) even though the meeting itself is not — unique among 2027 BoE rounds. (ii) An MPR's conditioning window closes **8–10 days** before publication (four Reports, table in leg 3), so for **2027-02-04** the cut-off is **2027-01-25 to 2027-01-27** — which **closes inside the 2027-01-26/27 FOMC** and leaves the run-in prints **3–5 UK working days inside** the window, the opposite of April's edge case | The **2027-02-04 Monetary Policy Report** naming a conditioning cut-off **outside 2027-01-22 to 2027-01-29** (**FT-boe-decision-2027-02-04-1**) — the 8–10 day regularity is not a convention and the geometry is re-derived from scratch. Or **Bank Rate below 4.00%** at that announcement (**FT-boe-decision-2027-02-04-2**) — the strip's 98.9% and the vote march were both wrong about the level |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit, hedge or size is keyed to 07:00 ET on 2027-02-04. A `medium`-tiered `estimate` event on a foreign central bank with `symbols: []` licenses nothing.
- **The refusal, stated precisely.** There is **no published pricing for the 2027-02-04 decision** (centralbank.watch's BoE page, fetched 2026-09-10, publishes rows only through 2026-12-17). **No test on what this meeting does is registered.**
- **The thing that IS priced — the entry level.** No BoE meeting falls between **2026-12-17** and this one (**49 days**), so the strip's last row prices the rate this committee **starts from**: **98.9% higher, implied 4.15%** vs **3.75%** today → **E[hikes] ≈ 1.60**. Registered as **FT-boe-decision-2027-02-04-2** (Bank Rate **≥ 4.00%** at the announcement).
- **The dissent march, from six fetched primaries.** −4, −4, 0, **+1, +2, +3** (Nov-25 · Feb-26 · Mar-26 · Apr-26 · Jun-26 · Jul-26). This **corrects** [`boe-decision-2026-11-05`](boe-decision-2026-11-05.md)'s *"stable minority"*. Cheapest falsifier is **seven days away**: the 2026-09-17 vote.
- **The February conditioning window — and it is the *inverse* of April's.** Cut-off **~2027-01-25 to 2027-01-27**; the 15 UK working days back put the window's start at **~2027-01-05 to 2027-01-07**. So [`uk-labour-market-2027-01-19`](uk-labour-market-2027-01-19.md) and [`uk-cpi-2027-01-20`](uk-cpi-2027-01-20.md) land **3–5 UK working days inside** it, with room to be absorbed. April's round has its CPI print **on the closing edge**. Verified on the exact analogue: Dec-2025 CPI released **21 January 2026** (ONS, fetched), Feb-2026 cut-off **26 January 2026** — three UK working days inside.
- **Consequence: the cut-off closes inside the January FOMC.** [`fomc-2027-01-27`](fomc-2027-01-27.md) meets **26–27 January** and carries **no SEP** (Fed calendar, fetched: 2027 asterisks are Mar 16-17, Jun 8-9, Sep 14-15, Dec 7-8). On the 2026 analogue the cut-off (26 Jan) fell **one day before** the FOMC convened (27–28 Jan). So the published forecast's market path may or may not contain the Fed's January decision — **read the Report's stated cut-off before calling any gap a forecast error**.
- **Attribution on the day, and it inverts December's rule — this time against the ECB.** [`ecb-decision-2027-02-04`](../../../src/domain/market-events/proposals/ecb-decision-2027-02-04.from-boe-decision-2027-02-04.json) is **proposed in this PR**: same day, **08:15 ET vs the BoE's 07:00 ET**, and **no ECB projections in February** (ECB, fetched: *"four times a year (in March, June, September and December)"*). December's rule was *check the ECB first, it has projections and the BoE has only minutes*; here the **BoE is the only forecast round on the day**.
- **What lands next — the US calendar owns the tape either side.** [`ism-services-2027-02-03`](ism-services-2027-02-03.md) and [`treasury-refunding-2027-02-03`](treasury-refunding-2027-02-03.md) the day before, [`jobs-2027-02-05`](jobs-2027-02-05.md) (**high**) **08:30 ET the next morning, ~25.5 hours later**. Any 02-04 tape read that has not accounted for payrolls-eve positioning is not entitled to its attribution.
- **The standing wage-anchor gap is still open, and this is the second venue that can close it.** The July 2026 MPR publishes a private-sector AWE path of **2.8% in 2026 Q2** and **~3.0% in Q3** and then stops; no 2026 Q4 path is published anywhere findable (the `uk-labour-market-2027-01-19` lane's finding, re-checked in-family). The **2026-11-05** Report is the near anchor; **this one is the next**.
- **Watch (dated)** — **BoE 2026-09-17** (est; the vote-march falsifier, seven days out) · **UK Budget 2026-10-28** · **BoE MPR 2026-11-05** (est; the near wage anchor, and the vote march's first majority test) · **BoE 2026-12-17** (est; the strip's last priced row, and the meeting this one inherits its rate from) · **UK labour market 2027-01-19** (est) · **UK CPI 2027-01-20** (est; the last CPI inside the conditioning window) · **FOMC 2027-01-27** (est, no SEP; the cut-off closes inside it) · **ECB 2027-02-04** (est, proposed here) · **this meeting 2027-02-04** (est) · **US payrolls 2027-02-05** · **UK labour market 2027-02-16** (est) · **UK CPI 2027-02-17** (est; where the 2027 electricity weight is drawn).

## Initial research

### The question, plainly

This id existed only as **two competing proposals** — one from the
[`uk-cpi-2027-01-20`](uk-cpi-2027-01-20.md) lane, one from the
[`uk-labour-market-2027-01-19`](uk-labour-market-2027-01-19.md) lane — each arguing the meeting earns a
slot because it is the venue their own print feeds. Both are right, and both stop there. Meanwhile the
most recent sibling, [`boe-decision-2027-04-29`](boe-decision-2027-04-29.md), banked a **refusal**
(no rate call, because no 2027 pricing exists) plus a **mechanic** (an MPR's conditioning window closes
8–10 days before publication, from two Reports) and named its own first-pulse task: *"fetching two more
Reports is the first pulse's highest-value task"*.

So the question is: **at D-147, does the sibling's refusal apply here unchanged — and can this session
discharge the task it left?**

**One-line verdict:** the refusal is **narrower than it looked** — this is the one 2027 meeting whose
**entry level** the strip prices, because no meeting falls between it and the strip's last row — and the
Reports task is discharged: **four cut-offs now, all 8–10 days**, which fixes this meeting's window at
**2027-01-25 to 2027-01-27** and makes February's geometry the **inverse** of April's.

**Method:** sourced web research per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md). Fetched
direct **2026-09-10**: the **BoE MPC announcement-dates page**; **six BoE Monetary Policy Summary and
minutes pages** (November 2025, February, March, April, June and July 2026); the **November 2025** and
**April 2026 Monetary Policy Report** pages, for their stated conditioning cut-offs; **centralbank.watch's**
BoE page (data as-of **2026-09-09**); the **ONS** *Consumer price inflation, UK: December 2025* bulletin,
for the February analogue; the **Federal Reserve's FOMC calendars** page, for the 2026 and 2027 meeting
dates and SEP asterisks; the **ECB's Governing Council monetary-policy meeting calendar** and its
**projections** page; and Yahoo `^VIX` (**17.84** close 2026-09-10). The **July 2026** cut-off and the
July MPR's projection figures are **inherited** from the sibling lanes' fetched primaries and cited as
such. Four fetches failed and are recorded in `probe-ref.blocked`; see *Honest limits*. No price
instruments run: `symbols: []`, no issuer, and `earnings-cycle.mjs` / `intraday-edges.mjs` have no macro
mode.

### Conviction legs, tested

1. **Both proposals' factual claims verify, and the one field they disagreed on is settled on this
   calendar's own precedent.** SUPPORTED. The `uk-cpi` lane's claim that **exactly one** CPI print falls
   between `boe-decision-2026-12-17` and this meeting is correct — `uk-cpi-2027-01-20`, with the next at
   `uk-cpi-2027-02-17`, **thirteen days after** this round. The `uk-labour-market` lane's claim that the
   next labour print after 2027-01-19 is **2027-02-16, twelve days after** this round, is corroborated
   by this calendar's own `proposals/uk-labour-market-2027-02-16.from-uk-labour-market-2027-01-19.json`.
   Both tiered it **medium**; both set `symbols: []`; both filed `estimate` and gave the same two
   reasons. They disagreed on **`kind`** — `macro-print` vs `rates`. The canonical file written in this
   PR takes **`macro-print`**, because every other central-bank decision on this calendar uses it:
   `boe-decision-2026-09-17`, `-2026-11-05`, `-2026-12-17`, `-2027-04-29`, `fomc-2027-01-27`,
   `fomc-2027-03-17`, `boj-decision-2027-03-18` and `ecb-decision-2026-09-10` are **all** `macro-print`.
   Typing one BoE meeting differently from its five siblings buys nothing and costs any future query
   that groups by kind.

2. **The strip still does not reach 2027 — so no call on what this meeting *does*.** SUPPORTED, and
   placed first because it is the constraint everything else works around. centralbank.watch's Bank of
   England page, **fetched direct 2026-09-10** (data as-of **2026-09-09**), publishes exactly three
   meeting rows — **2026-09-17** (higher **9.1%**, implied **3.77%**), **2026-11-05** (**58.5%**,
   **3.91%**) and **2026-12-17** (**98.9%**, **4.15%**) — and nothing beyond. There is **no February
   2027 row**. So the decomposition identity that is the whole contribution of
   [`boe-decision-2026-12-17`](boe-decision-2026-12-17.md) has **nothing to apply to this meeting**, and
   this ledger registers **no test on the 2027-02-04 decision itself**. Two side observations worth the
   line. The strip has drifted **hawkish in one day** against the sibling's 2026-09-08 fetch — 6.9 → 9.1,
   54.2 → 58.5, 94.6 → 98.9, implied 3.77 → 3.77, 3.89 → 3.91, 4.11 → 4.15 — a small move, dated, and
   **one aggregator**, which is the same single-source weakness the December ledger named about itself.

3. **The Reports task the sibling left is discharged: four cut-offs, all 8–10 days.** SUPPORTED, and
   this is the leg that fixes this meeting's geometry.
   [`boe-decision-2027-04-29`](boe-decision-2027-04-29.md) established the mechanic from **two**
   Reports and flagged two more as *"surfaced in search… not fetched from the Bank and therefore not
   used as evidence"*. One of those two is now fetched:

   | Report | Published | Conditioning cut-off (Bank's own words) | Gap | Provenance |
   |---|---|---|---|---|
   | November 2025 MPR | 06 November 2025 | *"the 15 working days to 28 October"* | **9 days** | **fetched direct 2026-09-10** (cut-off from the MPR page; publication date from the November 2025 minutes page, *"Published on 06 November 2025"*) |
   | February 2026 MPR | 05 February 2026 | *"the 15 UK working days to 26 January 2026"* | **10 days** | **search-surfaced, NOT directly fetched** — see *Honest limits* |
   | April 2026 MPR | 30 April 2026 | *"market interest rates in the 15 days to 22 April"* | **8 days** | **fetched direct 2026-09-10** (independently re-verified; the sibling had it too) |
   | July 2026 MPR | 30 July 2026 | *"the 15 working days to 20 July"* | **10 days** | **inherited** from the sibling's 2026-09-09 fetch |

   Four Reports, **8–10 days**, no outlier. Applied to a **2027-02-04** publication the cut-off band is
   **2027-01-25 to 2027-01-27**. Registered as **FT-boe-decision-2027-02-04-1** with the band written a
   shade wider (**2027-01-22 to 2027-01-29**), for the same reason the sibling widened its own — a pass
   should be informative about the *convention*, not about four points. **The band does not depend on
   the weak link:** drop February and the remaining three still span 8–10, so the 01-25/01-27 window
   stands either way. This also **advances the sibling's FT-boe-decision-2027-04-29-1** without touching
   its row: its 6–13 day prediction now has four supporting observations instead of two.

4. **February's conditioning geometry is the *inverse* of April's — the run-in prints land inside the
   window, not on its edge.** SUPPORTED, and verified on the exact analogue. The window is **15 UK
   working days ending at the cut-off**. Counting back from **2027-01-25** (1 January 2027 is a Friday
   and a UK bank holiday) gives a start of **2027-01-05**; counting back from **2027-01-27** gives
   **2027-01-07**. Either way the window **contains**
   [`uk-labour-market-2027-01-19`](uk-labour-market-2027-01-19.md) (D-16) and
   [`uk-cpi-2027-01-20`](uk-cpi-2027-01-20.md) (D-15), with **3–5 UK working days** left for the market
   path to absorb them before it closes. The analogue confirms it from primaries: the ONS bulletin
   *Consumer price inflation, UK: December 2025* was **released 21 January 2026** (fetched today;
   headline **3.4%**), and the February 2026 Report's cut-off is **26 January 2026** — **three UK working
   days inside**. Contrast [`boe-decision-2027-04-29`](boe-decision-2027-04-29.md), where the sibling
   measured the March CPI print landing **on** the closing edge (March 2026 CPI released 22 April 2026;
   April 2026 cut-off *"the 15 days to 22 April"* — the same date). **The generalisable form:** the
   **February and April rounds sit at opposite ends of the same mechanic** — a mid-January print is
   comfortably inside a late-January cut-off, a mid-to-late-April print is on top of a late-April one.
   A session reading either Report should know which case it is in before treating the last print as
   "in the forecast".

5. **The cut-off closes inside the January FOMC — the same dating artefact the sibling found, at a
   different distance.** SUPPORTED, arithmetic on legs 3 and 4 plus a Fed primary. The Federal Reserve's
   FOMC calendars page, **fetched direct 2026-09-10**, lists **January 26-27** for 2027 with **no SEP
   asterisk** (the 2027 asterisks are March 16-17, June 8-9, September 14-15, December 7-8) and notes
   *"Each meeting date is tentative until confirmed at the meeting immediately preceding it."* That
   matches [`fomc-2027-01-27`](fomc-2027-01-27.md)'s own header. The 2027 cut-off band
   (**01-25 … 01-27**) therefore **closes inside the FOMC meeting itself**. On the 2026 analogue the
   separation was cleaner and pointed the same way: cut-off **26 January 2026**, FOMC **27-28 January
   2026** — the Fed's decision fell **one day outside** the published market path. The practical rule is
   the sibling's, restated for this round: **a gap between the February 2027 projections and the
   then-current curve is a dating artefact first**, and evidence about the Committee's view only after
   the Report's own stated cut-off has been read. The difference from April is that the Fed is **eight
   days ahead** here rather than seventeen hours, so the *committee* has a full week to absorb it before
   voting even if the *forecast* does not contain it.

6. **The entry level is priced even though the meeting is not — and this is the only 2027 BoE round
   that can say so.** SUPPORTED, and it is this session's sharpest correction to the family's framing.
   The BoE's published calendar has **eight 2026 dates ending 17 December** and **eight 2027 dates
   beginning 4 February**. There is **no meeting in between**: **2026-12-17 → 2027-02-04 is 49 days**,
   the longest gap on the Bank's schedule. So the strip's **terminal row is the meeting immediately
   preceding this one**, and what it prices is precisely the rate this committee **starts from**:
   **98.9% higher, implied 4.15%** against a Bank Rate of **3.75%** (fetched today from the July 2026
   minutes, *"Bank Rate maintained at 3.75%"*). Running the December ledger's identity
   `implied = 3.75 + 0.25 × E[hikes]` on that row gives **E[hikes] = 1.60 by 2026-12-17**. The sibling's
   blanket "no pricing exists" is right about the **decision** and wrong about the **level**, and the
   difference matters: for `boe-decision-2027-04-29` **four** unpriced meetings sit between the strip's
   end and the event, so nothing about its entry level is readable; for this one, **zero** do.
   Registered as **FT-boe-decision-2027-02-04-2**: Bank Rate **at or above 4.00%** at this announcement.
   It is deliberately a **level** test and **not** a direction test — it says nothing about what the
   Committee does on 2027-02-04.

7. **The dissent is a march, not a stable minority — and the correction is from six primaries.**
   SUPPORTED, and it contradicts a sibling's standing characterisation, which is why it is set out in
   full. Every row below is a **bankofengland.co.uk Monetary Policy Summary and minutes page fetched
   direct 2026-09-10**:

   | Announcement | Bank Rate | Vote | The minority wanted | Signed dissent |
   |---|---|---|---|---|
   | 2025-11-06 | 4.00% (hold) | 5–4 | a **cut** to 3.75% | **−4** |
   | 2026-02-05 | 3.75% (hold) | 5–4 | a **cut** to 3.50% | **−4** |
   | 2026-03-19 | 3.75% (hold) | **9–0** | — | **0** |
   | 2026-04-30 | 3.75% (hold) | 8–1 | a **hike** to 4.00% (Pill) | **+1** |
   | 2026-06-18 | 3.75% (hold) | 7–2 | a **hike** to 4.00% | **+2** |
   | 2026-07-30 | 3.75% (hold) | 6–3 | a **hike** to 4.00% | **+3** |

   Two readings, and only one of them is new. That the July vote is **6–3 for a hike** is already in the
   family. That the **9–0 in March 2026 is the pivot**, and that the hawkish side has grown by **exactly
   one member at each of the three meetings since**, is not: the **8–1 and 7–2 rate votes appear in no
   sibling ledger** (the "7–2" the September sibling carries is the **QT** vote to slow gilt sales from
   £100bn to £70bn, a different ballot). [`boe-decision-2026-11-05`](boe-decision-2026-11-05.md)
   describes the dissent as *"a stable minority"*; on six fetched primaries it is not stable, it is
   monotone. **Naive continuation** — and it is named as naive — puts **four** hawkish votes at
   2026-09-17 and a **majority** at 2026-11-05/2026-12-17, which is where **the strip independently puts
   it** (58.5% at November, 98.9% cumulative at December). Two methods, different data, same meeting.
   The honest caveats are three: three +1 steps is a pattern, not a law; committee membership turns over
   and a departing hawk resets the count without any change of view; and a delivered hike **re-bases the
   ballot** — after a hike the interesting dissent is whoever wants the next one, not the same three.
   Registered as **FT-boe-decision-2027-02-04-3** in its **weakest scoreable form** — *no member votes
   for a reduction at 2027-02-04* — with its cheap kill seven days away.

8. **The ECB decides the same day, 75 minutes later, and without projections — so December's
   attribution rule inverts here too.** SUPPORTED, from two ECB primaries fetched today.
   ecb.europa.eu/press/calendars/mgcgc lists **"3-4 February 2027"** in Frankfurt as the first of eight
   2027 Governing Council monetary-policy meetings; the decision falls on day two by the ECB's standing
   two-day convention. ecb.europa.eu/press/projections states the staff projections are published
   *"four times a year (in March, June, September and December)"* — so **February is not an ECB
   projection round**. Timing is **inherited** from [`ecb-decision-2026-09-10`](ecb-decision-2026-09-10.md),
   which records **14:15 CET** decisions and a **14:45 CET** press conference as the Bank's standing
   convention: **08:15 ET**, against the BoE's 12:00 London / **07:00 ET**. So on this date the **BoE
   publishes a full Monetary Policy Report and the ECB, 75 minutes later, does not publish projections
   at all**. [`boe-decision-2026-12-17`](boe-decision-2026-12-17.md)'s rule — *check the ECB before
   crediting the BoE, because the ECB has projections and the BoE has only minutes* — therefore
   **inverts on 2027-02-04**, exactly as the April sibling found it inverting against the Fed, and here
   on the **same day** rather than the day before. **This calendar carried no 2027 ECB entry at all** —
   not canonically, not as anyone's proposal — so `ecb-decision-2027-02-04` is **proposed in this PR**.
   As with everything else here, the inversion is about **interpretive content** and not about price:
   for eight US mega-caps neither central bank outranks the US payrolls print the next morning.

9. **The US calendar owns the tape on both sides of this meeting.** SUPPORTED, mechanical. Seven tracked
   events sit within five days: [`ism-manufacturing-2027-02-01`](ism-manufacturing-2027-02-01.md)
   (**high**), [`sloos-2027-02-01`](sloos-2027-02-01.md),
   [`boj-summary-of-opinions-2027-02-01`](boj-summary-of-opinions-2027-02-01.md),
   [`ism-services-2027-02-03`](ism-services-2027-02-03.md) (**high**),
   [`treasury-refunding-2027-02-03`](treasury-refunding-2027-02-03.md),
   [`jobs-2027-02-05`](jobs-2027-02-05.md) (**high**) and
   [`eia-steo-2027-02-09`](eia-steo-2027-02-09.md). The one that matters is **payrolls**: **08:30 ET on
   2027-02-05**, roughly **25.5 hours** after the BoE. So this announcement lands into a tape that is
   already positioning for the US employment report, on a morning where the ECB follows 75 minutes
   later. Any attribution of a 07:00–09:30 ET move on 02-04 to the Bank of England that has not first
   accounted for **payrolls-eve positioning** and **the ECB at 08:15** is not entitled to it.

10. **The date is provisional in the Bank's own words, and `estimate` is load-bearing rather than a
    taxonomy artefact.** SUPPORTED, and it is the same finding the April sibling made, re-verified today
    on a fresh fetch. The MPC announcement-dates page carries **two differently-headed panels** —
    *"2026 confirmed dates"* and *"2027 provisional dates"* — which is what makes the 2027 marking
    meaningful rather than boilerplate. The 2027 panel lists **4 February, 18 March, 29 April, 17 June,
    29 July, 16 September, 4 November, 16 December**, with **Monetary Policy Reports on February, April,
    July and November**. That these have stood since the Bank announced them on **18 December 2025**
    (per the sibling's fetch of the Bank's own announcement) is evidence they are **stable**, not
    evidence they are **confirmed**. Registered as **FT-boe-decision-2027-02-04-4**.

11. **No tracked symbol carries a sterling channel, and no play is proposed.** SUPPORTED, stated as a
    null claim rather than a hedge. `symbols: []`. The house playbooks (S1/S2/E1/S3/S4 + G1,
    [`trade-playbooks.md`](../../plans/trade-playbooks.md)) are equity- and earnings-keyed; none is
    rates-keyed, let alone sterling-rates-keyed. The only channel that exists is **global term
    premium**, second-order, and the only transmission this repo has ever *measured* is the
    gilt-to-Treasury pipe quantified in
    [`uk-autumn-budget-2026-10-28`](uk-autumn-budget-2026-10-28.md), which opens on roughly the worst 1%
    of gilt days. The "Today" kill switch is therefore a **measurable price test** rather than a
    restatement of the claim — a null claim's failure mode is that a channel exists and is simply not
    instrumented here.

12. **The volatility regime moved this week, and the family's baseline is now stale.** SUPPORTED,
    fetched. Yahoo `^VIX` daily closes to 2026-09-10: **14.53 · 15.30 · 15.72 · 16.46 · 17.84**. That is
    **+3.31 points over five sessions**, past the **≥3-point** move this calendar's own deterministic
    screen (`scripts/event-material-decide.mjs`) treats as a regime change worth a real session. The
    April sibling's probe-ref baselines **16.19** as of yesterday; a session quoting a mid-16s VIX on
    this family after today is quoting a stale number. It changes **nothing** here — no options-shaped
    play exists to be re-priced, because no play exists — and is recorded as **a fact about the tape,
    not a view about this meeting**.

### What plays the conditions support (date estimate)

**None.** No entry, exit, hedge or size is keyed to 2027-02-04. Four rules:

- **Read-only, and read the cut-off first.** The document set is the Monetary Policy Report, the Summary
  and minutes, the vote and a press conference. The **stated conditioning cut-off** is the first thing
  to find, because it determines whether the January FOMC and the January CPI print are inside the
  published market path — legs 4 and 5 are the whole of it.
- **Search order when it lands** — (1) the **stated cut-off date**; (2) the **vote split and its
  direction**, against the march in leg 7 as re-based by whatever the four intervening meetings deliver,
  never against July 2026's 6–3; (3) the **level Bank Rate actually reached**, against the strip's
  implied 4.15%; (4) the **modal CPI at the two-year horizon** and the **private-sector AWE path**,
  which is where the family's standing wage-anchor gap either closes or does not.
- **The anti-attribution rule.** Any read of the 02-04 tape that has not first accounted for the **ECB
  at 08:15 ET the same morning** and **US payrolls at 08:30 ET the next** is not entitled to its
  attribution. Legs 8 and 9 are the whole of it.
- **The branch to pre-decide** — if a 2027 rate strip becomes fetchable before this meeting, this ledger
  gains the method it currently lacks and **should register a direction test at that pulse**, saying so
  in the row. Until then the refusal on the *decision* is the position; the *level* test already
  registered is as far as the published sources reach.

### Honest limits

**The February cut-off — the one data point that is the exact analogue for this meeting — is the one
this session could not fetch, and that is the largest weakness here.** The February 2026 MPR's
*"15 UK working days to 26 January 2026"* was surfaced by **two independent web searches**, one of them
restricted to `bankofengland.co.uk`, both attributing it to the Bank's own February 2026 Report. But the
Report's **landing page carries only the overview** (fetched twice today; the second fetch asked for the
phrase explicitly and returned *"None of these phrases appear"*), a plausible full-report sub-URL
**404'd**, and the **PDF downloaded but would not yield extractable text** — all three are in
`probe-ref.blocked`. So it is a **BoE primary reached through search, not a BoE primary fetched**, and it
is labelled that way in leg 3's provenance column rather than promoted. **What saves the conclusion is
that it is not load-bearing:** the other three cut-offs span 8–10 days on their own, so the
2027-01-25/01-27 window and **FT-boe-decision-2027-02-04-1** stand without it. Fetching the February
2026 Report's own text is nonetheless **the first pulse's cheapest high-value task**, and a pulse that
also reaches the **November 2026** Report will have the analogue *and* the most recent round.

Four further limits. **Nothing here prices the decision**, by construction (leg 2) — a reader wanting a
view on what the Committee does on 2027-02-04 will not find one, and that is the honest state of the
sources rather than an omission. **The entry-level test rests on a single aggregator**: leg 6's 4.15%
and 98.9% come from centralbank.watch and nowhere else, the same single-source weakness
[`boe-decision-2026-12-17`](boe-decision-2026-12-17.md) named about its own decomposition; a second
curve source would materially strengthen **FT-boe-decision-2027-02-04-2** and none was found today.
**The vote march is three steps long**, and leg 7 names all three ways it can break without anyone
changing their mind — small n, membership turnover, and re-basing after a delivered hike; that is why
the registered test is the weak *"nobody votes for a cut"* form rather than a headcount. **The ECB
timing is inherited**, not fetched: the 14:15 CET / 08:15 ET figures come from
[`ecb-decision-2026-09-10`](ecb-decision-2026-09-10.md), which itself records them as the ECB's standing
convention rather than a commitment for any particular future date — the ECB press-conference URL tried
today **404'd** and is in `blocked`. The **same-day, no-projections** finding in leg 8 does not depend
on the minutes: it holds whatever the exact hour turns out to be.

## Stance & kill switches

**Stance (date `estimate`, and provisional in the Bank's own words):** **stand aside completely, make no
call on what this meeting does, and bank three findings.** This book holds nothing with a sterling-rates
channel and none is proposed; the positions here are **analytical**, and the first is a **refusal** —
centralbank.watch publishes no 2027 rows, so **no test is registered on the 2027-02-04 decision**.
**But the refusal is narrower than the sibling's.** The BoE's calendar has **no meeting between
2026-12-17 and 2027-02-04** — 49 days, the longest gap on its schedule — so the strip's **terminal row is
the meeting immediately before this one**, and it prices the rate this committee **starts from**: 98.9%
higher, implied **4.15%** against **3.75%** today, **E[hikes] ≈ 1.60**. This is the **only 2027 BoE
meeting whose entry level the published strip reaches**, and it is registered as a **level** test, not a
direction test. **Second, the dissent is a march and not a stable minority** — six BoE minutes pages
fetched today give −4, −4, **0, +1, +2, +3** from November 2025 to July 2026, i.e. one additional hawkish
member at each of the three meetings since March 2026's 9–0 pivot; the **8–1 and 7–2 rate votes appear in
no sibling ledger**, and this **corrects** [`boe-decision-2026-11-05`](boe-decision-2026-11-05.md)'s
*"stable minority"* framing. Naive continuation and the strip independently point at the same meeting for
the first hike. **Third, the conditioning geometry of a February round is the inverse of an April one.**
Four Reports now bracket the mechanic at **8–10 days** (November 2025 · February 2026 · April 2026 · July
2026), discharging the task the April sibling left, and applied to 2027-02-04 that fixes the cut-off at
**2027-01-25 to 2027-01-27** — which **closes inside the 2027-01-26/27 FOMC** and leaves the January
labour and CPI prints **3–5 UK working days inside** the window rather than on its edge, verified on the
2026 analogue from an ONS primary (Dec-2025 CPI released 21 January 2026; cut-off 26 January 2026).
Fourth, the day's attribution **inverts December's ECB rule**: the ECB decides the same day 75 minutes
later with **no February projections**, so the BoE is the only full forecast round on the date —
`ecb-decision-2027-02-04` is **proposed in this PR**, the calendar having carried no 2027 ECB entry at
all. The quarter call is **medium**, not high, for two stated reasons: the entry-level number rests on
**one aggregator**, and the February cut-off — the exact analogue — is **search-surfaced, not fetched**.
Estimates widen caution and license nothing.

**Kill switches:**

- **Channel kill (the one that would rebuild this doc):** a tracked name (AAPL/AMZN/AVGO/CRWV/GOOG/
  META/MRVL/MSFT) moving **>2%** in the **07:00–09:30 ET** window on **2027-02-04** in a way the tape
  attributes to the BoE. Leg 11's "no price channel" claim would be false. Score by **2027-02-05**.
- **Conditioning-window kill (registered):** the **2027-02-04 Monetary Policy Report** naming a
  conditioning cut-off **outside 2027-01-22 to 2027-01-29**. The 8–10 day regularity is not a convention
  and legs 3, 4 and 5 are re-derived from scratch. Registered as **FT-boe-decision-2027-02-04-1**, score
  by **2027-02-05**. **Falsifiable early and cheaply:** fetching the February 2026 Report's own text, or
  the November 2026 Report when it publishes, settles it years before the event.
- **Entry-level kill (registered):** **Bank Rate below 4.00%** at the 2027-02-04 announcement. The
  strip's 98.9%-higher-by-December and the vote march were both wrong about the level, and leg 6's
  "the entry level is priced" stops being a useful claim about this meeting. Registered as
  **FT-boe-decision-2027-02-04-2**, score by **2027-02-05**. Early tell: the **2026-12-17** announcement
  itself.
- **Vote-march kill (registered, in its weak form):** **any member voting for a reduction in Bank Rate**
  at the 2027-02-04 announcement. Registered as **FT-boe-decision-2027-02-04-3**, score by
  **2027-02-05**. Its **cheap early kill is seven days away** — the **2026-09-17** minutes showing
  **fewer than four** members voting for an increase breaks the +1-per-meeting march. That observation
  is [`boe-decision-2026-09-17`](boe-decision-2026-09-17.md)'s **own registered kill switch** and is
  **read there, deliberately not re-registered here** — reading a sibling's result is not owning it.
- **Date / payload kill (registered):** the Bank re-publishing its 2027 schedule with **4 February
  moved, or without a February Monetary Policy Report beside it**. The header and the whole
  forecast-round framing break together, and the `estimate` label will have earned its keep. Registered
  as **FT-boe-decision-2027-02-04-4**, score by **2027-02-05**; re-read the Bank's calendar every pulse.
- **Attribution kill (not registered):** the **2027-01-27 FOMC** turning out to carry a Summary of
  Economic Projections after all — the Fed's own calendar states each meeting is tentative until
  confirmed at the preceding one. Leg 5's framing survives (the cut-off date does not move), but the
  "only forecast round in the window" reading in leg 8 weakens. Re-check every pulse after the
  **2026-12-08/09** FOMC.
- **Method-availability branch (not a kill, a scope change):** a **fetchable 2027 BoE rate strip** —
  centralbank.watch extending its table, or a second curve source. Leg 2's refusal expires and this
  ledger **should** register a direction test at that pulse rather than continuing to stand mute on the
  decision. Record it as a scope change in the row, not as a stance reversal. Re-check every pulse.
- **Wage-anchor kill (inherited, not registered):** the **2026-11-05** Monetary Policy Report publishing
  a private-sector AWE path that extends past 2026 Q3. The standing gap the `uk-labour-market-2027-01-19`
  lane named closes at the near anchor rather than here, and this round stops being the second venue for
  it. That is the labour lane's finding; carry it, do not re-register it.

Four forward tests registered in
[`forward-tests/boe-decision-2027-02-04.md`](../forward-tests/boe-decision-2027-02-04.md) — **-1** (the
conditioning cut-off lands in 2027-01-22…01-29), **-2** (Bank Rate is at or above 4.00% at the
announcement), **-3** (no member votes for a cut) and **-4** (the date and the MPR both survive to the
meeting). **No test on what this meeting decides is registered, deliberately** — there is no published
2027 pricing to take a side against, and no house instrument that would price one.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-10 | D-147 | Initial research banked (above), on an id that existed only as **two competing proposals** — `from-uk-cpi-2027-01-20` and `from-uk-labour-market-2027-01-19`, both read in full first. **Both verify**; the one field they disagreed on (`kind`: `macro-print` vs `rates`) is settled as **`macro-print`**, matching all eight other central-bank entries on this calendar, in the canonical `src/domain/market-events/boe-decision-2027-02-04.json` written in this PR. **Three findings neither proposal had.** (i) **The entry level is priced even though the meeting is not.** centralbank.watch's BoE page (fetched, as-of 2026-09-09) still stops at **2026-12-17** — so **no test on the 2027-02-04 decision** — but the BoE calendar has **no meeting between 2026-12-17 and 2027-02-04** (**49 days**, its longest gap), making the strip's terminal row the meeting **immediately before** this one: **98.9% higher, implied 4.15%** vs **3.75%** today → **E[hikes] ≈ 1.60**. This is the **only 2027 BoE round whose entry level the strip reaches**; the sibling's blanket "no pricing" is right about the decision, wrong about the level. Strip also drifted **hawkish in one day** vs the sibling's 09-08 fetch (6.9→9.1, 54.2→58.5, 94.6→98.9). (ii) **The dissent is a march, not a stable minority** — six BoE minutes pages **fetched direct today**: 2025-11-06 **5–4** (four for a **cut**), 2026-02-05 **5–4** (four for a **cut**), 2026-03-19 **9–0**, 2026-04-30 **8–1** (hike), 2026-06-18 **7–2** (hike), 2026-07-30 **6–3** (hike) → signed **−4, −4, 0, +1, +2, +3**, i.e. **+1 per meeting for three meetings** since the March pivot. The **8–1 and 7–2 rate votes are in no sibling ledger** (the September sibling's "7–2" is the **QT** vote). This **corrects** `boe-decision-2026-11-05`'s *"stable minority"*. Naive continuation and the strip both point at **Nov/Dec 2026** for the first hike. (iii) **The ECB decides the same day, 75 minutes later, with no projections** — ecb.europa.eu/press/calendars/mgcgc (fetched): *"3-4 February 2027"*, Frankfurt; ecb.europa.eu/press/projections (fetched): projections are *"four times a year (in March, June, September and December)"*. So the **BoE is the only full forecast round on the day**, inverting `boe-decision-2026-12-17`'s *"check the ECB before crediting the BoE"* rule — the same inversion the April sibling found against the Fed, here on the same day. **The April sibling's first-pulse task is discharged:** four MPR cut-offs now bracket the conditioning window at **8–10 days** — **Nov 2025** *"the 15 working days to 28 October"* (**9d**, **fetched today**, publication date from the Nov-2025 minutes), **Feb 2026** *"the 15 UK working days to 26 January 2026"* (**10d**, **search-surfaced only** — see below), **Apr 2026** *"the 15 days to 22 April"* (**8d**, **re-fetched today**), **Jul 2026** (**10d**, inherited). For **2027-02-04** the cut-off is **2027-01-25…01-27**, and **February's geometry is the inverse of April's**: 15 UK working days back puts the window's start at **2027-01-05…01-07**, so `uk-labour-market-2027-01-19` and `uk-cpi-2027-01-20` land **3–5 UK working days INSIDE** it — verified on the exact analogue from an ONS primary (*Consumer price inflation, UK: December 2025* **released 21 January 2026**, headline 3.4%; Feb-2026 cut-off **26 January 2026** = three working days inside), against April's print landing **on** the edge. The cut-off also **closes inside the 2027-01-26/27 FOMC** (Fed calendars page fetched today: Jan 26-27, **no SEP**; 2027 asterisks are Mar 16-17, Jun 8-9, Sep 14-15, Dec 7-8) — on the 2026 analogue it closed **one day before** the Fed convened. Adjacency sweep: **peers** — none, `symbols: []`. **Macro** — run-in is `uk-labour-market-2027-01-19` (D-16) and `uk-cpi-2027-01-20` (D-15), the **only** CPI print between 2026-12-17 and this meeting; next CPI **2027-02-17** (D+13), next labour **2027-02-16** (D+12). **Volatility** — VIX **17.84** close 2026-09-10 (Yahoo `^VIX`), five-session run **14.53 → 15.30 → 15.72 → 16.46 → 17.84** = **+3.31**, past this calendar's own ≥3-point materiality threshold; the April sibling's 16.19 baseline is now stale. Changes nothing here (no play exists). **Geopolitical/policy** — the live vector is the Middle East energy shock the June/July 2026 minutes cite as the reason the Committee stopped cutting; carried, not re-fetched. **Event tape** — seven tracked events within five days; the one that matters is **`jobs-2027-02-05` (high) at 08:30 ET, ~25.5 hours later**, with `ism-services-2027-02-03` and `treasury-refunding-2027-02-03` the day before. Any 02-04 attribution ignoring **payrolls-eve positioning** and **the ECB at 08:15 ET** is not entitled to it. **ONE dated adjacency PROPOSED** (`estimate`, own-owner file): **`ecb-decision-2027-02-04`** — this calendar carried **no 2027 ECB entry at all**, canonically or as anyone's proposal. **Four forward tests registered, none on what this meeting decides:** FT-1 (cut-off lands **2027-01-22…01-29**), FT-2 (**Bank Rate ≥ 4.00%** at the announcement — a **level** test off the strip's terminal row, not a direction test), FT-3 (**no member votes for a cut**, the vote march's weak form), FT-4 (the date and the MPR both survive). **Named weakness, up front:** the **February 2026 cut-off — the exact analogue — is the one this session could NOT fetch.** The Report's landing page carries only the overview (asked twice, explicitly), a full-report sub-URL **404'd**, and the **PDF would not yield extractable text**; all three plus a 404'd ECB press-conference URL are in `blocked`. It is a **BoE primary reached through search, not fetched**, labelled as such — and **not load-bearing**, since the other three cut-offs span 8–10 on their own. Fetching it (or the November 2026 Report) is the **first pulse's cheapest high-value task**. Also: the entry-level numbers rest on **one aggregator**; the vote march is **three steps long** with three named ways to break without anyone changing view; ECB timing is **inherited** from `ecb-decision-2026-09-10`, not fetched. | — (stance set: stand aside, no position, no play; and one **refusal** — **no test on what this meeting decides**, because no 2027 pricing exists to take a side against. Four analytical commitments: the **entry level IS priced** off the strip's terminal row and this is the only 2027 BoE round that can say so; the **dissent is a march, not a stable minority**, correcting `boe-decision-2026-11-05`; a **February round's conditioning geometry is the inverse of an April one's**, with the run-in prints inside the window rather than on its edge; and the day's attribution **inverts December's ECB rule**, the BoE being the only forecast round on the date) | 2026-10-01 (medium, 31+d band: every 21d — lands at D-126, still deep inside the same band; that pulse's tasks are to **fetch the February 2026 Report's own text** and settle FT-1's analogue, to **re-check whether any curve source has extended to 2027**, and to read the **2026-09-17 vote** against the +1-per-meeting march) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-boe-decision-2027-02-04.json` (`status: "estimate"`)
in the same PR — your own file, never another event's canonical one (#1717). Close-out fills
`## Outcome` below from re-run instrument data (cache busted first), never from memory — after
which this doc goes quiet.
