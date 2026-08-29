# ISM Manufacturing PMI (Sep 2026 data) — ism-manufacturing-2026-10-01

**Kind:** macro-print · **Date:** 2026-10-01 (estimate, EST: ISM first-business-day cadence at 10:00 ET — ismworld.org's own ROB calendar re-fetched 2026-08-29 and still SSO-gated) · **Impact:** high
**Last assessed:** 2026-08-29
<!-- probe-ref: {"symbols":{},"vix":14.51,"daysBand":"high:21+","adjacentIds":["chicago-pmi-2026-09-30","government-funding-deadline-2026-09-30","jobs-2026-10-02","jolts-2026-09-29","mrvl-investor-day-2026-10-06","mu-2026-09-29-print"],"screenStreak":0} -->

## At a glance

**TL;DR.** This is the national manufacturing print the newly-tracked Chicago Barometer leads by two
business days, the first factory read of Q4, and the first ISM after the 2026-09-16 FOMC. Date is
**estimate** — ISM's own release calendar is SSO-gated and could not be fetched. Two findings change
how this print should be read versus its 2026-09-01 sibling. **First, the national series is nothing
like Chicago.** ISM has printed **52.4 · 52.7 · 52.7 · 54.0 · 53.3 · 55.6** (Feb→Jul 2026) — a
3.2-point full-year range and a six-month sample σ of about **1.2**, against Chicago's trailing-12m σ
of **7.59** and its 47.1–62.7 range. Reading Chicago's 47.1 collapse onto this series is a category
error, and the 09-01 print adjudicates it four weeks before this one. **Second — and this is what
makes this date different from any other ISM — federal funding lapses at the end of 2026-09-30, so a
shutdown would begin the same morning this prints.** ISM is a *private* survey and publishes through
a lapse; BLS does not. In the 2025 lapse it skipped the October Employment Situation and cancelled
the October CPI outright. In that branch the **2026-10-02 payrolls do not print and this becomes the
only hard macro read of the corridor**, ahead of an October FOMC that carries no SEP. That tail is
real but shrinking on a dated schedule: the House returns 08-31 and is expected to vote the
Senate-passed CR in the first week of September. Nothing here is a trade — it is a conditional
upgrade in one print's weight, not a direction.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-33) | Stand aside | High | `symbols: []`, an `estimate` date 33 days out, and no September consensus exists or will until the final week. Nothing is actionable today. | Nothing dated today; the date is not primary-confirmed and no consensus exists to be surprised against |
| This week | Watch the **funding vote**, not the print | Medium | The House votes the Senate CR (to Dec 11) in the first week of September; that vote, not any ISM datapoint, decides whether this release is one input among three or the corridor's only surviving one. | The House passing the Senate CR and the president signing it **before 2026-09-30**, which retires the shutdown branch entirely and drops this back to an ordinary ISM |
| This month | Watch — let **ISM 2026-09-01** adjudicate Chicago's 47.1 | High | The 09-01 national print is the clean test of whether August's regional collapse was signal or a one-region air pocket, and it sets the prior this print is read against. | The **2026-09-01** ISM printing sub-50, which would make Chicago a national signal and invert this doc's stability leg before it is a month old |
| This quarter | Stand aside on this print; track **Prices** as the rate-relevant line | Medium | This Fed is pinned to inflation (Warsh, 2026-08-28), and ISM Prices has held above 70 for six straight months — the subcomponent a rate desk can act on, unlike the headline. | Growth data visibly repricing the Fed again — the **2026-10-02** payrolls (if it prints) pulling hike odds down hard — which restores the headline over the prices line |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never a trade on this print.** `symbols: []`, `estimate` date, and no house playbook is
  macro-keyed (S1/S2/E1/S3/S4 + G1 are all symbol/earnings-keyed). It is an input, not an event.
- **The funding bill signed before 2026-09-30** → shutdown branch dead; read this as an ordinary ISM
  and give the 10/2 payrolls their normal primacy.
- **No CR signed by 2026-09-30** → this print is the corridor's only hard read; raise its weight,
  and expect the market to over-read a single private survey in a data vacuum.
- **Prices holding ≥ 70** (July 71.1, a sixth straight month above 70) → the hawkish line under an
  inflation-anchored Fed; tightens caution on the longest-duration names (CRWV, then the semis).
- **A sub-50 headline** on either 09-01 or this print → kills the stability leg; the 2026 expansion
  streak (seven straight months above 50) breaks and Chicago's August collapse is retro-vindicated.
- **Watch (dated):** ISM Manufacturing **2026-09-01** (adjudicates Chicago) · FOMC **2026-09-16** ·
  JOLTS **2026-09-29** · MU print **2026-09-29** (estimate) · Chicago PMI **2026-09-30**
  (estimate) · **funding deadline 2026-09-30** (estimate, proposed in this PR) · **this print
  2026-10-01** (estimate) · jobs **2026-10-02** · MRVL investor day **2026-10-06** · FOMC
  **2026-10-28** (no SEP).

## Initial research

### The question, plainly

What should we expect from the September 2026 ISM Manufacturing PMI on 2026-10-01, is the date right,
what does the national series actually look like now that a regional survey has collapsed, how does
this release move markets, and what — if anything — should a paper-trading book holding long-duration
tech (NVDA MRVL AVGO CRWV MSFT GOOG META AAPL AMZN) do about it?

**One-line verdict:** the national series is far too stable to extrapolate Chicago's 47.1 onto (a
3.2-point range and σ ≈ 1.2 across 2026 versus Chicago's 7.59), the day-of reaction function this
calendar has been assuming is not actually established — the last print beat by 1.6 points while the
10Y *fell* six basis points — and the one genuinely distinguishing fact about **this** date is that
federal funding lapses the night before it, which in the un-averted branch makes a private survey the
only macro data the market gets that week.

### Method

Macro-print mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — `symbols: []`, so no
symbol-keyed instrument applies, `earnings-cycle.mjs` / `intraday-edges.mjs` were not run, and the
cache-busting rule has no target. Sourced web research, primary-first: ismworld.org's ROB release
calendar attempted directly (2026-08-29, redirected to an SSO login — recorded, not worked around);
PRNewswire's own July ISM release fetched directly for the dateline and the full subcomponent table;
CRFB's FY2027 appropriations tracker and the Conference Board's policy backgrounder fetched directly
for funding status; BLS's own shutdown-impact pages and contemporaneous coverage for what a lapse did
to data in 2025; tradingeconomics for the 2026 monthly series. Volatility is the repo's own
`event-material-scan` probe (VIX **14.51**), not a re-derived figure. Fed-path context is carried from
the sibling [`jackson-hole`](jackson-hole-2026-08-28.md) close-out rather than re-researched. Every
figure is dated in-line; the event's date is **estimate** and that label rides on every
trading-adjacent line below.

### Conviction legs, tested

1. **The date and time are right, and they stay `estimate` — SUPPORTED, with the primary re-checked
   and still gated.** ISM publishes the Manufacturing PMI on the **first business day of the month at
   10:00 ET**. `ismworld.org/supply-management-news-and-reports/reports/rob-report-calendar/` was
   fetched directly today and returned a **302 to `ecommerce.ismworld.org/SSO/Login.aspx`** — the same
   gated-primary wall the [`09-01 sibling`](ism-manufacturing-2026-09-01.md) flagged, independently
   re-confirmed rather than inherited. **2026-10-01 is a Thursday** with no federal holiday displacing
   it, so the cadence rule lands exactly there, and aggregator calendars (mql5, investing.com,
   forexfactory) converge on it. `EST:` is the honest prefix: the rule plus convergence, not a fetched
   primary line.

2. **The cadence rule is now *tested*, and testing it turned up an error of record — SUPPORTED.**
   PRNewswire's July ISM release carries a dateline of **2026-08-03, 10:00 ET** (fetched today).
   2026-08-01 was a **Saturday**, so the first-business-day rule *predicts* Aug 3 — which is a
   genuine out-of-sample confirmation of the rule this doc's date rests on. It also means the
   [`09-01 sibling`](ism-manufacturing-2026-09-01.md) is wrong where it dates that release "2026-08-01"
   (it does so in the verdict, leg 2, leg 4 and its D-13 ledger row). **That doc is not edited here** —
   ledger rows are append-only and this lane does not rewrite a sibling's history; the correction is
   recorded in this doc, and it matters beyond pedantry because that sibling's reaction-function leg
   attributes a market move to the wrong session (leg 4 below).

3. **The national series is an order of magnitude more stable than Chicago — SUPPORTED, and it is the
   leg this event exists to supply.** 2026 monthly ISM Manufacturing readings: **52.4 (Feb) · 52.7
   (Mar) · 52.7 (Apr) · 54.0 (May) · 53.3 (Jun) · 55.6 (Jul)** — a **3.2-point** total range, a
   largest-single-month move of **+2.3**, and a six-month sample **σ ≈ 1.2**. July was the seventh
   consecutive month above 50, following eleven consecutive months at or below 50 through December
   2025. Against that, the [`Chicago doc`](chicago-pmi-2026-09-30.md) measured its own series at
   trailing-12m **σ 7.59**, with a 2026 range of **47.1–62.7** including a +13.5 and a −10.5 month.
   **Honest caveat:** six months against twelve is not a like-for-like window, so read the order of
   magnitude and not the ratio. The conclusion survives either way — a national series that has not
   moved more than 2.3 points in a month all year does not plausibly deliver a Chicago-style
   double-digit air pocket, and treating 47.1 as a national forecast is a category error. The
   **2026-09-01** print tests this a month before this one has to.

4. **The "hot ISM lifts yields" reaction function is NOT established — MIXED, and it corrects a
   working assumption in this calendar.** The 09-01 sibling's leg 4 reads: strong-activity / hot-prices
   ISM prints lift yields and pressure long-duration equities. The most recent observation points the
   other way. On **2026-08-03**, ISM beat hard — 55.6 against a 54.0 Dow Jones consensus, the strongest
   since May 2022 — and the same session the **10-year yield fell about 6bp to ~4.688%** while equities
   rallied broadly: Dow to an all-time high **53,178.41 (+1.32%)**, S&P 500 **+1.48% to 7,600.50**,
   Nasdaq **+2.1% to 25,913.9** (CNBC / FXStreet / Investrade, 2026-08-03). Contemporaneous narration
   attributes the yield move to weekend risk-off headlines with the ISM print "reinforcing the case for
   a patient Fed" — i.e. **confounded**, exactly as the sibling's own evidence was (Penn Mutual's
   "fresh 2026 highs *that week*" is a weekly claim spanning the 08-05 services print, and was pinned
   to an 08-01 session that did not exist). **The defensible position: we have no clean measurement of
   this release's standalone day-of reaction function in either direction.** Both stories are
   confounded, this doc does not settle it, and no stance below leans on a directional reaction.

5. **The distinguishing fact about this date: funding lapses the night before it — SUPPORTED.** FY2026
   appropriations run out at the end of **2026-09-30**; absent action a shutdown begins **2026-10-01**,
   the morning of this release. Status as of today: the **Senate passed a CR to December 11 on
   2026-08-08, 90–6**; the House passed its **own** CR to December 4 on 2026-07-21, 220–205; **neither
   is enacted**, none of the twelve regular bills has passed the Senate, and the Conference Board's
   2026-08-12 backgrounder states plainly that the versions still require reconciliation and that "the
   President's signature to enact the legislation remains uncertain" (CRFB FY2027 tracker, updated
   2026-08-12; Conference Board, 2026-08-12). The tail is **shrinking on a dated schedule**: the House
   returned from recess **2026-08-31** planning to take up the Senate version, with the vote expected
   in the first week of September and a supportive White House statement of administration policy —
   four weeks ahead of the deadline, which is early by recent standards. This doc takes no view on
   whether it passes; it takes a view on what each branch does to the print.

6. **Why the lapse branch matters here specifically: ISM survives it and BLS does not — SUPPORTED.**
   ISM's Report On Business is a **private** survey funded by a professional association; a lapse in
   federal appropriations does not stop it. Federal statistical output does stop. In the 2025 lapse
   (2025-10-01 to 2025-11-12), BLS **did not publish the October Employment Situation** — establishment
   data was folded into the November release and household-survey data for the October reference period
   **was never collected and will not be collected retroactively** — and the **October CPI was
   cancelled outright**, the first interruption in a series running more than 77 years (bls.gov
   shutdown-impact pages; contemporaneous CNBC/Roic coverage, 2025-11). The single exception was a
   specially-recalled September CPI on 2025-10-24, published only because the Social Security COLA
   depended on it. **Applied to this corridor:** in the shutdown branch the **2026-10-02 payrolls do
   not print**, and this 10:00 ET private survey becomes the only hard macro read the market gets —
   feeding an **October 27–28 FOMC that carries no SEP or dot plot**. That is a conditional upgrade in
   this print's weight, and the mechanism behind it is documented rather than assumed.

7. **Corridor position — dense, and it front-loads the private data — SUPPORTED.** The window
   2026-09-29 → 2026-10-02 carries, in order: **JOLTS** (federal), **MU's print** (`estimate`, and per
   the Chicago doc's leg 9 the better hard read on manufacturing demand), **Chicago PMI 09-30**
   (`estimate`, private), **this print 10-01** (private), **payrolls 10-02** (federal). One
   bookkeeping note: the Chicago ledger's probe-ref lists a `consumer-confidence-2026-09-29`
   adjacency, but no such entry is on the calendar today — flagged, not silently repeated here. Note
   the shape of what *is* there: everything private clusters
   *before* the deadline or on the day, and the two federal releases bracket it. This is also the first
   ISM after the **2026-09-16 FOMC**, so it reads into a decided September rather than a live one — the
   opposite of its 09-01 sibling, which sat inside the pre-FOMC run.

8. **Tracked-name sensitivity — inherited, not re-derived — SUPPORTED.** `symbols: []`; the channel is
   the rate path, and the ranking is unchanged from the sibling docs because nothing in this research
   moves it: **CRWV** most exposed (debt-financed buildout — a hawkish repricing hits its discount rate
   *and* its cost of capital), then the high-multiple semis **NVDA / AVGO / MRVL**, then **MSFT / GOOG
   / META** (mega-cap duration, fortress balance sheets mute the financing leg), least **AAPL / AMZN**.
   Sympathy transmits at the QQQ level — the [`sweep`](../multi-symbol-sweep.md) showed peer windows
   are one AI-beta bet, not nine. No name-keyed exposure is created by this event.

9. **No September consensus exists, and none will for weeks — SUPPORTED, and it caps what this doc can
   claim.** At **D-33** no street consensus, whisper, or prediction-market bin for the September ISM is
   findable (investing.com / FXStreet / forexfactory calendars carry the date but no forecast). The
   09-01 sibling's own history is the guide to when that changes: it found nothing at D-13 and a
   Polymarket distribution by D-8. Any "surprise" framing here is therefore trend extrapolation against
   history, not a measured gap — stated as such everywhere below.

### What the conditions support

Nothing directional, and this doc is explicit that its most interesting finding is a *conditional*,
not a call. No house playbook is macro-keyed, the date is `estimate`, and leg 4 removes the
reaction-function story that would have been needed to trade it. What the conditions support is a
**reading discipline plus one dated watch**: (a) let the **09-01** print adjudicate Chicago before
giving this one any Chicago-derived prior; (b) read **Prices before the headline** for as long as this
Fed's case is pinned to inflation; and (c) **watch the funding vote in the first week of September**,
because it — not any manufacturing datapoint — determines whether 10-01 is one input among three or
the only one, and a data vacuum is exactly the condition under which a market over-reads a single
private survey. None of that licenses an entry.

### Honest limits

The date is `estimate` and structurally cannot be promoted from this lane: ISM's own calendar is
SSO-gated (leg 1, re-verified today), so the `ISM:` confirmed-tier prefix is unreachable without a
credentialed fetch. No September consensus exists (leg 9), so there is no measured surprise gap. The
2026 monthly series is aggregator-sourced (tradingeconomics, cross-read against PRNewswire's July
primary) and its January value was not recovered, so leg 3's σ is computed over **Feb–Jul only** and
is a six-month sample compared against a twelve-month figure — an order-of-magnitude comparison, not a
statistic. Leg 4 establishes a *non-finding*: both available reaction observations are confounded, and
this doc measures nothing to replace them — no house instrument can, since `earnings-cycle.mjs` and
`intraday-edges.mjs` are both symbol-keyed. The funding status (leg 5) is as of sources dated
2026-08-12 and 2026-08-28 and is the fastest-moving fact in this document; the House vote may already
have resolved it before the next pulse reads this line. One inherited detail is left unresolved rather
than laundered: July's employment subcomponent is described as "first expansion in 33 months" by one
source and "first expansionary reading since January 2025" by the sibling doc — the two cannot both be
right, nothing here rests on it, and neither is repeated as fact.

## Stance & kill switches

**Stance (date `estimate`, ISM first-business-day cadence re-checked 2026-08-29 against a still-gated
primary).** Treat 2026-10-01 10:00 ET as a **high-impact known-date read with no tradeable edge**: no
position opened, closed or sized off it, no house playbook targets it, and — per leg 4 — no assumed
direction for its day-of market reaction, because this calendar's working "hot ISM lifts yields" story
does not survive its own most recent observation. Base case for the September reading
(**estimate**-labeled, **Low** confidence, trend extrapolation only since no consensus exists at
D-33): continued expansion in the low-to-mid 50s consistent with 2026's entire 52.4–55.6 range, with
Prices elevated. The two things that would actually change this print's importance are both external
to it: whether **2026-09-01** vindicates or refutes Chicago's 47.1, and whether federal funding is
extended before **2026-09-30** — the latter deciding whether this is one read among three or the only
one before an October FOMC with no SEP.

**Kill switches:**

- **A CR is signed before 2026-09-30** — the shutdown branch dies, the 10-02 payrolls print normally,
  and legs 5–6 collapse to a footnote; drop this print's weight back to an ordinary high-impact macro
  input and stop watching the funding tape in this doc.
- **No CR by 2026-09-30** — the inverse: 10-02 payrolls likely do not print, this becomes the
  corridor's only hard read, and the risk to manage flips from the datapoint to the *vacuum* around it.
- **ISM prints sub-50 on 2026-09-01** — Chicago's collapse was a national signal, leg 3's stability
  argument dies with the seven-month expansion streak, and this doc is re-read from the national print
  rather than from its own base rates.
- **A published September consensus emerges** — resolves leg 9; re-run the surprise framing against a
  real number instead of trend extrapolation.
- **The Fed stops being inflation-anchored** — a payroll print pulling hike odds down hard, or the
  question repricing from hold-vs-hike to hold-vs-cut — at which point the headline reclaims primacy
  over the Prices line and this doc's reading order inverts.
- **A clean, unconfounded observation of this release's day-of reaction arrives** (an ISM print not
  sharing its session with a Fed event or a weekend risk headline) — leg 4's non-finding can then be
  replaced with a measurement instead of a caveat.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-08-29 | D-33 | Initial research banked (above). **Date:** stays `estimate` — ismworld.org's ROB calendar fetched directly today and returned a 302 to `ecommerce.ismworld.org/SSO/Login.aspx`, independently re-confirming the sibling's gated-primary limit; 2026-10-01 is a Thursday with no holiday, so the first-business-day rule lands there and aggregators converge. **The rule was tested out-of-sample:** PRNewswire's July ISM release datelines **2026-08-03** (2026-08-01 was a Saturday) — which confirms the cadence rule *and* records that the [`09-01 sibling`](ism-manufacturing-2026-09-01.md) dates that release 08-01 in four places; not edited there (rows are append-only), corrected here, and it matters because that doc's reaction leg is pinned to a session that did not exist. **Base rates established:** ISM 2026 = 52.4 · 52.7 · 52.7 · 54.0 · 53.3 · **55.6** (Feb→Jul), a 3.2pt range, largest monthly move +2.3, six-month sample σ ≈ **1.2**, seventh straight month above 50 after eleven at-or-below through Dec 2025 — against Chicago's trailing-12m σ **7.59** and 47.1–62.7 range. Different windows; the order of magnitude is the point, and it says Chicago's 47.1 does not extrapolate. July subcomponents (PRNewswire primary): New Orders 56.7, Production 58.5, Employment 52.8, Supplier Deliveries 58.9, Inventories 51.2, **Prices 71.1**, Backlog 55.0, New Export Orders 53.0. Adjacency sweep — **peers:** n/a, `symbols: []`; nearest tracked prints are MSFT 10/27, GOOG+META 10/28, AAPL+AMZN 10/29, all outside the window. **Macro surprises:** Warsh's 2026-08-28 Jackson Hole keynote pinned the hawkish case to inflation and drove September hike odds ~35% → 56–59% (sibling [`jackson-hole`](jackson-hole-2026-08-28.md) close-out) — carried, not re-derived; it is why Prices outranks the headline in this doc's reading order. **Volatility regime:** VIX **14.51** (`event-material-scan` probe, 2026-08-28 close) — baseline established, nothing to diff against yet. **Geopolitical/policy — the material finding:** FY2026 funding lapses end of **2026-09-30**, so a shutdown would begin the morning of this print. Senate passed a CR to Dec 11 on 08-08 (90–6); House passed its own to Dec 4 on 07-21 (220–205); **neither enacted**, reconciliation still required and the signature "remains uncertain" (Conference Board + CRFB FY2027 tracker, both 2026-08-12); House returned 08-31 to take up the Senate version, vote expected first week of September, White House SAP supportive. Why it lands here: **ISM is private and publishes through a lapse; BLS does not** — in the 2025 lapse BLS skipped the October Employment Situation (household data never collected, not retroactively) and cancelled the October CPI outright, first break in 77+ years. So in the un-averted branch the **10-02 payrolls do not print and this becomes the corridor's only hard read**, into an Oct 27–28 FOMC with no SEP. **Event tape:** no September consensus, whisper or prediction-market bin exists at D-33 (calendars carry the date, no forecast) — the sibling found none at D-13 and a full Polymarket distribution by D-8, which is the expected timing. Also recorded: the 08-03 print beat by 1.6pt while the 10Y **fell ~6bp to 4.688%** and equities rallied (Dow ATH 53,178.41 +1.32%, S&P +1.48%, Nasdaq +2.1%) — the opposite sign to this calendar's working yield-channel story, confounded by weekend risk-off headlines, and recorded as a non-finding rather than a reversal. **New dated adjacency found → proposed in this PR:** the **FY2027 funding deadline / shutdown trigger** is not on the calendar at all despite falling the night before this print and gating whether the 10-02 payrolls exist; added as `government-funding-deadline-2026-09-30`, `status: estimate` (`NEWS:`), with the `geopolitical` kind used for a domestic policy checkpoint and that imperfect fit named rather than fixed from this lane. | — (stance set) | 2026-09-05 (high, ≥21d band: every 7d) |

**Rules.** Rows append only — editing a past row is falsification. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed to `market-events.ts` as an `estimate` in
the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first),
never from memory — after which this doc goes quiet.
