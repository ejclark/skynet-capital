# Eurostat euro-area HICP flash estimate (September 2026 data) — eurostat-hicp-flash-2026-10-01

**Kind:** macro-print · **Date:** 2026-10-02 (estimate, EST: two primaries fetched direct 2026-09-09 — Eurostat's own August flash release ec.europa.eu/eurostat/web/products-euro-indicators/w/2-01092026-ap, whose "Next release: 2 October 2026" line is the same field that correctly named the July flash a cycle earlier, and the ECB statistical release calendar ecb.europa.eu/press/calendars/statscal/ges/html/sthicp.en.html, "02/10/2026 15:00 CET — Euro area seasonally adjusted HICP flash estimate … Reference period: Sep-2026". **The id slug says 10-01 and is wrong**; the slug is kept as this event's stable key because the file/ledger/branch contract keys on the id, never on the date. Filed estimate per this lane's no-self-confirm limit and the missing confirmed-prefix slot for a non-US statistical agency) · **Impact:** low
**Last assessed:** 2026-09-09
<!-- probe-ref: {"symbols":{},"vix":15.72,"daysBand":"low:15+","adjacentIds":["adp-employment-2026-09-30","advance-economic-indicators-2026-09-30","apple-eu-dma-terms-2026-10-01","boj-summary-of-opinions-2026-10-01","boj-tankan-2026-10-01","case-shiller-hpi-2026-09-29","census-benchmark-revision-nsa-2026-09-28","chicago-pmi-2026-09-30","construction-spending-2026-10-01","consumer-confidence-2026-09-29","consumer-credit-2026-10-07","crwv-fully-connected-2026-09-29","dallas-fed-mfg-2026-09-28","eia-steo-2026-10-06","fhfa-hpi-2026-09-29","fomc-minutes-2026-10-07","g20-trade-ministerial-milwaukee-2026-09-30","gdp-q2-2026-third-2026-09-30","google-adtech-final-judgment-2026-10-02","government-funding-deadline-2026-09-30","intl-trade-full-report-2026-10-06","ism-manufacturing-2026-10-01","ism-services-2026-10-05","jgb-40y-auction-2026-09-29","jobs-2026-10-02","jolts-2026-09-29","m3-full-report-2026-10-02","mrvl-investor-day-2026-10-06","opec-jmmc-68th-2026-10-04","opec-plus-meeting-2026-10-04","pce-2026-09-30","pjm-reliability-backstop-procurement-2026-09-30","retail-benchmark-revision-2026-09-28","russell-style-quarter-end-capping-effective-2026-09-30","sp-select-sector-secondary-reweight-2026-09-30","treasury-10y-note-2026-10-07","treasury-3y-note-2026-10-06","treasury-buyback-10y20y-2026-10-01","treasury-buyback-2y3y-2026-10-06","treasury-buyback-tips-1y10y-2026-09-29","treasury-coupon-announcement-2026-10-01"],"screenStreak":0,"blocked":[{"url":"https://www.ecb.europa.eu/press/calendars/statscal/hicp/html/index.en.html","status":"404 (slug guess for the ECB HICP calendar; the real path is /statscal/ges/html/sthicp.en.html, which was then fetched OK)","at":"2026-09-09"},{"url":"https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/prc_hicp_midx?unit=I25","status":"200-but-empty (dataset discontinued at 2025; the replacement prc_hicp_minr was used instead)","at":"2026-09-09"}]} -->

## At a glance

**TL;DR.** **The date in this event's own id is wrong, and fixing it is the finding: the September
flash publishes 2026-10-02, not 10-01** — Eurostat's own August release says "Next release: 2 October
2026" and the ECB's statistics calendar agrees to the hour. That one-day correction moves the print
onto **US payrolls day**, and into **day two of a possible federal funding lapse** that
[`government-funding-deadline-2026-09-30`](government-funding-deadline-2026-09-30.md) says would
*remove* the 10-02 payrolls — Eurostat publishes through a US shutdown because it is not a US agency.
Unlike its sibling [`eurostat-hicp-final-2026-09-17`](eurostat-hicp-final-2026-09-17.md), which is a
receipt on a published number, **this flash arrives before the decision it can inform**: it is one of
only two euro-area inflation reads the ECB gets between 09-10 and its **10-29** meeting, and it lands
nineteen days before the **10-21** quiet period. From Eurostat's own index database this session
computes the print in advance: **headline ≈ 3.6% (band 3.4–3.8%)**, a third consecutive acceleration,
on **energy ≈ 18% y/y** against a **−0.1%** September-2025 base, while **core holds ≈ 2.3–2.4%** — the
energy-hot / core-tame shape [`cpi-2026-09-11`](cpi-2026-09-11.md) and
[`ecb-decision-2026-09-10`](ecb-decision-2026-09-10.md) both lean on. Registered as forward tests, not
asserted. `symbols: []`, no rates-keyed playbook, **no position**. Date is **estimate** — it widens
caution and licenses nothing.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside — nothing here is ours to hold, and nothing about it is urgent at D-23** | High | `symbols: []`, no house playbook (S1/S2/E1/S3/S4 + G1) is rates- or euro-keyed, and the print is three weeks out behind ECB 09-10, CPI 09-11 and FOMC 09-16 | A tracked name (NVDA/AVGO/MRVL/CRWV) moving **>1%** in the **05:00–09:30 ET** window on **2026-10-02** that the tape attributes to this release — the "no price channel" premise would be wrong and this doc is rebuilt |
| This week | **Do not let this week's euro events borrow this print's credit** — the ECB decides **09-10** on data it already has, and the September flash does not exist yet | High | The Governing Council has held August's **3.3% / core 2.4%** flash since 09-01; the next euro-area inflation datapoint after 09-10 is **09-17's complete release** (a receipt) and then this one | The **2026-09-10** ECB statement or press conference citing September inflation data — no such data exists before 10-02, so any such citation means a source this doc has not found |
| This month | **Watch one branch, not one number: if the funding lapse removes 10-02 payrolls, this becomes one of the few hard macro reads that morning — and it is still not a labour read** | Medium | `government-funding-deadline-2026-09-30` states an un-averted lapse removes the 10-02 Employment Situation; BLS does not publish through a lapse and Eurostat does — but euro consumer prices carry no US labour information, only a shared energy shock | A CR or full-year appropriation enacted on or before **2026-09-30**, or BLS publishing the Employment Situation on **2026-10-02** anyway — the branch closes and this entry returns to plain calendar visibility |
| This quarter | **Never size a US position to a euro flash; route the surprise to the ECB ledger instead** | High | The two channels euro inflation reaches this book through (dollar translation, global term premium) are owned by [`fomc-2026-10-28`](fomc-2026-10-28.md)-cycle docs, and the flash's real consumer is [`ecb-decision-2026-10-29`](ecb-decision-2026-10-29.md), 27 days later | The **2026-10-02** flash printing headline **≤ 3.2%** or **≥ 4.0%** and a tracked name gapping on it — either would mean the euro print has a US price channel this doc says it does not |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit, hedge or size is keyed to 2026-10-02 on account of this release.
- **The date is the deliverable** — **2026-10-02**, not 10-01. Two primaries (Eurostat's own "Next release" line, the ECB statistics calendar); the proposal's month-end pattern was refuted, not refined.
- **The three cells to read on the day** — **headline** against **3.3%**, **energy y/y** against **14.3%**, **core** against **2.4%**. Everything else is precomputed below.
- **The pre-computed print** — headline **≈3.6%** (band 3.4–3.8%), energy **≈18%** (band 16.5–19%), core **≈2.3–2.4%**, services **≈2.9%** (band 2.7–3.1%). Registered as three forward tests; if it lands, this doc bought nothing but the date, which is fine.
- **The base is the mechanism** — September 2025 m/m was energy **−0.1%**, services **−0.9%**, core **+0.1%** (Eurostat database, fetched 09-09). Energy y/y rises on any positive month; services y/y rises *unless* the package-holiday roll-off repeats.
- **Where a surprise gets written** — core **≥2.6%** or services **≥3.2%** re-argues [`ecb-decision-2026-10-29`](ecb-decision-2026-10-29.md)'s inputs, in *that* ledger, not this one.
- **The attribution rule** — 10-02 is payrolls day. Before crediting any US move to this release, show a Bund move in the euro morning; the release clears before the US cash open either way.
- **The read-across limit** — euro HICP is **not** US core CPI: no owners'-equivalent-rent, energy weight ~**9.1%**. Any comparison to [`cpi-2026-10-14`](cpi-2026-10-14.md) is directional, never quantitative.
- **Watch (dated)** — ECB **09-10** (est) · US CPI **09-11** · FOMC **09-16** · Aug complete HICP **09-17** (est) · funding deadline **09-30** · ISM **10-01** · **this flash 10-02** (est) · US payrolls **10-02** · Sep complete HICP **10-16** (est) · ECB quiet period **10-21** (est) · ECB decision **10-29** (est).

## Initial research

### The question, plainly

This event reached the session as an id, `eurostat-hicp-flash-2026-10-01`, whose date was explicitly
**derived rather than sourced** — the proposing sweep
([`cpi-2026-09-11`](cpi-2026-09-11.md)'s D-2 adjacency pass) said so in capitals and left one
instruction: *"FIRST STEP FOR WHOEVER RESEARCHES THIS: verify the date against Eurostat's release
calendar before anything else."* So the question is in two parts: **when does it actually publish**,
and — given that its sibling turned out to be a receipt worth nothing to this book — **is there any
version of this event that is worth a slot?**

**One-line verdict:** the date is **wrong by one day** and the correction is the whole return — 10-02
puts the print on **US payrolls day** inside a possible funding lapse that would delete payrolls,
and unlike the sibling this flash **precedes** the ECB decision it can inform; the number itself is
computable in advance from Eurostat's own database and is registered rather than asserted.

**Method:** sourced web research per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md).
Fetched direct 2026-09-09: Eurostat's August 2026 flash (`2-01092026-ap`), the July complete
(`2-19082026-ap`), the June flash (`2-01072026-ap`), the HICP publications page, and the ECB
statistical release calendar for HICP. Quantitative work runs off **Eurostat's own dissemination
API** — `prc_hicp_mmor` / `prc_hicp_manr` for the 2025 base and `prc_hicp_minr` (ECOICOP 2, index
`2025=100`, updated 2026-09-01) for 2026 index levels and rates, geo `EA20`. VIX read from the same
Yahoo chart endpoint `event-material-scan.mjs` uses. No price instruments run: `symbols: []`, no
issuer, and `earnings-cycle.mjs` / `intraday-edges.mjs` have no macro mode.

### Conviction legs, tested

1. **The date is 2026-10-02, and the proposal's derivation is refuted rather than refined.**
   SUPPORTED, two primaries, and it is the single most useful thing in this document. Eurostat's
   August flash release carries, in its own release-details block, **"Next release: 2 October
   2026"**. That field is not a guess and it is *tested*: the June flash (`2-01072026-ap`, published
   2026-07-01) carried **"Next release: 31 July 2026"**, and the July flash did publish 2026-07-31.
   Independently, the **ECB statistical release calendar** lists **"02/10/2026 15:00 CET — Euro area
   seasonally adjusted HICP flash estimate (Dataset: HICP) Reference period: Sep-2026"**, then
   16/10/2026 12:00 CET (September complete) and 04/11/2026 15:00 CET (October flash). That calendar
   was itself checked against Eurostat before being leaned on: its **17/09/2026 12:00 CET** row for
   the August complete matches Eurostat's own sentence *"The next release with full data for August
   2026 is scheduled for 17 September 2026"*. **What died:** the proposal's two-of-three
   last-working-day pattern (2026-07-01, 2026-07-31, 2026-09-01) predicted **10-01** with **09-30**
   as the live alternative, and the answer is **neither** — Eurostat's flash is a *scheduled*
   release, and month-end arithmetic is the wrong tool for it. Registered as
   **FT-eurostat-hicp-flash-2026-10-01-1**, because this convention ("Next release" + the ECB
   calendar) is one this calendar will now reuse every month and should be scored at least once.

2. **The id slug now disagrees with the date, and that is deliberate.** SUPPORTED by the repo's own
   contract. `scripts/event-scan-validation.mjs` requires a canonical file's **name to equal its
   id** and validates `date` only as `YYYY-MM-DD`; nothing ties the two. Renaming the id to
   `…-2026-10-02` would strand this ledger, the forward-test fragment, the `research/<event-id>`
   branch that is the lane's dedupe key, and would leave the 10-01 proposal unshadowed — so the
   scanner would keep dispatching sessions at a phantom event. This is the first id/date mismatch in
   the calendar (checked: 0 of the existing canonical files have one), so it is stated loudly in
   `source`, in `notes` and in this header rather than left to be discovered.

3. **This flash is not its sibling: it publishes before the decision it can inform.** SUPPORTED from
   this calendar's own entries. [`eurostat-hicp-final-2026-09-17`](eurostat-hicp-final-2026-09-17.md)
   concluded — correctly — that a complete release lands *after* both policy meetings it could
   inform and is a receipt. The flash inverts every term of that argument: **10-02** precedes
   [`ecb-decision-2026-10-29`](ecb-decision-2026-10-29.md) by 27 days and
   [`ecb-quiet-period-start-2026-10-21`](ecb-quiet-period-start-2026-10-21.md) by 19, and it is one
   of only **two** euro-area inflation reads (this and the 10-16 complete) between the 09-10 decision
   and the 10-29 one. The October flash (11-04) lands *after* 10-29. So if any euro-area consumer
   price print moves the Governing Council's October vote, it is this one.

4. **The adjacency that matters is American: 10-02 is payrolls day, in a possible shutdown.**
   SUPPORTED, and it is why the one-day correction has consequences beyond tidiness.
   [`jobs-2026-10-02`](jobs-2026-10-02.md) is `confirmed`, `high`. One day earlier,
   [`government-funding-deadline-2026-09-30`](government-funding-deadline-2026-09-30.md) records the
   branch in its own words: *"an un-averted lapse removes the 10-02 payrolls and leaves the 10-01 ISM
   as the corridor's only hard macro read into an Oct 27-28 FOMC with no SEP"*, citing the 2025 lapse
   in which BLS skipped the October Employment Situation and cancelled the October CPI. **Eurostat is
   not a US agency and publishes regardless.** So in the lapse branch this `low` entry becomes one of
   the few hard consumer-price reads printed that morning anywhere. **The claim is bounded on
   purpose:** it is not a payrolls substitute — euro-area consumer prices carry no US labour
   information — and the only honest read-across is the **energy shock both tapes share**, which is
   exactly the variable the US CPI ledger says is escalating (Brent **$99.33** on 09-08, +13% m/m, a
   cycle high). Calendar visibility, not a price channel.

5. **The number is computable in advance from Eurostat's own index database, and the September base
   is the mechanism.** SUPPORTED, and registered rather than claimed. From the dissemination API
   (fetched today), **September 2025** monthly rates — the base every September 2026 y/y is measured
   against — are unusually soft in two cells:

   | Component | Sep-2025 m/m (the base) | Aug-2026 y/y | 2026 m/m run-rate (Jul → Aug) |
   |---|---|---|---|
   | All-items | **+0.1%** | 3.3% *(press)* / 3.2% *(database)* | +0.2 → **+0.4** |
   | Energy | **−0.1%** | 14.3% *(press)* / 14.2% *(db)* | +2.7 → **+2.9** |
   | Services | **−0.9%** | 3.0% | +1.1 → **0.0** |
   | Core (ex nrg, food, alc, tbc) | **+0.1%** | 2.4% | 0.0 → **+0.2** |
   | Non-energy industrial goods | **+2.2%** | 1.2% | −2.2 → **+0.6** |
   | Food, alcohol & tobacco | **−0.1%** | 1.1–1.2% | −0.1 → **0.0** |

   The identity is `y/y_Sep26 ≈ y/y_Aug26 + (m/m_Sep26 − m/m_Sep25)`. Energy has run **+2.7%** and
   **+2.9%** month-on-month with crude at a cycle high, against a **−0.1%** base — so on
   **e = +2% to +4%**, energy y/y lands **16.6% to 18.9%** (index arithmetic on 113.00 / 98.85), and
   even a flat month leaves it at 14.3%. Weighting at the sibling's implied weights (energy 9.1%,
   core 72.6%, food 19.2%) gives **m/m ≈ +0.40%** and therefore **headline ≈ 3.6%**, band **3.4–3.8%**.
   Core is the tame half: `c = 0.0 to +0.3` puts core at **2.2–2.5%**. Services is the high-variance
   cell precisely because its base is a large negative: repeating last September's **−0.9%** holiday
   roll-off holds services at **3.0%**, a milder **−0.5%** lifts it to **3.4%**, and 2026's services
   momentum has run *softer* than 2025's (August 0.0 vs +0.3), which is why the call is **2.7–3.1%**.
   Registered as **FT-…-2** (headline/energy) and **FT-…-3** (the core/services shape).

6. **Eurostat's own database and Eurostat's own press releases disagree by up to 0.1pp, and the
   forecast is stated against the press-release convention.** SUPPORTED, measured, and it is a trap
   for anyone who scores this from the API instead of the document. Published headline vs the
   database's `RCH_A` series: April **3.0 / 3.0**, May **3.2 / 3.2**, June **2.8 / 2.7**, July
   **2.9 / 2.9**, August **3.3 / 3.2**. The wedge reconciles to rounding — the database's rates are
   consistent with its own two-decimal indices (103.68 / 100.43 − 1 = **3.24%** → 3.2), while the
   releases compute from unrounded ones. Consequence taken, not smoothed: **every band above is on
   the press-release convention**, the forward tests score **from the 10-02 release document**, and
   the index-derived numbers carry an extra **±0.1pp** on top of their own modelling error.

7. **No tracked symbol carries a channel, and the argument is the sibling's.** SUPPORTED. `symbols:
   []`; the house playbooks ([`trade-playbooks.md`](../../plans/trade-playbooks.md)) are equity- and
   earnings-keyed and none is rates-keyed. A flash estimate is a *smaller* event than the ECB
   decision for which the same null was already argued. The two second-order channels (dollar
   translation, global term premium) belong to the FOMC-cycle docs. The tier stays **low** and the
   entry claims calendar value only.

8. **One pulse is all the cadence buys here, and that is the right answer.** SUPPORTED from
   `assessment-cadence.json`. At `low` and D-23 the matched band is **15+ days → every 30 days**, so
   the next scheduled check (2026-10-09) falls *after* the event and the real next touch is the
   close-out. Raising the tier to `medium` would buy pulses on 09-16, 09-23 and 09-30 — three
   sessions that would mostly re-read [`cpi-2026-09-11`](cpi-2026-09-11.md),
   [`fomc-2026-09-16`](fomc-2026-09-16.md) and
   [`government-funding-deadline-2026-09-30`](government-funding-deadline-2026-09-30.md), which own
   their own corridors. Tier held at `low` deliberately, with the reasoning recorded so the next
   session does not re-litigate it.

### What plays the conditions support (date estimate)

**None.** No entry, exit, hedge or size is keyed to 2026-10-02. Four rules and one branch:

- **Read-only, three cells.** Headline against **3.3%**, energy y/y against **14.3%**, core against
  **2.4%**. The rest is precomputed in leg 5.
- **Where a surprise gets written.** Core **≥2.6%** or services **≥3.2%** does not make a euro trade;
  it re-argues the inputs to [`ecb-decision-2026-10-29`](ecb-decision-2026-10-29.md) and the euro leg
  of [`cpi-2026-10-14`](cpi-2026-10-14.md)'s read-across, **in those ledgers**, on this receipt.
- **The attribution rule.** 10-02 is payrolls day. No future row may credit a US move to a euro-area
  flash without first showing a Bund move in the euro morning.
- **The shutdown branch, pre-decided.** If the lapse happens and payrolls vanish, this print's status
  changes from "one of forty things on a Friday" to "one of the few hard prints that morning" —
  **and its content still says nothing about US labour**. The only thing it legitimately updates is
  the energy shock's pass-through into consumer prices, which is the shared variable.
- **The branch that would re-tier this entry.** The 10-02 flash moving a Bund yield >5bp in its own
  hour, or the ECB citing it explicitly on 10-29. Either would mean a euro flash is a policy event in
  its own right and this entry's `low` tier is wrong.

### Honest limits

**Eurostat's own publication clock was not read this session.** The ECB calendar's **15:00 CET**
(= **09:00 ET**, both zones on summer time) is the ECB's *derived seasonally-adjusted* series, not
necessarily Eurostat's release moment; Eurostat's flash conventionally clears earlier in the CET
morning, but that time is **not sourced here** and is therefore not used. Eurostat's own release
calendar page carries no dated entries (the proposal recorded the same on 09-09), and
`ec.europa.eu/eurostat/news/euro-indicators` lists only past releases. Either way the print clears
before the US cash open. **The forecast is a model, not a forecast anyone else made:** no
September euro-area consensus was findable at D-23, so leg 5's bands are this session's own
arithmetic on Eurostat's published base and a crude assumption for September energy — they carry the
±0.1pp press-vs-database wedge from leg 6 *plus* their modelling error, which is why the forward
tests are written as inequalities rather than point estimates. **The weights are the sibling's
implied ones** (energy 9.1%, services 47.0%, NEIG 25.6%, food 19.2%), derived from published
rate/contribution pairs rather than Eurostat's weight table — `prc_hicp_inw` is frozen at 2025 and
was not usable for 2026. **Two fetch failures are logged in `probe-ref.blocked`:** a 404 on a guessed
ECB calendar slug (the correct path was then fetched successfully) and an empty return from the
discontinued `prc_hicp_midx` dataset (the replacement `prc_hicp_minr` was used). **VIX is a close,
not an intraday read:** 15.72 at the 2026-09-08 session close from the chart endpoint, matching what
[`cpi-2026-09-11`](cpi-2026-09-11.md) recorded the same day. **The shutdown branch is an `estimate`
resting on another `estimate`** — `government-funding-deadline-2026-09-30` is itself estimate-status,
so leg 4 widens caution and licenses nothing, twice over. Finally, the date stays **estimate**
despite two agreeing primaries, per this lane's no-self-confirm limit.

## Stance & kill switches

**Stance (date `estimate`):** **stand aside on the print, and treat the date correction as the
deliverable.** The release is **2026-10-02**, not the 10-01 this event's id says — two primaries
agree, and the proposal's month-end derivation is refuted. That one day matters three ways: it puts
the flash on **US payrolls day**; it puts it in **day two of a possible funding lapse** that would
delete those payrolls while Eurostat publishes anyway; and it confirms the flash sits **inside** the
window informing [`ecb-decision-2026-10-29`](ecb-decision-2026-10-29.md), which is what separates it
from its receipt-shaped sibling. `symbols: []`, no rates-keyed playbook, **no position, no play**.
The document's substantive commitments are **analytical**: it publishes the print's expected shape
three weeks early — **headline ≈3.6% (3.4–3.8%)** on **energy ≈18%** against a **−0.1%** base, with
**core ≈2.3–2.4%** and **services ≈2.9%** — so 10-02 either confirms an already-computed shape or
reveals that the energy-hot / core-tame reading two sibling ledgers depend on has broken. Estimates
widen caution and license nothing.

**Kill switches:**

- **Date kill (registered):** the flash publishing on any date other than **2026-10-02**. The
  "Next release" + ECB-calendar convention this calendar now relies on monthly would be unreliable,
  and every future Eurostat entry gets re-derived. **FT-eurostat-hicp-flash-2026-10-01-1**, score by
  **2026-10-05**.
- **Level kill (registered):** headline printing **≤3.2%**, or energy y/y **<15.0%**. The base-effect
  arithmetic in leg 5 loses, and the "energy is still accelerating" premise shared with
  [`cpi-2026-09-11`](cpi-2026-09-11.md) needs re-argument. **FT-…-2**, score by **2026-10-05**.
- **Shape kill (registered):** core **≥2.6%** or services **≥3.2%**. This is the consequential one
  and it does not kill *this* stance — it kills the *sibling* readings, because the decelerating-core-
  under-an-energy-headline shape is what [`ecb-decision-2026-10-29`](ecb-decision-2026-10-29.md)
  inherits and what the euro leg of [`cpi-2026-10-14`](cpi-2026-10-14.md)'s read-across leans on.
  **FT-…-3**, score by **2026-10-05**, and the change gets written **there**, not here.
- **Channel kill (the one that would rebuild this doc):** a tracked name (NVDA/AVGO/MRVL/CRWV) moving
  **>1%** in the **05:00–09:30 ET** window on **2026-10-02** in a way the tape attributes to this
  release. Leg 7's "no price channel" claim would be false. Score by **2026-10-05**.
- **Branch kill:** a CR or full-year appropriation enacted on or before **2026-09-30**, or BLS
  publishing the Employment Situation on 10-02 regardless. Leg 4's shutdown branch closes and the
  entry drops back to plain calendar visibility. Re-check at close-out.
- **Tier kill:** the 10-02 flash moving 10Y Bund **>5bp** in its own publication hour, or the ECB
  citing it by name on **10-29**. A euro flash would be a policy event in its own right and `low` is
  wrong. Re-check at close-out.

Three forward tests registered in
[`forward-tests/eurostat-hicp-flash-2026-10-01.md`](../forward-tests/eurostat-hicp-flash-2026-10-01.md)
— **-1** (the date convention), **-2** (headline and energy) and **-3** (the core/services shape).
All three are scoreable from the 10-02 release document alone, deliberately: **-1** tests a
*process* claim this calendar will reuse every month, and **-2/-3** test whether Eurostat's published
base makes the print computable in advance rather than whether the analyst was lucky. No
market-shaped test is registered, because the stance takes no position and this book has no
instrument that would price one.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-09 | D-23 | Initial research banked (above); **canonical `src/domain/market-events/eurostat-hicp-flash-2026-10-01.json` written this PR** over the single proposal `…from-cpi-2026-09-11.json`, read first per EVENT-RESEARCH.md and now shadowed. **Headline finding: the date was wrong and is corrected to 2026-10-02.** The proposal derived 10-01 from a two-of-three month-end pattern and asked the researcher to verify first; two primaries fetched today say **10-02** — Eurostat's own August flash (`2-01092026-ap`) carries **"Next release: 2 October 2026"** (the same field read **"Next release: 31 July 2026"** on the June flash and was correct), and the **ECB statistics calendar** lists **"02/10/2026 15:00 CET — … HICP flash estimate … Reference period: Sep-2026"**, cross-checked by its **17/09/2026** row matching Eurostat's own "17 September 2026" sentence. The pattern is **refuted, not refined** — the flash is scheduled, not month-end arithmetic. **The id slug keeps the stale 10-01** (validator keys file↔id, never id↔date; renaming would strand the ledger/fragment/branch and unshadow the proposal) — first such mismatch in the calendar, flagged in three places. **Why this is not the sibling's receipt:** 10-02 precedes `ecb-decision-2026-10-29` by 27d and `ecb-quiet-period-start-2026-10-21` by 19d, so with the 10-16 complete it is one of only **two** euro inflation reads between the two ECB meetings. **The adjacency that matters is American:** 10-02 is `jobs-2026-10-02` (confirmed, high) and day two of a possible lapse — `government-funding-deadline-2026-09-30` says an un-averted lapse **removes** those payrolls, and Eurostat publishes anyway; bounded hard, since euro CPI carries no US labour information, only the shared energy shock. **The print was precomputed from Eurostat's own API** (`prc_hicp_minr`/`prc_hicp_mmor`, EA20): Sep-2025 base m/m energy **−0.1**, services **−0.9**, core **+0.1**, NEIG **+2.2**, all-items **+0.1**; 2026 energy m/m **+2.7 → +2.9**; so headline **≈3.6% (3.4–3.8)**, energy **≈18% (16.6–18.9)**, core **2.2–2.5**, services **2.7–3.1** — services is the high-variance cell because its base is a large negative. **Measurement trap found:** Eurostat's database rates run up to **0.1pp below** its own press releases (Jun 2.7 vs 2.8, Aug 3.2 vs 3.3) because the API computes from two-decimal indices — all bands are stated on the press-release convention and scored from the document. **Adjacency sweep — peers:** none, `symbols: []`. **Macro:** no euro print since the 09-01 flash; live corridor is ECB 09-10 (~99% priced +25bp per sibling rows), US CPI 09-11, FOMC 09-16. **Volatility:** VIX **15.72** at the 09-08 close; no prior probe-ref — this row establishes the baseline. **Geopolitical:** the energy shock is the whole of the acceleration — Brent **$99.33** (09-08, +13% m/m, cycle high) per `cpi-2026-09-11`. **Event tape:** **41 adjacent ids** inside 10-02 ±5d recorded in `probe-ref`, including PCE 09-30, ISM 10-01, ISM services 10-05 and OPEC+ 10-04. **No new dated event proposed** — every adjacency found is already tracked; the 10-16 September complete and 11-04 October flash sit outside the ±5d corridor and are named in the watch list rather than filed. **Three forward tests registered** (-1 date convention, -2 headline/energy, -3 core/services shape), all scoreable from the 10-02 document. **Tier held at `low` with reasons recorded** so it is not re-litigated: at low/D-23 the band is 30d, so this is the only pulse before close-out, and `medium` would buy three sessions that would re-read corridors other ledgers already own. | — (stance set: stand aside, no position, no play; three commitments — the corrected date, the precomputed shape, and the attribution boundary on payrolls day) | 2026-10-09 (low, 15+d band: every 30d) — in practice the close-out on/after 2026-10-02 arrives first |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-eurostat-hicp-flash-2026-10-01.json`
(`status: "estimate"`) in the same PR — your own file, never another event's canonical one (#1717).
Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from
memory — after which this doc goes quiet.
