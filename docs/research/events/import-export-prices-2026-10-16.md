# U.S. Import and Export Price Indexes (Sep 2026 data) — import-export-prices-2026-10-16

**Kind:** macro-print · **Date:** 2026-10-16 (confirmed, BLS: bls.gov/schedule/news_release/ximpim.htm ("September 2026 | Oct. 16, 2026 | 08:30 AM") + bls.gov/schedule/2026/10_sched.htm ("U.S. Import and Export Price Indexes / September 2026 / 08:30 AM", Friday the 16th), both fetched direct 2026-08-31) · **Impact:** low
**Last assessed:** 2026-08-31
<!-- probe-ref: {"symbols":{},"vix":14.43,"daysBand":"low:15+","adjacentIds":["cpi-2026-10-14","ppi-2026-10-15","opex-2026-10-16","fomc-blackout-start-2026-10-17"],"screenStreak":0} -->

## At a glance

**TL;DR.** Stand aside — and expect this print to say "import inflation accelerated again" **even if
pass-through stopped dead**. The 12-month base month here is September 2025 at nonfuel index
**129.8**, *below* July 2025's 130.0, so a completely flat Aug–Sep 2026 still prints **+4.6% y/y**
against July's published **+4.5%**. The acceleration headline is partly arithmetic, and reading it as
fresh tariff pass-through is the trap. Two corrections to the sibling ledger this event was
discovered by. First, **a funding lapse delays this print, it does not delete it** — BLS's own
shutdown Q&A says so in one sentence ("Were September 2025 data affected? **No.**… Publication of
September data was delayed by more than a month"), because the September reference month is collected
*before* an October 1 lapse; the destroy-class outcome belongs to the October reference month, not
this one. Second, [`import-export-prices-2026-11-17`](import-export-prices-2026-11-17.md)'s kill
switch keyed to this date — nonfuel y/y falling below 4.0% — is **near-mechanically unreachable**: it
needs a **−0.59%** two-month move in a series whose worst two-month move since 2023 is −0.544%. Date
is now **confirmed** (two BLS primaries fetched direct). The tier stays **low** and I decline to raise
it: this print is the last BLS price release the **10-28 FOMC** sees and the last before the blackout
gate falls, but calendar position is not a transmission channel — these indexes deflate GDP net
trade, not PCE. Nothing here is a trade.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-46) | **Stand aside** | High | `symbols: []`, D-46, no September-data consensus exists, and no house playbook is macro-keyed | Nothing dated today; the read is reassessed, not traded |
| This week | **Watch the CR floor math, not the tape** | High | A lapse on **10-01** reroutes this print by ~6 weeks; the House (Dec 4) and Senate (Dec 11) CR texts still differ | A single CR signed before **2026-09-30**, which retires the delay branch outright |
| This month | **Read the 2026-09-16 print (Aug data) as the real first test — not this one** | Medium | Aug data needs only **+0.37% m/m** to cross 5.0% y/y, the highest since May 2022; the "record" headline likely lands a month *before* this event | The **2026-09-16** release printing nonfuel y/y **below 4.6%**, which would mean the base effect is not carrying the rate the way this doc's arithmetic says |
| This quarter | **Discount the y/y; the m/m and the China locality index are the only clean pass-through reads** | Medium | The 12-month rate is flattered by a declining 2025 base, and fuel's roll-off is separately distorting the headline | Nonfuel **m/m** printing at or below **+0.1%** for both Aug and Sep 2026, which would end the seven-month acceleration this doc is built on |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** initiate on this print: `symbols: []`, `low` tier, no macro-keyed house playbook (S1/S2/E1/S3/S4 + G1 are symbol/earnings-keyed).
- **The base-effect caution (dated, mechanical).** Sep-2025 nonfuel base is **129.8**; a flat Aug–Sep 2026 prints **+4.62%** y/y, above July's +4.46%. Acceleration in the y/y is not by itself evidence of new pass-through.
- **The delay-vs-destroy rule (dated).** No CR by **2026-09-30** → expect this release **delayed ~47 days** (the measured Sep-2025 analogue: Oct 17 → Dec 3), *not* cancelled. The data is already collected by then.
- **The inversion to remember.** Import prices **exclude duties** → a *rising* index means foreign exporters are raising pre-tariff prices, so US buyers pay the duty on top of a rising base. Hawkish, not neutral.
- **The threshold that is actually reachable (estimate).** Nonfuel y/y **≥ 5.0%** needs just **+0.18%/mo** over two months, well inside the +0.371%/mo three-month pace — it is the base case here, not a tail.
- **The corridor (dated).** Columbus Day **10-12** (bonds closed, equities open) · CPI **10-14** · PPI **10-15** · **this print 10-16, 08:30 ET** + monthly opex **10-16** · FOMC blackout begins **10-17** · FOMC **10-28** · PCE **10-29**.
- **Most exposed if it moves anything** — an inherited, estimate-labeled duration ranking, not measured per-symbol: CRWV, then NVDA/AVGO/MRVL, then the mega-caps. AMZN is the one name with a direct channel (imported goods cost, import air freight).

## Initial research

### The question

Will the September-2026 U.S. Import and Export Price Indexes publish on 2026-10-16, what will they
show, and — landing 08:30 ET on monthly opex morning, the day after PPI, and as the last BLS price
release before both the FOMC blackout and the 10-28 meeting — does a `low`-tier trade-price release
carry any signal for our nine tracked AI-infra / mega-cap names?

### One-line verdict

The date is confirmed and the tier is correctly `low`, but this print's headline 12-month number is
**mechanically biased upward by a declining year-ago base**, which means the most likely outcome is a
"highest since 2022" acceleration story that overstates how much new tariff pass-through actually
occurred in August and September.

### Method

Sourced web research per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) (macro-print mode —
no price instruments exist for this kind). Four BLS primaries fetched **direct** this session: the
import/export release schedule, the October-2026 monthly schedule, the current news release
(USDL-26-1410, July 2026 data), and the MXP shutdown notice. All 403 to plain fetchers, to WebFetch
and to a browser-header set alone; adding `Referer: https://www.bls.gov/` with
`Sec-Fetch-Site: same-origin` and `--compressed` returns 200 — a sharper recipe than the
[`import-export-prices-2026-11-17`](import-export-prices-2026-11-17.md) session recorded, and worth
carrying forward. Index levels and every percent change in this doc were computed from the **BLS
public data API** (`api.bls.gov/publicAPI/v1`, series `EIUIR`, `EIUIQ`, `EIUIREXFUELS`, 2020–2026)
rather than inherited from the sibling ledger — the sibling's figures were re-derived and all agreed.
Market levels are Yahoo daily closes via the same probe helper `event-material-scan.mjs` uses.
Regime context (Warsh, the CR) is inherited from the sibling ledgers and re-checked.

### Leg 1 — the date. SUPPORTED, and flipped `estimate` → `confirmed` this session.

Two independent BLS views agree. The by-release schedule
(`bls.gov/schedule/news_release/ximpim.htm`) reads "September 2026 | **Oct. 16, 2026** | 08:30 AM",
and the by-month October schedule (`bls.gov/schedule/2026/10_sched.htm`) puts "U.S. Import and Export
Price Indexes / September 2026 / 08:30 AM" on **Friday the 16th**. The entry was filed `estimate` on
08-31 by the sibling session that discovered it, purely because the lane forbids an adjacency sweep
from confirming the event it just found; this is that event's own research session with both
primaries in hand — the exact condition the hard limit names. Promoted with a `BLS:` prefix.

The same fetch also pins the release rhythm and the one date that matters more than this event's own:
Aug-2026 data → **Sep 16** · Sep-2026 data → **Oct 16** · Oct-2026 data → Nov 17 · Nov-2026 data →
Dec 17. The **2026-09-16** print is not currently on this calendar and is proposed in this PR.

### Leg 2 — THE material finding: the base declines, so the y/y rises on its own. SUPPORTED (BLS public API, computed).

The sibling ledger concluded that the 2025 base was flat, so "the 12-month rate tracks incoming
monthlies close to one-for-one — no mechanical wedge to anticipate." **For this print that is not
quite right, and the direction of the error matters.** The nonfuel index (`EIUIREXFUELS`) ran:

| 2025 month | Level | Role |
|---|---|---|
| July | **130.0** | base for the *last published* y/y (+4.46%) |
| August | **129.8** | base for the **2026-09-16** print |
| **September** | **129.8** | **base for THIS print** |

The base **falls 0.15%** between the July comparison and this one. Running the three paths forward
from July 2026's 135.8 against a 129.8 base:

| Aug–Sep 2026 pace | Sep 2026 level | Implied nonfuel 12-mo |
|---|---|---|
| **0.00%/mo (flat)** | 135.80 | **+4.62%** |
| +0.371%/mo (last 3 months' average) | 136.81 | **+5.40%** |
| +0.513%/mo (2026 six-month average) | 137.20 | **+5.70%** |

The flat path — **zero further pass-through** — still prints a *higher* y/y than July's published
+4.46%. So the acceleration narrative is guaranteed by the base before a single September price is
collected. Central read ~**+5.2–5.4%**. This is the single most useful reading rule in the document:
at this print, **the m/m is the evidence and the y/y is partly an artifact.**

### Leg 3 — the record headline probably lands a month early, on 2026-09-16. SUPPORTED (arithmetic).

Same base, one month less. For the August-2026 reference month the required move from 135.8 is small:

| Aug 2026 pace | Level | Implied nonfuel 12-mo |
|---|---|---|
| 0.00%/mo | 135.80 | +4.62% |
| **+0.371%/mo (3-mo avg)** | 136.30 | **+5.01%** |
| +0.513%/mo (6-mo avg) | 136.50 | +5.16% |

Nonfuel import inflation has not printed **5.0%** since **May 2022 (5.95%)** — verified from the API
across 2021–2026, not asserted. At the trailing three-month pace, the **09-16 print crosses it**. The
consequence for this ledger is a scheduling one and it is the reason the "this month" call points
away from this event: by the time 10-16 arrives, the "highest since 2022" story will most likely
already be a month old, and this print is the **confirmation**, not the reveal.

### Leg 4 — the acceleration itself is real and is seven months long. SUPPORTED (BLS primary + API).

From the current release (USDL-26-1410, published 2026-08-18, fetched today):

| Measure | Jul 2026 m/m | 12-mo (Jul 25 → Jul 26) |
|---|---|---|
| All imports | −0.4% | +5.9% |
| Fuel imports | −7.2% | +25.2% |
| **Nonfuel imports** | **+0.4%** | **+4.5%** |
| All exports | −1.3% | +8.2% |
| Nonagricultural exports | −1.5% | +8.5% |

BLS's own wording on the nonfuel line: "the largest over-the-year advance since the index increased
4.6 percent for the year ended June 2022." The monthly path computed from `EIUIREXFUELS` — **1.46 →
2.15 → 2.46 → 3.07 → 3.76 → 4.24 → 4.46** for January through July 2026 — is **seven consecutive
months of acceleration**, off a base that ran 0.3–1.7% through 2025.

Read against the duty-exclusion methodology (Leg 5), that is a series saying exporters are **not**
absorbing. The corroborating locality detail, verified in the release text rather than inherited:
import prices **from China +0.8% m/m**, which BLS calls "the largest monthly increase since the price
index rose 0.8 percent in July 2008" (+2.7% over 12 months), and the **US–China terms-of-trade index
−1.3%** in July, driven by exactly that combination of higher import prices from China and lower
export prices to China.

Two cost lines worth carrying for our own book: import **capital goods +0.9%**, led by "computers,
peripherals and semiconductors" — the AI-infra input — and, in services, import **air freight −2.2%
m/m** in July (the sibling's +23.4% is the 12-month figure; the monthly turned negative, a detail
worth having before quoting the annual number at AMZN).

### Leg 5 — the interpretive key: these indexes exclude duties, which inverts the naive read. SUPPORTED (inherited, BLS primary).

Carried from the sibling ledger and not re-litigated, because it is methodology rather than a market
read. BLS's *Beyond the Numbers* study "How tariffs relate to BLS import and export price indexes"
(Camp, vol. 9 no. 6, May 2020) states: "Tariffs are not included in the prices used to calculate the
U.S. Import and Export Price Indexes." The reason is national-accounts consistency — these indexes
deflate the net-trade component of GDP, and taxes are not part of net trade. The consequence:

| What the index does | What it actually means |
|---|---|
| **Falls** after a tariff | Foreign exporters cut pre-duty prices — they are **absorbing** the tax |
| **Flat** | Neither side moved the pre-duty price; the buyer eats the whole duty |
| **Rises** | Exporters are **raising** pre-duty prices — the buyer pays duty **on top of a rising base** |

So a rising nonfuel import index during a tariff regime is a hawkish goods-pass-through datapoint,
and it is the opposite of what "import prices up" suggests to a general reader.

### Leg 6 — a lapse DELAYS this print. It does not delete it. SUPPORTED (BLS primary, and it corrects the sibling).

The sibling ledger's signal condition reads: "for this series a lapse **destroys data**, it does not
delay it." That is true of the **October** reference month and **false of this one**, and BLS answers
it directly in the MXP shutdown notice (`mxp/notices/2026/…-impact-mxpi.htm`, fetched today):

> "**Were September 2025 data affected? No.** Collection of U.S. Import and Export Price Index data
> for September 2025 had been completed in accordance with our normal schedule prior to the federal
> government shutdown. **Publication of September data was delayed by more than a month (from October
> 17 to December 3)** because of the shutdown."

The rule that generates both outcomes is the **collection window**, not the release date. September
data is collected in September; October data is collected in October. So:

| Reference month | Collection window vs a 10-01 lapse | 2025 measured outcome |
|---|---|---|
| **September (this print)** | **completed before** the lapse | **delayed 47 days** — data intact |
| October (the 11-17 print) | falls inside the lapse | **cancelled**, 864 of 1,625 indexes permanently suppressed |

Applied to 2026: no CR by **2026-09-30** → this release most likely slips roughly six weeks to **early
December**, arriving *after* the 10-28 FOMC and plausibly after the 11-17 print it precedes — an
inverted release order, not a hole. The distinction is worth keeping straight because the two branches
call for opposite handling: a delayed print is still scoreable later, a destroyed one never is.

Funding status, carried and re-checked (`NEWS:`-grade): House passed a clean CR to **Dec 4**, 220–205
on 07-21; Senate passed its own to **Dec 11**, 90–6 on 08-08; the House took up the Senate text on
08-31. Base case is that a lapse is averted; the branch is live and nothing is signed.

### Leg 7 — the sibling's kill switch keyed to this date is unreachable as written. SUPPORTED (computed).

[`import-export-prices-2026-11-17`](import-export-prices-2026-11-17.md) says its pass-through read
"dies if the **2026-10-16** print shows nonfuel import y/y **falling below ~4.0%**." Against a 129.8
base, sub-4.0% requires a Sep-2026 level of **≤134.99** — a **−0.59%** move over two months from
135.8. Measured from the API, the **worst two-month cumulative nonfuel move since 2023 is −0.544%**
(Feb→Apr 2023), and the worst single month in the last three years is −0.307% (June 2025). So the
threshold sits outside the series' realised range and would be cleared only by an event that broke
the series' behaviour entirely.

A falsifier that cannot fire is not a falsifier — it is a stance with a decoration. The honest
replacement, and the one this ledger registers, keys on the **m/m** (the part that carries evidence)
rather than the base-inflated y/y: **nonfuel m/m at or below +0.1% for both August and September
2026** ends the seven-month acceleration. That is inside the realised range — August 2025 printed
−0.2% and September 2025 printed 0.0% — so it can actually happen.

### Leg 8 — the dollar is a headwind here, and a sharper one than at the sibling print. SUPPORTED (measured this session).

The standard objection to any import-price move is currency, and it does not survive. DXY monthly
closes (Yahoo `DX-Y.NYB`): **Sep 2025 97.77** — this print's base month — against **99.70** (Aug 2026
close) and 99.59 intraday 08-31. The dollar is roughly **2.0% stronger** than the base month, which
*depresses* dollar-denominated import prices. The nonfuel rise happened against an FX headwind. Note
this is a **firmer** version of the sibling's leg, whose Oct-2025 base (99.80) was flat rather than
weaker. Caveat stated: DXY is a six-currency basket and most US imports are invoiced in dollars, so
this eliminates FX as the *primary* driver rather than measuring an elasticity.

### Leg 9 — headline and nonfuel converge, but the fuel path is two-sided. MIXED.

A divergence the sibling did not surface: **all-imports 12-month inflation has already peaked and is
rolling over while nonfuel accelerates.** Computed from `EIUIR`: **6.81% (May) → 6.68% (Jun) → 5.95%
(Jul)**, against nonfuel's 3.76 → 4.24 → 4.46 over the same three months. The gap has closed from
3.05pp to 1.49pp, entirely because fuel is falling (−3.8% then −7.2% m/m).

Extending to this print's reference month, from 149.6 against a 140.8 base:

| Aug–Sep 2026 all-imports pace | Level | Implied 12-mo |
|---|---|---|
| flat | 149.60 | +6.25% |
| −0.333%/mo (last 2 months' average) | 148.61 | **+5.54%** |
| −0.60%/mo (fuel keeps falling) | 147.81 | +4.98% |

On the middle path the headline (~5.5%) and nonfuel (~5.4%) essentially **converge** — the first time
this cycle the headline is not flattered by fuel. Graded **MIXED** rather than supported, deliberately:
the convergence is entirely conditional on energy, and energy is currently pointing the other way.
Brent is **$90.24** and WTI **$85.27** (08-31), with the calendar's own
[FT-26](../forward-tests.md) row recording Brent down >5% on the week to 08-28 on the Iran–Oman
corridor framework and then up ~1.7% on the 08-30 Larak strike. A Hormuz escalation reverses the fuel
roll-off and re-opens the gap. **Nonfuel is the signal; the headline is an energy bet wearing an
inflation label.**

### Leg 10 — calendar position is not a channel: `low` is correct and stays. SUPPORTED (structural).

This print occupies the most conspicuous slot the series will have all year, and it still does not
earn a tier upgrade — which is worth stating explicitly, because the temptation runs the other way.
The position:

- It is the **third morning of the 10-14 → 10-16 corridor** [`ppi-2026-10-15`](ppi-2026-10-15.md)
  already names (CPI → PPI → this), and it lands **on monthly opex** (`opex-2026-10-16`), unlike the
  11-17 sibling which sat three sessions clear of expiry.
- It is the **last BLS price release the 10-28 FOMC sees** — `pce-2026-10-29` publishes the morning
  *after* the statement, and nothing price-related is tracked between 10-16 and the meeting.
- It is the **last release before the communications blackout**, which by the Fed's own rule (blackout
  begins 12:00 a.m. ET the second Saturday before a meeting) starts **Saturday 2026-10-17** for the
  Oct 27–28 meeting. Proposed as a calendar entry in this PR.

None of that is transmission. BLS states these indexes' role plainly — deflating the **net-trade
component of GDP** — so there is no channel into PCE and no path into the FOMC's inflation picture,
which closes on CPI 10-14 / PPI 10-15 regardless. The real destination is real net exports in Q4 GDP,
whose advance estimate lands in late January 2027. **Being last in the queue is not the same as being
load-bearing**, and `low` should stay.

### Leg 11 — which tracked names carry the sensitivity. Inherited, estimate-labeled.

`symbols: []` — market-wide, so the ranking is the same duration-reasoned one the CPI/PPI/FOMC
siblings carry, not measured per-symbol: **CRWV** most exposed, then **NVDA / AVGO / MRVL**, then
**MSFT / GOOG / META**, then **AAPL / AMZN**. On this print's own narrow terms **AMZN** is the one
tracked name with a direct line item (imported goods cost and air freight), and import **capital
goods +0.9%** — computers, peripherals and semiconductors — is the AI-infra build cost. Cost-curve
observations, not trades.

### What the conditions support

Nothing directional. No house playbook is macro-keyed
([`multi-symbol-sweep.md`](../multi-symbol-sweep.md): S2 and E1 were the only universal survivors),
and this is a `low`-tier print with no channel to the decision downstream of it. What travels is S2's
*shape* applied to the **10-14 → 10-16** corridor, which this print closes and which now carries an
opex expiry on its final morning. The deliverable content is four subtractions from what a reader
would otherwise assume: **the y/y will overstate pass-through** because the base declines (Leg 2);
**the record headline probably prints on 09-16, not here** (Leg 3); **a lapse delays this one rather
than destroying it**, inverting the sibling's rule for this reference month (Leg 6); and **the
sibling's falsifier for this date cannot fire** and has been replaced with one that can (Leg 7). Two
calendar entries are proposed in the same PR.

### Honest limits

- **No September-data consensus, whisper or implied move exists at D-46**, and none will until
  October. A fact about the calendar, not a research gap.
- **Legs 2, 3, 7 and 9 are arithmetic, testing direction rather than levels.** They assume no revision
  to the July level and no methodology change; `EIUIR` has already revised April, May and June 2026.
- **Leg 6's 2026 projection is an analogy from one measured 2025 episode**, not a BLS commitment about
  a future lapse; only the collection-window mechanism and the 47-day 2025 outcome are primary-sourced.
- **Leg 8 eliminates FX as a primary driver; it does not measure an elasticity.**
- **Leg 9's convergence is conditional on fuel** and the energy tape is currently two-sided.
- **The reaction function is asserted structurally, never measured.** No event study of import-price
  release days exists in this repo, and this series has never been tracked through a print here.
- **The 2026 tariff architecture** (SCOTUS/IEEPA, Section 122 → 301) remains unverified `NEWS:`-grade
  in the sibling ledger and nothing here rests on it; the September reference month is the second full
  month after the reported 07-24 transition.
- **VIX 14.43 and the equity indices are 08-28 closes** (08-31 was mid-session at fetch); DXY,
  Brent and WTI are 08-31 marks.
- **Two CPI prints, an FOMC, a funding deadline and an opex intervene** before this event, any of
  which can rewrite this doc wholesale.

## Stance & kill switches

**Stance (date `confirmed`; two BLS primaries fetched direct 2026-08-31).** No position and no
directional lean at any horizon; the tier is `low` and stays `low` despite this print holding the
last slot before the 10-28 FOMC and the blackout — position is not a channel. The deployable content
is **four reading rules**, not a trade. First, **discount the 12-month rate**: the Sep-2025 base of
129.8 is below the July base, so a flat Aug–Sep still prints **+4.62%** against July's +4.46%, and the
acceleration headline is partly arithmetic. Second, **watch 2026-09-16 instead** — the August-data
print needs only the trailing three-month pace to cross **5.0%**, the highest since May 2022, making
this event the confirmation rather than the reveal. Third, **a 10-01 lapse delays this print ~47 days,
it does not destroy it** (BLS primary; the destroy-class outcome belongs to the October reference
month), so the branch to plan for is an inverted release order, not a hole. Fourth, **read a rising
duty-exclusive index as hawkish** — buyers pay the duty on top of a rising base. Working read
(**estimate**, no consensus exists at D-46): nonfuel 12-month lands **+4.6% to +5.7%**, centred
~**+5.2–5.4%**, with the m/m carrying whatever evidence of genuine pass-through the print contains.

**Kill switches:**

- **The base-effect read is wrong if** the **2026-10-16** print shows nonfuel 12-month **below 4.5%**
  — i.e. below the last published rate despite a lower base, which would mean nonfuel prices actually
  fell over Aug–Sep. Registered as **FT-29**, scored 2026-10-17.
- **The acceleration read dies if** nonfuel **m/m** prints at or below **+0.1%** in *both* the
  **2026-09-16** (Aug data) and **2026-10-16** (Sep data) releases — the honest, reachable replacement
  for the sibling's unreachable sub-4.0% y/y trigger (Leg 7). Check on 09-16 and 10-16.
- **The early-crossing read (Leg 3) is wrong if** the **2026-09-16** print lands nonfuel y/y **below
  4.6%**, which would say the base is not carrying the rate as computed. Check on 09-16.
- **The existence branch** — no CR signed by **2026-09-30** → expect this release **delayed**, on the
  2025 analogue by ~47 days to roughly early December, arriving after the 10-28 FOMC. Retired by a CR
  or full-year bills enacted before 09-30. Check on 09-30.
- **The convergence read (Leg 9) dies if** all-imports 12-month prints **above 6.0%** at this release,
  meaning fuel re-accelerated and the headline/nonfuel gap re-opened rather than closing. Most likely
  cause would be a dated Hormuz escalation. Check on 10-16.
- **The duty-exclusive inversion (Leg 5) is methodology, not opinion** — it dies only if BLS changes
  the treatment of duties in these indexes, which would appear as an MXP notice at
  `bls.gov/mxp/notices/`. Check each pulse.
- **The tier read (Leg 10) is wrong if** this release day produces an NDX move ≥1% attributable to it
  or a >5bp front-end repricing — which would say the tape trades it as a first-tier print. Confounded
  by opex on the same date; a move would need attribution before it counted. Check on 10-16.

Registered as **FT-29** in [`forward-tests.md`](../forward-tests.md): the base-effect claim, scored
2026-10-17.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-08-31 | D-46 | Initial research banked (above). **Date flipped `estimate` → `confirmed`:** two independent BLS primaries fetched direct — `schedule/news_release/ximpim.htm` ("September 2026 \| Oct. 16, 2026 \| 08:30 AM") and `schedule/2026/10_sched.htm` (Friday the 16th, 08:30). Fetch recipe sharpened: BLS 403s to browser headers alone, but `Referer: bls.gov/` + `Sec-Fetch-Site: same-origin` + `--compressed` returns 200. **Material finding — the base DECLINES, so the y/y rises unaided:** nonfuel `EIUIREXFUELS` base runs Jul-2025 **130.0** → Aug **129.8** → **Sep 129.8**, so a flat Aug–Sep 2026 prints **+4.62%** vs July's published **+4.46%**. Paths from 135.8: flat **+4.62%**, 3-mo pace (+0.371%/mo) **+5.40%**, 6-mo pace (+0.513%/mo) **+5.70%**; central **+5.2–5.4%**. The acceleration headline is partly arithmetic — **the m/m is the evidence, the y/y is partly artifact**. All figures recomputed from the BLS public API, not inherited; the sibling's numbers all reconciled. **Second finding — a lapse DELAYS this print, correcting the sibling's blanket rule:** BLS MXP notice verbatim, "Were September 2025 data affected? **No.**… Publication of September data was delayed by more than a month (from October 17 to December 3)." The collection window, not the release date, sets destroy-vs-delay — Sep data is collected pre-lapse, Oct data is not. A 10-01 lapse → this print slips ~47 days to ~early December, *after* the 10-28 FOMC and plausibly after the 11-17 print: an inverted order, not a hole. **Third — the sibling's kill switch keyed to this date cannot fire:** sub-4.0% y/y needs level ≤134.99, a **−0.59%** two-month move; worst two-month nonfuel move since 2023 is **−0.544%** (Feb→Apr 2023), worst single month −0.307% (Jun 2025). Replaced with a reachable m/m trigger (≤+0.1% in both Aug and Sep). **Fourth — the record probably prints a month early:** Aug-2026 data at the 3-mo pace gives **+5.01%**, first ≥5.0% since **May 2022 (5.95%)**, so **09-16** is the reveal and 10-16 the confirmation. **Adjacency sweep.** *Peers:* n/a (`symbols: []`); AMZN the one direct channel — note import air freight was **−2.2% m/m** in July (the sibling's +23.4% is the 12-month), and import capital goods **+0.9%** (computers/peripherals/semis) is the AI-infra cost line. *Macro:* Warsh's 08-28 Jackson Hole keynote is the standing regime, Sep hike odds ~57.5% (CME FedWatch, carried); CPI 10-14 and PPI 10-15 close the FOMC's inflation picture before this print. *Vol:* **VIX 14.43** (08-28 close), SPX 7711.76, NDX 29433.43, 10Y **4.72%** — baseline set, nothing to diff against yet. *Geopolitical/energy:* Brent **$90.24**, WTI **$85.27** (08-31); all-imports y/y has already peaked and is rolling over (**6.81 May → 6.68 Jun → 5.95 Jul**) while nonfuel accelerates, so headline and nonfuel converge ~5.5% on the middle path — but graded MIXED, since Hormuz risk re-opens the gap. *FX:* DXY base month **Sep-2025 97.77** vs **99.70** (Aug-2026 close) — the dollar is ~**2.0% stronger**, a headwind; a firmer version of the sibling's leg, whose Oct-2025 base was flat. *Policy:* the 2026 tariff architecture stays unverified `NEWS:`-grade and nothing rests on it; Sep-2026 is the second full month after the reported 07-24 Section 122→301 transition. *Existence risk:* FY2027 deadline **09-30**; House CR to Dec 4 (220–205, 07-21), Senate CR to Dec 11 (90–6, 08-08), House took up the Senate text 08-31. *Event tape:* no September-data consensus or whisper at D-46 (checked, not asserted). **Two dated adjacencies found and proposed same-PR as `estimate`:** **`import-export-prices-2026-09-16`** (Aug-2026 data, 08:30 ET — read off the same BLS primary; lands on FOMC decision morning and is the first real test of this doc's central claim) and **`fomc-blackout-start-2026-10-17`** (derived from the Fed's own blackout rule — second Saturday before the confirmed Oct 27–28 meeting — making this print the last release before the gate falls). Also read off the October primary but **not** proposed, as outside the 5-day corridor: State Employment 10-20, Usual Weekly Earnings Q3 10-21, Metro Area Employment 10-28, Consumer Expenditures 10-29, **Employment Cost Index Q3 10-30**. Calendar note carried: **Columbus Day 10-12**, bonds closed / equities open. **Flagged for a human, not actioned:** `forward-tests.md` still carries **three FT-25 rows, two FT-26 and two FT-27** from parallel matrix legs registering on the same day — an append-only ledger with non-unique ids. This session used **FT-29** and is exposed to the same collision; **third independent sighting**, and it now has a concrete cost (a scored row cannot be matched to its ledger). Worth a `/retro`, out of scope here. | — (stance set) | 2026-09-30 (low, 15+d band: every 30d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed to `market-events.ts` as an `estimate` in
the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first),
never from memory — after which this doc goes quiet.
