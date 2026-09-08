# ISM Manufacturing PMI (Oct 2026 data) — ism-manufacturing-2026-11-02

**Kind:** macro-print · **Date:** 2026-11-02 (estimate, EST: ISM first-business-day cadence at 10:00 ET — ismworld.org's ROB calendar re-fetched direct 2026-08-31 and still 302s to ecommerce.ismworld.org/SSO/Login.aspx) · **Impact:** high
**Last assessed:** 2026-09-08
<!-- probe-ref: {"symbols":{},"vix":15.44,"daysBand":"high:21+","adjacentIds":["adp-employment-2026-11-04","advance-economic-indicators-2026-10-28","boj-decision-2026-10-30","boj-minutes-2026-11-05","chicago-pmi-2026-10-30","construction-spending-2026-11-02","ecb-decision-2026-10-29","eci-q3-2026-10-30","fomc-2026-10-28","gdp-q3-2026-advance-2026-10-29","housing-vacancies-q3-2026-10-28","intl-trade-full-report-2026-11-04","ism-services-2026-11-04","jobs-2026-11-06","jolts-2026-11-03","m3-full-report-2026-11-03","midterm-elections-2026-11-03","pce-2026-10-29","productivity-costs-q3-2026-11-05","sloos-2026-11-02","treasury-2y-frn-2026-10-28","treasury-7y-note-2026-10-29","treasury-borrowing-estimates-2026-11-02","treasury-buyback-10y20y-2026-11-04","treasury-refunding-2026-11-04"],"screenStreak":0,"blocked":[{"url":"https://cdn.cboe.com/api/global/delayed_quotes/futures/VX.json","status":403,"at":"2026-09-08"},{"url":"https://cdn.cboe.com/api/global/delayed_quotes/term_structure/_VIX.json","status":403,"at":"2026-09-08"},{"url":"https://www.congress.gov/bill/119th-congress/house-bill/6500/all-actions","status":403,"at":"2026-09-08"},{"url":"https://www.pmi.spglobal.com/Public/Home/PressRelease/d52074988b4f4367a787ba833e23b5c6","status":"200-js-shell","at":"2026-09-08"},{"url":"https://www.atlantafed.org/-/media/documents/cqer/researchcq/gdpnow/GDPNowcastDataReleaseDates.xlsx","status":"200-bot-challenge","at":"2026-09-08"}]} -->

## At a glance

**TL;DR.** **Stand aside — and the 2026-09-08 pulse dismantled two of the three reasons this doc
gave for it, then found better ones.** The call never moves; the *arguments* do, and both
corrections are this session's own measurements, not carried claims. **(1) The bond leg is gone as
a bond leg.** Initial research led on "TLT fell on **all 8** release days, p = 0.007." Re-run here on
nine releases through the 09-01 print: **raw 0/9** (mean −0.544%) but **dividend-adjusted 3/9**
(mean −0.209%, p = **0.29**). TLT distributes monthly and goes ex on the first business day — which
*is* the ISM release day. The streak was the distribution schedule. On the magnitude frame the
[12-01 sibling](ism-manufacturing-2026-12-01.md) established over 11 years, 2026 gives TLT **2/9**
above its own p78 against **22% by construction** — the base rate exactly. **(2) The election-premium
number was wrong by an order of magnitude, and on the wrong contract.** Initial research read spot
VIX ~4.4 points under "the November future, expiring 11-18, spanning both days." From CBOE's own
settlement file (fetched this session, five dates): the spot-to-November spread is **4.24** points
(09-04) and is almost entirely ordinary contango — November's curvature above its neighbours is
**+0.21** and *decaying*, while **October's is +0.62 and has risen on every observation**. The
mechanism explains it: a VX future settles to the VIX index at expiry, and VIX looks 30 days
*forward* — so the October contract (expiry 10-21, window **10-21 → 11-20**) is the one whose
settlement contains 11-02 and 11-03. November's window (11-18 → 12-18) is entirely *after* the
election. The identifiable election premium is ~**0.6** vol points in October, not ~4.4 in November.
**(3) The doc's one high-weight conditional is dead.** H.R. 6500 was **signed 2026-09-02**
(PL 119-103, funding to **12-11**), so October is funded, **11-06 payrolls will print**, and this is
not the only October data the country has on election morning. What survives: the sequence fact
(last hard national activity read before the vote), and a corridor that **densified 11 → 25** — this
print now shares its exact 10:00 ET slot with a *confirmed* Census release. Date is still
**estimate**, with a dated promotion path: ISM's 10-01 report names its successor.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-55) | **Stand aside** | High | `symbols: []`, an `estimate` date 55 days out, no October consensus and no Kalshi ladder in existence (`KXISMPMI` runs only through `26SEP`, checked today), and no house playbook (S1/S2/E1/S3/S4 + G1) is macro-keyed. | ismworld.org serving an ungated ROB calendar showing a November date other than **2026-11-02**; or the **2026-10-01** ISM report naming a successor date other than 11-02 |
| This week | **Watch nothing here — the next real datum is 10-01** | High | Every branch this doc carried resolved between 09-01 and 09-06: the print (54.6, miss), the CR (signed 09-02), OPEC+ (pause, 09-06). Nothing dated inside this week touches 11-02. | An October ISM consensus or a `KXISMPMI-26OCT` ladder appearing before **2026-09-15** — the event tape would be forming ~6 weeks earlier than the sibling history says it does |
| This month | **Watch crude into the October survey window, not the calendar** | Medium | WTI **83.40 (08-28) → 92.61 (09-08), +11.0%** and holding after the 09-06 OPEC+ pause. **October is the second full month inside this regime**, so it is the survey window where the Prices line can actually show it — the 10-01 sibling already raised the informative bar from ">70" to **">~73"**. | WTI closing back under **$85** before **2026-09-30** — the energy pass-through leaves the October survey window and the Prices bar reverts to ">70" |
| This quarter | **Never structure options around this print — and for the ordinary reason, not the exciting one** | Medium | Corrected here: the spot-to-November spread is **contango**, not an event premium (November curvature **+0.21**, decaying). The election's identifiable premium is **+0.62** and sits in the **October** contract. Either way you pay carry for a release whose 2026 equity reaction is the base rate (SPY 1/9 above its own p78). | **VX/V6 settling above VX/X6 on 2026-10-16** — registered as **FT-ism-manufacturing-2026-11-02-1**; an October-anchored inversion would confirm this re-attribution, and its absence refutes it |

**Signals & conditions** — the buy/sell/hold triggers:

- **No buy and no sell signal exists off this event.** `estimate`-dated, `symbols: []`, no macro-keyed playbook. Research is not action.
- **The bond leg is retired, by this doc's own re-measurement.** Raw 0/9 is TLT's monthly first-business-day distribution; adjusted 3/9 at p = 0.29 is nothing. Do not cite the old p = 0.007.
- **The equity non-reaction is the half that survived.** SPY 1/9 and QQQ 1/9 above their own 2026 p78, and the 11-year sibling study puts SPY at 23.7% vs a 22% base rate.
- **The shutdown conditional is dead** (H.R. 6500 signed 09-02, funded to 12-11). Do not re-argue this print as "the only October data."
- **Prices ≥ ~73** on the October survey (71.1 flat in August, seventh month above 70) → the crude pass-through finally shows; tightens caution on CRWV first, then the semis. Below that, ">70" is now the *expected* outcome and carries no information.
- **A sub-50 headline** on 10-01 or this print → the 2026 expansion streak breaks and this doc is re-read from the national tape, not its base rates.
- **Watch (dated):** FOMC **09-16** · **ISM mfg 10-01** (confirmed; names this print's date and opens its Kalshi ladder) · jobs **10-02** · OPEC+ **10-04** · **opex 10-16 — FT-1 scores** · **FOMC 10-28 (no SEP)** · GDP-advance + PCE **10-29** · **this print + SLOOS + construction spending + borrowing estimates, all 11-02** · **midterms 11-03** · ISM services + refunding **11-04** · jobs **11-06** · CPI **11-10** · CR expiry **12-11**.

## Initial research

### The question, plainly

What should we expect from the October 2026 ISM Manufacturing PMI on 2026-11-02, is the date right,
and — the question the two siblings left open — **does this release actually move anything**? And
given that it lands the day before the midterm elections, four days after an FOMC that carries no
SEP, and the same morning as a SLOOS, what should a paper-trading book holding long-duration tech
(NVDA MRVL AVGO CRWV MSFT GOOG META AAPL AMZN) do about it?

**One-line verdict:** the release has **no measurable equity reaction** and a **loud but
non-directional bond one** that fires whether the print is hot or cold and shares its window with a
month-turn effect — so the stand-aside is now measured rather than assumed; and what distinguishes
**this** date from every other ISM is that it is the last hard national activity read before the
election, in a window where the volatility you would have to buy is priced for the election and not
for the print.

### Method

Macro-print mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — `symbols: []`, so no
symbol-keyed instrument applies, `earnings-cycle.mjs` / `intraday-edges.mjs` were not run and the
cache-busting rule has no target. Two strands. **(a) A price measurement run this session** on
Yahoo daily closes for SPY, QQQ, TLT and ^TNX (2026-01-01 → 2026-08-28, n=165 sessions), against the
eight 2026 ISM Manufacturing release dates, with an unconditional-drift control, a one-sided
binomial test and a T−2…T+3 placebo — the technique the [SLOOS ledger](sloos-2026-11-02.md)
established for exactly this problem, applied here to the release the 10-01 sibling said could not be
measured. **(b) Sourced web research, primary-first:** ismworld.org's ROB calendar fetched directly
today (302 to SSO, recorded not worked around); Polymarket's live August-print bins fetched directly;
Senate/House CR status from contemporaneous reporting. Spot VIX **15.25** is the repo's own probe
path (Yahoo `^VIX` daily bar, 2026-08-31), not a re-derived figure; the VIX futures curve, the Fed
path and the tracked-name sensitivity ranking are **carried** from sibling ledgers rather than
re-researched, and are labelled as carried where used. Every figure is dated in-line; the event's
date is **estimate** and that label rides on every trading-adjacent line below.

### Conviction legs, tested

1. **The date is right, it stays `estimate`, and this session found a better cross-check for it —
   SUPPORTED.** ISM publishes the Manufacturing PMI on the **first business day of the month at
   10:00 ET**. `ismworld.org/supply-management-news-and-reports/reports/rob-report-calendar/` was
   fetched directly today and returned a **302 to `ecommerce.ismworld.org/SSO/Login.aspx`** — the
   third consecutive session (08-18 sibling, 08-29 sibling, today) to hit the same gated primary,
   independently re-verified rather than inherited. The interesting part is the cross-check: the
   [midterm ledger](midterm-elections-2026-11-03.md) dates the election **2026-11-03** off **2 U.S.C.
   § 7** — "the Tuesday after the first Monday in November." For that statute to yield Nov 3, **Nov 2
   must be the first Monday**, which means Nov 1 is a Sunday and Nov 2 is the month's first business
   day. So this date is corroborated by a *statutory* derivation instead of by aggregator
   convergence — a materially better check than the 10-01 sibling had. The cadence rule itself was
   already tested out-of-sample by that sibling (PRNewswire datelines the July report **2026-08-03**,
   because 08-01 was a Saturday). `EST:` remains the honest prefix: the rule is confirmed, the
   specific date is not fetched from ISM.

2. **This release's day-of reaction function, measured for the first time in this book — MIXED, and
   it replaces the sibling's non-finding with a number.** The [10-01 sibling](ism-manufacturing-2026-10-01.md)
   recorded leg 4 as an explicit non-finding and reasoned that no house instrument could fix it,
   "since `earnings-cycle.mjs` and `intraday-edges.mjs` are both symbol-keyed." That reasoning was
   too narrow — the [SLOOS ledger](sloos-2026-11-02.md) had just shown that daily bars,
   percentile-ranked against an instrument's own distribution, answer this class of question without
   either instrument. Applied here to the eight 2026 release dates (**01-02 · 02-02 · 03-02 · 04-01 ·
   05-01 · 06-01 · 07-01 · 08-03**):

   | Leg | Release-day readings | Control | Read |
   |---|---|---|---|
   | **SPY** | +0.18 · +0.50 · +0.06 · +0.75 · +0.28 · +0.27 · −0.14 · **+1.42**% — the 19th/50th/7th/68th/32nd/31st/13th/**89th** percentile of 2026 \|move\| (median 0.50%, p90 1.52%) | 7/8 up vs a **53.3%** unconditional up-day rate; one-sided binomial **p = 0.052** | **No equity reaction.** 7 of 8 sessions at or below the 68th percentile; the lone 89th is **08-03**, the session the sibling already documented as confounded by weekend risk-off headlines. The 7/8 up-count is suggestive on n=8 and dies on any correction for the four instruments tested. |
   | **QQQ** | −0.19 · +0.69 · +0.13 · +1.24 · +0.96 · +0.60 · −1.52 · **+1.76**% — 13th/43rd/8th/66th/53rd/37th/76th/83rd percentile (median 0.88%, p90 2.03%) | 6/8 up, **p = 0.193** | Same verdict, weaker still. Our own duration proxy shows nothing. |
   | **TLT** | −0.15 · −0.67 · −1.33 · −0.50 · −0.01 · −0.34 · −1.04 · −0.07% | **0/8 up** vs a 46.1% unconditional up-day rate; mean **−0.513%** vs an unconditional **−0.029%**; one-sided binomial **p = 0.007** | The only loud result in the set — and see legs 2a/2b before believing it. |
   | **^TNX** | +0.58 · +0.80 · +2.17 · +0.19 · −0.27 · +0.49 · +1.29 · **−1.24**% | 6/8 up, **p = 0.188** | Directionally consistent with TLT, not independently significant, and the largest single move is the **wrong sign on the hottest print**. |

   **2a. The placebo cuts it down.** Around each release, TLT runs **T−2: 5/8 up, +0.162% · T−1:
   2/8 up, −0.345% · T+0: 0/8 up, −0.513% · T+1: 5/8 up, +0.170% · T+2: 2/8 up, −0.079%**. T−1 — the
   last business day of the month — carries the same sign. So the release day is the **sharpest point
   of a month-turn weakness in TLT**, not a cleanly isolated ISM response, and an unknown share of the
   8/8 is calendar-turn flow that would happen with no ISM at all.

   **2b. The magnitude is ordered against the story we had.** The two largest TLT declines came on the
   releases of the year's **weakest** reading (Feb 52.4, released 03-02, **−1.33%**) and a
   **declining** one (Jun 53.3, released 07-01, **−1.04%**). The year's **hottest** print (Jul 55.6,
   +2.3 MoM, released 08-03) produced the second-**smallest** decline, **−0.07%**, with the 10Y
   yield **falling 1.24%**. Spearman(ISM level, TLT release-day return) = **+0.543** (n=6) — positive,
   i.e. *stronger prints came with better bond days*, the opposite of "hot ISM lifts yields," and far
   short of the ~0.83 critical value at n=6. It refutes nothing; it gives the story nothing.

   **Verdict — MIXED, and specifically non-tradeable.** There is a statistically loud sign
   consistency in the bond leg and none in the equity leg, but it is contaminated by a month-turn
   effect and it is **not a surprise-response function** — it fires regardless of what the print says.
   The 10-01 sibling's kill switch asked for "a clean, unconfounded observation of this release's
   day-of reaction." This is a *measurement* where there was a caveat, but it is not clean, so that
   kill switch is **answered, not retired**. Registered forward — **FT-36**, scored on **2026-09-01**.

3. **Corridor position — the densest ISM slot on this calendar, and all the load sits in the four
   sessions before it — SUPPORTED.** Eleven tracked events fall inside the mechanical ±5-day window
   (`computeAdjacentIds`, run this session): **10-28 FOMC (no SEP) + GOOG + META · 10-29 GDP Q3
   advance + PCE + AAPL + AMZN · 11-02 this print 10:00 + SLOOS 14:00 · 11-03 midterms · 11-04 ISM
   Services (proposed here) · 11-06 jobs**. That geometry caps this print's informational share
   structurally: it lands four days after the meeting that already decided, four days after the PCE
   that already priced inflation, and the day before an election that will own the tape. The 09-01
   sibling sat inside a live pre-FOMC run; the 10-01 sibling read into a decided September; this one
   reads into a decided October *and* an undecided election.

4. **The distinguishing fact: this is the last hard national activity read before the midterms —
   SUPPORTED, and it is the only structural reason 11-02 differs from 10-01 or 09-01.** The
   October-data Employment Situation is **2026-11-06**, three days *after* the vote. October CPI is
   **11-10**. So on the morning of 11-03 the freshest read the market has on October activity is a
   10:00 ET private survey published 24 hours earlier. That is a statement about *sequence*, not
   about power — leg 2 measured the power and found none in equities — but it is the reason a
   November ISM is worth a `high` tier while carrying no trade.

5. **The shutdown branch has narrowed since the sibling wrote it, and it now cuts a sharper way here
   — SUPPORTED.** Status today: the **Senate passed a CR to December 11 on 2026-08-08, 90–6**
   (the Collins/Murray deal, reported explicitly as designed to fund past the midterms and defer the
   full-year package until the results reshape it); the **House passed its own** CR to December 4 on
   07-21, 220–205; **neither is enacted**, and the House returned from a five-week recess on
   **2026-08-31** to take up the Senate version. Two branches, both dated. **If enacted:** all of
   October is funded, the 11-06 jobs report prints, and this becomes an ordinary high-impact macro
   input whose share is small (leg 3). **If it lapses on 09-30:** ISM is a **private** survey and
   publishes through an appropriations lapse; BLS does not. The 2025 precedent is on the record in
   the [10-01 sibling](ism-manufacturing-2026-10-01.md) — BLS skipped the October Employment
   Situation (household data for that reference period never collected, not retroactively) and
   cancelled the October CPI outright. Applied here, that branch is more extreme than at 10-01: this
   print would measure **the shutdown month itself**, and would be **the only October activity data
   in existence when the country votes the next morning**. Highest-weight conditional on this
   calendar for a single macro print — and entirely conditional. `estimate`-labelled; not a trade.

6. **Volatility is priced for 11-03, not 11-02 — SUPPORTED, and it names the specific trap.** Spot
   VIX **15.25** (Yahoo `^VIX` daily bar, 2026-08-31, fetched this session) against a futures curve
   of **Sep 17.4 · Oct 19.0 · Nov 19.7** — carried from the [midterm ledger](midterm-elections-2026-11-03.md)'s
   08-29 reading and re-confirmed against a 2026 term-structure source this session. The **November
   contract expires 11-18** and therefore spans both this print and the election. So an options
   structure put on "for the ISM print" is paying roughly a **4.4-point** election premium for a
   release whose measured equity reaction (leg 2) is at the **32nd percentile** of an ordinary 2026
   session. That is why the stand-aside here is *stronger* than at 09-01 or 10-01: not merely "no
   edge," but "the instrument you would use is priced for the wrong event."

7. **Base rates hold, and the near-term consensus test is dated tomorrow — SUPPORTED, and it caps
   what this doc can claim.** 2026 monthly readings: **52.4 (Feb) · 52.7 (Mar) · 52.7 (Apr) · 54.0
   (May) · 53.3 (Jun) · 55.6 (Jul)** — a 3.2-point range, largest single-month move +2.3, six-month
   sample σ ≈ **1.2**, seven straight months above 50 (carried from the 10-01 sibling; not
   re-derived). No **October** consensus, whisper or prediction-market bin exists at D-63 and none
   will for weeks — but the **August** print resolves tomorrow (**2026-09-01**, `confirmed`), and
   Polymarket's live bins (fetched 2026-08-31) show the shape a consensus takes here: **55.0–55.9 at
   29% · 54.0–54.9 at 22% · 53.0–53.9 at 12%** — about **63% inside 53.0–55.9**, and only ~4% below
   52.0. The market's own prior is the base rate. Base case for October (**estimate**-labelled,
   **Low** confidence, trend extrapolation only): continued expansion in the low-to-mid 50s, Prices
   elevated. Any "surprise" framing in this doc is extrapolation against history, not a measured gap.

8. **Tracked-name sensitivity — inherited, and now qualified by a measurement — SUPPORTED.**
   `symbols: []`; the channel is the rate path, and the ranking is unchanged because nothing here
   moves it: **CRWV** most exposed (debt-financed buildout — a hawkish repricing hits its discount
   rate *and* its cost of capital), then the high-multiple semis **NVDA / AVGO / MRVL**, then **MSFT
   / GOOG / META**, least **AAPL / AMZN**; sympathy transmits at the QQQ level per the
   [sweep](../multi-symbol-sweep.md). Leg 2 adds the qualifier that matters: **QQQ's measured
   release-day reaction to this print is nil**, so the transmission is a theoretical duration channel,
   not an observed one. The AI-siting/political channel the [midterm ledger](midterm-elections-2026-11-03.md)
   opened on CRWV is the live exposure in this corridor — and it belongs to **11-03**, not to this print.

### What the conditions support

Nothing directional, and the interesting output of this session is a **measurement that hardens a
refusal**, not a call. Concretely: (a) **stop treating this release as a rate-path event for
equities** — SPY and QQQ show no release-day reaction at all across 2026, so the duration story is a
mechanism we believe rather than one we have observed; (b) **do not read the bond leg as a surprise
response** — TLT's 8/8 is real but fires on hot and cold prints alike, sits on top of a month-turn
effect, and is rank-ordered the wrong way against print strength; (c) **never structure options
around 11-02**, because the November vol you would buy is the election's premium (leg 6); and (d)
**watch two dated things** — tomorrow's 09-01 print as the ninth observation of the bond leg
(**FT-36**), and the House CR vote, because it, not any manufacturing datapoint, decides whether
this is one read among several or the only October data that exists on election morning. None of
that licenses an entry.

### Honest limits

The date is `estimate` and is structurally unpromotable from this lane: ISM's calendar is SSO-gated
(leg 1, re-verified today), so the `ISM:` confirmed prefix needs a credentialed fetch. **Leg 2 is
the one to read sceptically.** n=8 release days is small; the four-instrument test was not corrected
for multiple comparisons (Bonferroni would take TLT's p=0.007 to ~0.028 — still under 0.05, but SPY's
p=0.052 dies outright); the sample is a single year in a single rate regime; the placebo shows an
overlapping month-turn effect whose share of the result this doc **cannot separate**; and the
Spearman is n=6 against a ~0.83 critical value, so it is a direction, not a finding. Two release days
(**01-02**, **08-03**) are holiday-displaced and carry their own calendar effects. No October
consensus exists (leg 7), so there is no measured surprise gap. The funding status (leg 5) is the
fastest-moving fact here and is sourced to reporting current as of today; the House vote may resolve
it before the next pulse reads this line. The VIX futures curve (leg 6) is **carried** from an 08-29
sibling reading against a spot fetched today — a two-day mismatch that flatters the spread slightly
and is not re-derived here. And the whole document assumes ISM publishes on schedule, which in the
lapse branch of leg 5 is the one assumption the branch depends on.

## Stance & kill switches

> **Read the 2026-09-08 amendment below before citing this paragraph.** The 08-31 text is kept
> verbatim as the record; three of its supports (the bond leg, the November-vol figure, the funding
> conditional) were superseded on 2026-09-08 and the numbers in it are no longer the live ones.

**Stance (date `estimate`, ISM first-business-day cadence re-checked 2026-08-31 against a still-gated
primary, and cross-checked against 2 U.S.C. § 7 via the 11-03 midterm date).** Treat 2026-11-02
10:00 ET as a **high-impact known-date read with no tradeable edge — now measured rather than
assumed**: no position opened, closed or sized off it, no house playbook targets it, and per leg 2
this release has **no measurable equity reaction** and a bond reaction that is loud in sign,
contaminated by a month-turn effect, and unrelated to the print's strength. Additionally, and
specific to this date: **never structure options around it**, because the November volatility that
would price such a structure is the 11-03 election's premium (spot **15.25** vs the Nov future
**19.7**), not this print's. Base case for the October reading (**estimate**-labelled, **Low**
confidence, trend extrapolation only at D-63): continued expansion in the low-to-mid 50s consistent
with 2026's 52.4–55.6 range, with Prices elevated. What would change this print's *importance* — never
its tradeability — is external to it: whether federal funding is extended before **2026-09-30**,
which decides whether this is one read among several or the only October activity data in existence
when the country votes on **11-03**.

**Stance amendment (2026-09-08, D-55) — the call is unchanged and three of its supports are not.**
Receipt: the ledger row dated 2026-09-08 below. **(a) Leg 2's bond finding is withdrawn as a bond
finding.** Re-measured this session over nine 2026 releases: raw closes **0/9 up** (mean −0.544%),
dividend-adjusted **3/9 up** (mean −0.209%, one-sided p = **0.29** against a 48.2% baseline). TLT's
monthly distribution goes ex on the first business day, which is the release day — the streak was
the payout calendar, confirmed independently here after **FT-38** first exposed it. The doc's
published `p = 0.007` describes a dividend, and nothing in this ledger should cite it again. On the
[12-01 sibling](ism-manufacturing-2026-12-01.md)'s 11-year *magnitude* frame, 2026 gives TLT **2/9**
above its own p78 versus 22% by construction — no effect in this regime either. **(b) Leg 6's
number and its contract attribution are both corrected.** From CBOE settlement files fetched this
session (08-14 · 08-25 · 08-28 · 09-02 · 09-04), the November contract's curvature above its
neighbours is **+0.23/+0.31/+0.26/+0.24/+0.21** — small and decaying — while October's is
**+0.51/+0.48/+0.55/+0.58/+0.62**, the largest positive in the curve and rising on every
observation. A VX future settles to the VIX index at expiry and VIX measures 30 days *forward*, so
October's settlement window (**10-21 → 11-20**) contains 11-02 and 11-03 and November's
(11-18 → 12-18) does not. The election's identifiable premium is therefore roughly **0.6 vol points
in the October contract**, not the ~4.4 points this doc attributed to November — that spread is
contango. The practical instruction is unchanged and now rests on carry rather than on a mispriced
event. **(c) The high-weight conditional is dead** (kill switch 2, below). What is left that is
specific to 11-02: the sequence fact of leg 4, and a corridor that densified **11 → 25** with three
other tracked releases on the same morning — which *lowers* this print's informational share
further rather than raising it.

**Kill switches:**

- ~~**TLT closes higher on 2026-09-01**~~ — **DID NOT FIRE, and the leg it protected was retired
  anyway.** TLT fell 09-01 on both bases (raw −0.788%, adjusted −0.408%), so **FT-36** scored PASS;
  but **FT-38** showed the same session's 38bp wedge is the $0.315 distribution that went ex that
  morning, and this session's own re-run puts the adjusted series at 3/9. Retired 2026-09-08: a
  switch that can only ever confirm a dividend is not a test of anything.
- ~~**A CR is signed before 2026-09-30**~~ — **FIRED 2026-09-02.** H.R. 6500, the *Continuing
  Appropriations and Extensions Act, 2027*, became **PL 119-103**, funding federal agencies through
  **2026-12-11** (whitehouse.gov briefing statement, fetched direct 2026-09-08; congress.gov 403s
  from this runner and is recorded blocked). Leg 5 collapses to a footnote exactly as specified:
  October is funded, **11-06 payrolls will print**, and this is an ordinary high-impact macro input.
- ~~**No CR by 2026-09-30**~~ — **cannot fire; retired** by the above. The cliff moved to **12-11**,
  outside this print's corridor and inside the [12-01 sibling](ism-manufacturing-2026-12-01.md)'s.
- **Spot VIX converges to within ~1 point of the November future by 2026-10-16 opex** — **kept, but
  demoted and re-read.** Standing at **4.24** points (spot 14.53 vs VX/X6 18.7688, both 2026-09-04).
  Per the amendment above this spread is mostly contango, so convergence would signal a vol regime
  shift rather than an election premium expiring; the switch that now carries the leg-6 question is
  **FT-ism-manufacturing-2026-11-02-1**, scored on the same 10-16 settlement.
- **WTI closes back under $85 before 2026-09-30** — the energy pass-through leaves the October
  survey window before it can reach the Prices line, and the informative bar reverts from ">~73" to
  ">70". Standing at **$92.61** (2026-09-08).
- **ISM prints sub-50 on 09-01, 10-01 or 11-02** — the seven-month expansion streak breaks, leg 7's
  base rates stop being the right prior, and this doc is re-read from the national tape.
- **The Fed stops being inflation-anchored** — a payroll or CPI print repricing the question from
  hold-vs-hike to hold-vs-cut — at which point the headline reclaims primacy over the Prices line.
- **A published October consensus emerges** — resolves leg 7; re-run the framing against a real
  number instead of trend extrapolation.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-08-31 | D-63 | Initial research banked (above). **Date:** stays `estimate` — ismworld.org's ROB calendar re-fetched direct today, still 302 → `ecommerce.ismworld.org/SSO/Login.aspx` (third consecutive session). New cross-check found: 2 U.S.C. § 7 puts the midterms on "the Tuesday after the first Monday in November," and the [midterm ledger](midterm-elections-2026-11-03.md) dates them **11-03** — so **11-02 is the first Monday**, Nov 1 is a Sunday, and this print's first-business-day date is corroborated *statutorily* rather than by aggregator convergence. **The session's main output — the reaction function, measured, closing the [10-01 sibling](ism-manufacturing-2026-10-01.md)'s explicit non-finding.** Method: Yahoo daily closes, 2026-01-01→08-28, n=165 sessions, against the 8 ISM release dates (01-02 · 02-02 · 03-02 · 04-01 · 05-01 · 06-01 · 07-01 · 08-03); the SLOOS ledger's percentile technique, which the sibling wrongly assumed no house instrument could supply. **Equities: nothing.** SPY release-day moves +0.18/+0.50/+0.06/+0.75/+0.28/+0.27/−0.14/**+1.42**% = the 19th/50th/7th/68th/32nd/31st/13th/**89th** percentile of its own 2026 \|move\| distribution (median 0.50%, p90 1.52%); 7 of 8 at or below the 68th, and the 89th is **08-03**, already documented as confounded. QQQ 13th/43rd/8th/66th/53rd/37th/76th/83rd. SPY 7/8 up vs a 53.3% unconditional rate, p=0.052 — suggestive on n=8, dead on any multiple-comparison correction. **Bonds: loud sign, wrong story.** TLT fell on **all 8** (−0.15/−0.67/−1.33/−0.50/−0.01/−0.34/−1.04/−0.07%), mean **−0.513%** vs an unconditional 2026 daily mean of −0.029% and a 46.1% up-day rate, one-sided binomial **p=0.007**; ^TNX up 6/8. **Placebo disciplines it:** T−2 5/8 up +0.162% · T−1 **2/8 up −0.345%** · T+0 0/8 −0.513% · T+1 5/8 +0.170% · T+2 2/8 −0.079% — the last business day of the month carries the same sign, so release day is the sharpest point of a **month-turn** effect, not an isolated ISM response. **And magnitude is ordered against the "hot ISM lifts yields" story:** largest declines came on the year's weakest (Feb 52.4 → −1.33%) and a declining reading (Jun 53.3 → −1.04%), while the hottest print (Jul 55.6, +2.3 MoM, released 08-03) gave the second-smallest, −0.07%, with ^TNX **−1.24%**. Spearman(ISM level, TLT return) = **+0.543** (n=6) — wrong sign, far short of the ~0.83 critical value. Verdict **MIXED**: measured, non-directional, not a surprise-response function, not tradeable; the sibling's "clean unconfounded observation" kill switch is **answered, not retired**. Registered **FT-36**, scored on the 09-01 print. Adjacency sweep — **peers:** n/a, `symbols: []`; tracked prints inside the window are MSFT 10-27, GOOG+META 10-28, AAPL+AMZN 10-29, CRWV 11-10, none symbol-linked to this event. **Macro surprises:** none since the calendar's last read; the Fed-path context (Warsh 08-28, September hike odds ~35%→56–59%) is carried from the [jackson-hole close-out](jackson-hole-2026-08-28.md), not re-derived, and is why Prices outranks the headline in this doc's reading order. **Volatility regime:** spot VIX **15.25** (Yahoo `^VIX` daily bar, 2026-08-31) vs the sibling docs' **14.51** (08-28 close) — +0.74pt, inside noise; the futures curve **Sep 17.4 · Oct 19.0 · Nov 19.7** is carried from the [midterm ledger](midterm-elections-2026-11-03.md) and re-confirmed against a 2026 term-structure source. The **November contract expires 11-18** and spans both this print and the election, so the ~4.4pt spot-to-Nov premium belongs to **11-03** — naming the trap that any "trade the ISM print" option structure walks into. **Geopolitical/policy:** the funding branch **narrowed** since the 10-01 sibling — the Senate CR to **Dec 11** (passed 08-08, 90–6, Collins/Murray, reported as explicitly designed to fund past the midterms) is with the House, which returned from a five-week recess **08-31**; neither chamber's CR is enacted. If enacted, all of October is funded and 11-06 payrolls print; if it lapses, ISM (private) publishes and BLS does not, making this **the only October activity data in existence on election morning** — a sharper version of the sibling's conditional. Also carried, not re-derived: the 2026-08-30 US strike on Larak Island re-escalated the Strait of Hormuz (noted in the OPEC entry), the crude → Prices-paid channel this print's hawkish line runs through. **Event tape:** no **October** consensus, whisper or bin exists at D-63; the **August** print resolves tomorrow and Polymarket's live bins (fetched today) run **55.0–55.9 29% · 54.0–54.9 22% · 53.0–53.9 12%** — ~63% inside 53.0–55.9, ~4% below 52.0, i.e. the market's prior is the base rate. **New dated adjacency found → proposed in this PR:** **ISM Services (Oct data)** falls on the third business day, **2026-11-04** — the day after the midterms and two days after this print — and the slot is untracked despite the confirmed `ism-services-2026-09-03` sibling; added as `ism-services-2026-11-04`, `status: estimate` (`EST:`), derived from the same third-business-day rule with no aggregator convergence obtained and the ROB calendar gated, stated as such. | — (stance set) | 2026-09-14 (high, ≥61d band: every 14d) |

| 2026-09-08 | D-55 | **Two of this doc's three supporting arguments were dismantled by its own re-measurements this session; the stand-aside call is untouched. Read the stance amendment above for the scoring.** **(1) The bond leg is withdrawn.** Initial research led on "TLT fell on all 8 release days, one-sided binomial p=0.007." Re-run here (Yahoo daily closes, cache busted, 2026 YTD n=170 sessions through 09-04, nine releases 01-02 · 02-02 · 03-02 · 04-01 · 05-01 · 06-01 · 07-01 · 08-03 · **09-01**): **raw 0/9 up, mean −0.544%** but **dividend-adjusted 3/9 up, mean −0.209%, p = 0.29** against a 48.2% unconditional up-rate and a −0.015% adjusted daily mean. TLT distributes monthly and goes ex on the first business day — the ISM release day — so the streak was the payout calendar. **FT-38** exposed this on 09-02; this row is an independent reproduction, not a carry, and the published p=0.007 is retired from this ledger. Per-release adjusted returns: −0.149 · −0.286 · −1.004 · −0.098 · +0.358 · +0.054 · −0.676 · +0.330 · −0.408%. On the [12-01 sibling](ism-manufacturing-2026-12-01.md)'s 11-year **magnitude** frame, 2026 gives TLT **2/9** above its own p78 (0.652%) vs 22% by construction, P(X≥2)=0.62 — absent in this regime. The equity half survived intact and gained an observation: SPY **1/9** above its p78 (0.977%), QQQ **1/9**; the 09-01 print sat at SPY p63.5 / QQQ p67.1 / TLT-adjusted p51.8. **(2) Leg 6's election-premium figure was wrong by an order of magnitude and named the wrong contract.** Initial research carried "spot 15.25 vs the November future 19.7, expiring 11-18, spanning both days" from the [midterm ledger](midterm-elections-2026-11-03.md) — whose own reading is dated **08-25**, not the 08-29 this doc claimed. Measured here from CBOE's settlement file (`cboe.com/us/futures/market_statistics/settlement/csv`, HTTP 200; the `cdn.cboe.com` delayed-quote and term-structure JSON endpoints both 403 and are recorded blocked): 08-25 settles were Sep **17.2042** · Oct **18.9246** · Nov **19.6957**, so the carried mirror figures check out to 0.004 on November. The correction is structural, not numeric. Curvature (a contract's settle minus the mean of its two neighbours) across 08-14 · 08-25 · 08-28 · 09-02 · 09-04: **Nov X6 +0.228 · +0.308 · +0.259 · +0.238 · +0.212** — small and decaying — against **Oct V6 +0.513 · +0.475 · +0.553 · +0.582 · +0.621**, the largest positive in the curve and rising on every observation (Dec Z6 sits at −0.41 to −0.50 throughout, unexplained by this method). The mechanism decides it: a VX future settles to the VIX **index** at expiry, and VIX measures 30 days *forward*, so **October's settlement window is 10-21 → 11-20 and contains both 11-02 and 11-03**, while November's is 11-18 → 12-18 and is entirely after the election. So the identifiable election premium is ~**0.6 vol points in the October contract**; the ~4.24-point spot-to-November spread (14.53 vs 18.7688, both 09-04) is contango. **Registered forward — FT-ism-manufacturing-2026-11-02-1**, scored on the 2026-10-16 settlement. The stance's instruction is unchanged; only its reason is. Adjacency sweep — **peers:** n/a, `symbols: []`. **Macro surprises, four since the last row, all carried from sibling close-outs and labelled:** ISM mfg **54.6** vs 55.2 (09-01 miss; New Orders 53.7, Employment 51.2, **Prices 71.1 flat**); JOLTS 7.271M vs 7.300M (09-01); ISM **Services 55.4** (09-03) beating by 1.3–1.4 with **Prices 72.6, highest since Aug 2022**; payrolls **+162k vs ~+53–55k** (09-04) with Jun/Jul revised +55k. September hike odds ~**58%** CME FedWatch (searched today) against the ~59–60% the [jobs close-out](jobs-2026-09-04.md) logged — a venue spread, direction reliable, level not; 2y 4.344%, 30y 5.245% (press, 09-04). **Volatility regime:** own probe today — VIX **15.44** vs the reference block's **15.25**, **+0.19**, far inside the 3-point threshold; the path round-tripped through 16.34 (09-01) and 14.32 (09-03). ^TNX **4.766** vs 4.758 at the last row, +0.8bp. Yahoo's ^VIX3M/^VIX6M series are stale (last bar 2026-07-17) and were not used. **Geopolitical — the live thread, and it belongs to this print's survey window.** WTI **83.40 (08-28) → 92.61 (09-08), +11.0%**; Brent 89.31 → **97.60**, +9.3%. OPEC+ met **09-06** and held October at September levels — sourced to OPEC's own release in the [OPEC close-out](opec-plus-meeting-2026-09-06.md), next meeting **10-04** — so the bid is the Hormuz shut-in, not quota. **October is the second full month inside this regime**, which is why the 10-01 sibling's raised Prices bar (**">~73"** rather than ">70") applies to *this* print with more force than to its own; a new kill switch tracks it. **Event tape:** still **no October consensus** at D-55, and Kalshi's `KXISMPMI` series runs only through **`26SEP`** (24 markets, ladder settling 2026-10-01, every price/volume/OI field null) — checked direct today, so the `26OCT` ladder for this print does not exist yet and should open around 10-01. **Date — stays `estimate`, and the promotion path is now dated rather than declared impossible.** ISM's report chain names its own successor one month ahead (**FT-48**), which is how the [10-01 sibling](ism-manufacturing-2026-10-01.md) was promoted on 09-05 off the August release; the **2026-10-01** report featuring September data is therefore expected to name this print's date and make an `ISM:` prefix available. Independent corroboration exists today but is second-hand: the [construction-spending-2026-11-02](construction-spending-2026-11-02.md) entry — `confirmed` off two Census primaries — cites the Atlanta Fed's GDPNowcastDataReleaseDates workbook, whose 2026-11-02 10:00 row reads verbatim *"Construction spending, ISM Manufacturing Index"*. This session tried to re-fetch that workbook and got a 48,299-byte JavaScript bot-challenge under HTTP 200 rather than the xlsx, so the line is **carried from the 09-06 sibling fetch, not re-verified**, and is recorded blocked. **Corridor densified 11 → 25** (`computeAdjacentIds`, run today). The material change is same-morning: **construction-spending-2026-11-02** shares this print's exact **10:00 ET** slot and is `confirmed`, and **treasury-borrowing-estimates-2026-11-02** lands the same day — so 11-02 now carries four tracked items, not two, and leg 3's cap on this print's informational share tightens rather than loosens. Also new inside ±5 days: **treasury-refunding-2026-11-04**, **jolts-2026-11-03** (election day), **ecb-decision-2026-10-29**, **boj-decision-2026-10-30**, **eci-q3-2026-10-30**, **chicago-pmi-2026-10-30**, **adp-employment-2026-11-04**, **productivity-costs-q3-2026-11-05**, **intl-trade-full-report-2026-11-04**, **advance-economic-indicators-2026-10-28**, **housing-vacancies-q3-2026-10-28**, **m3-full-report-2026-11-03**, **boj-minutes-2026-11-05**, **treasury-2y-frn-2026-10-28**, **treasury-7y-note-2026-10-29**, **treasury-buyback-10y20y-2026-11-04**. The four earnings prints the 08-31 row listed by hand (GOOG/META 10-28, AAPL/AMZN 10-29) are **absent from the mechanical list because `computeAdjacentIds` reads only `src/domain/market-events/`** while the prints live in `earnings-calendar.ts` — a data-source artifact, not a calendar change; they are still on those dates. **New dated adjacency found but NOT proposed, deliberately.** The S&P Global US Manufacturing PMI **final** releases at 09:45 ET on the same first business day and is the attribution confound **FT-47** named for this slot — it is untracked. `pmi.spglobal.com`'s press-release page returns HTTP 200 with a JavaScript shell carrying no server-rendered date, and no other primary was reached, so no `EST:`-sourceable November date exists for it today. Recorded as a candidate with its blocker rather than filed on a cadence guess; the next pulse should retry. **No proposal file is written in this PR.** | **Amended** — kill switch 2 FIRED (CR signed, leg 5 dead), kill switch 1 retired, leg 2's bond finding withdrawn, leg 6 re-attributed to the October contract; stance stays **stand-aside**, and a new WTI-under-\$85 switch is added | 2026-09-15 (high, ≥21d band: every 7d) |

**Rules.** Rows append only — editing a past row is falsification. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed to `market-events.ts` as an `estimate` in
the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first),
never from memory — after which this doc goes quiet.
