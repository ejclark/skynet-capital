# US general election — president, the full House, one third of the Senate — presidential-election-2028-11-07

**Kind:** geopolitical · **Date:** 2028-11-07 (estimate, EST: statutory and computed — 2 U.S.C. § 7 fixes Election Day as the Tuesday after the first Monday in November of an even year, and November 2028's first Monday is the 6th; re-derived by weekday arithmetic over 1970–2030 on 2026-09-09. The `estimate` label is a taxonomy fact, not date doubt — this calendar has no confirmed prefix for a statute) · **Impact:** high
**Last assessed:** 2026-09-09
<!-- probe-ref: {"symbols":{},"vix":16.24,"daysBand":"high:61+","adjacentIds":["fed-board-closure-2028-11-10"],"screenStreak":0,"blocked":[{"url":"https://cdn.cboe.com/api/global/delayed_quotes/futures/settlements/VX.json","status":"403","at":"2026-09-09"},{"url":"https://cdn.cboe.com/api/global/delayed_quotes/futures/VX.json","status":"403","at":"2026-09-09"},{"url":"https://query2.finance.yahoo.com/v7/finance/options/%5ESPX","status":"401","at":"2026-09-09"}]} -->

## At a glance

**TL;DR.** **Do nothing about this event for roughly two years — but write down now, while it is
cheap and unarguable, the one thing about presidential elections that is actually true, because the
thing everyone repeats is false.** This lane measured both on 24,788 S&P 500 daily bars
(1927→2026-09-08, fetched 2026-09-09). **The famous "stocks rise after an election" statistic is
unconditional drift and is rejected here**: the 12 months after the 13 presidential elections since
1976 averaged **+11.69%, 77% positive** — against an all-periods 1976–2026 baseline of **+10.12%,
77% positive**, with the 13 outcomes scattered from the 4th to the 97th percentile of that baseline.
**What is real is dispersion, not direction**: the session *after* Election Day averaged **1.694%**
in absolute terms against **0.766%** for all November sessions (permutation **P = 0.0029**), **9 of
13** moved ≥1.0% against a **24.5%** November base rate (binomial **P = 0.00084**), it survives
dropping 2008 (**1.396%, P = 0.021**), and it is *presidential*-specific (midterm D+1 absolute mean
**1.127%**). Mean signed D+1 is **−0.324%**, 46% positive — **a big-move day with no side.** That is
a volatility fact banked at **D-790**, and it licenses nothing: `symbols: []`, no house playbook is
calendar-keyed, the `estimate` label forbids date-keyed action, and the two venues that could price
this date today (Cboe, the SPX chain) both refused the fetch. The corridor is empty — nothing on
this calendar within ±60 days except `fed-board-closure-2028-11-10` at D+3 — so two NYSE-sourced
Thanksgiving dates are proposed in this PR to stop the window being blank.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-790) | Stand aside | High | `symbols: []`, 790 days out, `estimate` status forbids date-keyed action, and no playbook (S1/S2/E1/S3/S4 + G1) is calendar-keyed. There is no instrument in this repo that reaches 2028. | A house playbook acquiring a calendar-keyed trigger, or this entry acquiring a non-empty `symbols` list, on or before the **2026-09-23** pulse |
| This week | Stand aside — the only work is bookkeeping | High | Nothing about a 2028 election is week-actionable. The week's own tape is unrelated: VIX **16.24** (09-09) vs **14.53** (09-04), S&P **7673.52**, 10Y **4.81%** (09-08 closes). | A listed instrument quoting a **2028-11** expiry being found by the **2026-09-23** pulse — the "nothing prices this date" premise would fail and a real measurement would become possible |
| This month | Carry the drift control back to [`midterm-elections-2026-11-03`](midterm-elections-2026-11-03.md) — it asked for exactly this number and had no instrument for it | Medium | That ledger rejected the post-midterm-rally statistic as reasoning, noting "no instrument here can compute the unconditional-drift control it asks for." Leg 3 below computes it (**+11.69% vs +10.12%**), which converts a stated opinion into a measurement. | That ledger's **2026-11-03** close-out not carrying the control, or a re-run over a different index/window reversing the sign of the gap, by **2026-10-31** |
| This quarter | Watch the cadence cost, not the politics | Medium | At `high` impact and 790 days out this ledger is due every **14 days**, i.e. ~56 pulses before the event even enters the 21-day band, with the staleness ceiling forcing ~19 full sessions. `symbols: []` means the price probe can never fire, so every screen reads the same. Filed as a `bottleneck` capture, not a policy change. | The **2026-09-23** and **2026-10-07** pulses both being absorbed as deterministic screens with no forced-material row — the cost estimate is then wrong and the capture retires |

**Signals & conditions** — the buy/sell/hold triggers:

- **No buy signal and no sell signal exists off this event, at any horizon.** It is `estimate`-dated
  790 days out with `symbols: []`; research is not action.
- **The post-election-rally statistic is rejected here, and now with the control attached** —
  +11.69% / 77% positive over 12 months is indistinguishable from the +10.12% / 77% unconditional
  baseline. Same correction the [midterm ledger](midterm-elections-2026-11-03.md) and the
  [funding ledger](government-funding-deadline-2026-09-30.md) applied by reasoning; this one is measured.
- **The one measured fact is D+1 dispersion with no direction** — |move| mean **1.694%** vs **0.766%**
  (P = 0.0029), signed mean **−0.324%**. Recorded as a measurement. **It is not a trade**: the
  `estimate` label forbids date-keyed action and nothing in this repo can express it.
- **Nothing this lane could reach prices 2028-11 today** — Cboe's futures JSON **403**'d twice and
  Yahoo's `^SPX` option chain **401**'d (2026-09-09, all three recorded in `probe-ref.blocked`). The
  "no term structure exists this far out" claim is therefore **unverified reasoning, not a reading**.
- **Watch (dated):** the corridor is empty until 2028 — `fed-board-closure-2028-11-10` (D+3,
  estimate) · **thanksgiving-market-closure-2028-11-23** (D+16, estimate, proposed in this PR) ·
  **thanksgiving-half-day-2028-11-24** (D+17, estimate, proposed in this PR). Next pulse **2026-09-23**.

## Initial research

### The question, plainly

This calendar's furthest-out entry sits 790 days ahead. Two questions are worth a session at that
distance, and only two: **is the date right**, and **is there any statement about US presidential
elections that will still be true in 2028 and is worth banking now, before the political noise
starts?** Everything else about 2028 — candidates, polls, prediction-market prices, the vol curve —
either does not exist yet or will be stale before the next pulse reads this line.

**One-line verdict:** the date is certain by statute and by an identity check; the famous
directional statistic about post-election markets is **unconditional drift and is refuted here with
its control computed**; the one durable, significant fact is that **the session after Election Day
is a high-dispersion, no-direction session** — banked as a measurement that this repo currently has
no instrument to act on and no permission to act on.

### Method

Macro/geopolitical mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md). `symbols: []`,
so `earnings-cycle.mjs` / `intraday-edges.mjs` have no target and the cache-busting rule has nothing
to bust. What replaced them is a **direct measurement**, which is unusual for a geopolitical entry
and is the reason this ledger is worth its session: 24,788 split/dividend-adjusted S&P 500 daily
bars (Yahoo `^GSPC`, **1927-12-30 → 2026-09-08**, fetched **2026-09-09**), with Election Day for
every year computed from 2 U.S.C. § 7 rather than looked up. Three statistics, each against a
stated baseline drawn from the same series over **1976–2026**: signed and absolute D+1 return,
election-week return (Friday-before → Friday-after), and 3-month / 12-month forward returns.
Significance by **permutation** (20,000 draws from the matched November-session pool) and by
**binomial** against the November base rate. Current tape readings are this repo's own probe (Yahoo,
**2026-09-09**): VIX **16.24** live, and **2026-09-08** closes S&P **7673.52**, VVIX **88.69**, 10Y
**4.81%**, RSP **216.73**. Two venues that could have priced the date refused the fetch and are
recorded in `probe-ref.blocked` rather than substituted. **No political forecasting is attempted**
and none is banked — see *Honest limits*.

### Conviction legs, tested

1. **The date is certain and the `estimate` label is about taxonomy, not doubt — SUPPORTED.**
   2 U.S.C. § 7 fixes Election Day as the Tuesday after the first Monday in November of an even
   year. November 2028's first Monday is the 6th, so Election Day is **Tuesday 2028-11-07**,
   re-derived here by weekday arithmetic rather than taken from the proposal. Cross-checked by an
   **identity, not a second source**: Veterans Day falls on a Saturday exactly when Nov 7 is the
   Tuesday after the first Monday, so every year that fires this calendar's Board-closure rule —
   **1972, 1978, 1989, 1995, 2000, 2006, 2017, 2023, 2028**, enumerated by computation — has
   Election Day on Nov 7 and the Board closure at **D+3**. The entry stays `estimate` for the
   mechanical reason the sibling [midterm ledger](midterm-elections-2026-11-03.md) recorded: this
   calendar's confirmed prefixes (`IR:`/`BLS:`/`FED:`/`TSY:`/…) have **no member for a statute or an
   election authority**, so promotion needs a schema change out of this lane's scope. A future
   session must not read `estimate` as uncertainty about *when*.

2. **The proposal's D+3 framing is inherited and holds; its impact tier was inherited and is now
   measured — SUPPORTED.** `proposals/presidential-election-2028-11-07.from-fed-board-closure-2028-11-10.json`
   filed `high` impact explicitly "inherited rather than measured" from the midterm sibling. Leg 4
   supplies the missing measurement, and it justifies the tier on **dispersion** grounds rather than
   the directional grounds the tier is usually read as implying. The proposal's own corridor finding
   is re-run here and reproduces exactly: over all **925** tracked events and proposals, nothing
   falls within ±60 days of 2028-11-07 except `fed-board-closure-2028-11-10`.

3. **The post-election rally is unconditional drift — REFUTED, and this is the leg the two sibling
   ledgers asked for and could not compute.** Across the **13** presidential elections 1976–2024,
   the 12-month forward S&P return averaged **+11.69%**, **77% positive**. The unconditional
   1976–2026 baseline over the same series, every start date: **+10.12%**, **77% positive**. The
   3-month cut is the same story — **+3.42%** vs **+2.42%** unconditional. Per-year percentile ranks
   of the 13 post-election 12-month returns against that baseline: **10, 16, 56, 78, 50, 93, 4, 35,
   30, 82, 77, 97, 66** — a near-uniform scatter, which is what "no signal" looks like. The
   [midterm ledger](midterm-elections-2026-11-03.md) rejected the analogous statistic as *reasoning*
   and said so plainly: "no instrument here can compute the unconditional-drift control it asks
   for." **It exists now.** Carried back to that ledger as this doc's concrete deliverable.

4. **The session after Election Day is a genuine high-dispersion, zero-direction session —
   SUPPORTED, and it is the only durable finding here.** For the same n=13:

   | Statistic | Presidential D+1 | Baseline | Test |
   |---|---|---|---|
   | Mean absolute move | **1.694%** | 0.766% (all Nov sessions, n=1,020) | permutation **P = 0.0029** (20k draws) |
   | Mean absolute, ex-2008 | **1.396%** (n=12) | 0.766% | permutation **P = 0.021** |
   | Share ≥ 1.0% | **9 / 13** | 24.5% | binomial **P = 0.00084** |
   | Share ≥ 1.5% | **6 / 13** | 13.4% | binomial **P = 0.0043** |
   | Mean **signed** move | **−0.324%**, 46% positive | +0.040%, 53% positive | — no direction |
   | Midterm D+1, same test | 1.127% (n=12) | 0.766% | presidential-specific, ~1.5× the midterm effect |

   Election-week (Friday→Friday) absolute moves tell the same story at lower resolution: **3.089%**
   vs **1.775%** unconditional, permutation **P = 0.011**, range **−4.26% (2000)** to **+7.32%
   (2020)**. The result surviving the removal of 2008 is what makes it worth banking — it is not one
   crisis year carrying twelve quiet ones. **What this is not:** a trade, a direction, or a
   permission. It is a statement about *how wide the distribution is on one dated session*, which is
   exactly the kind of statement an options book would eventually want and this paper book cannot
   currently express.

5. **Nothing this lane can reach prices 2028-11 today — MIXED, and the honest label is
   "unverified."** The claim worth testing was that no listed instrument extends to a November 2028
   expiry, which would explain why leg 4's dispersion cannot be read off a market price. Cboe's
   delayed-quote futures JSON returned **403** on two endpoints and its settlement page renders
   client-side with no data in the HTML; Yahoo's `^SPX` option chain returned **401**. All three are
   recorded in `probe-ref.blocked` and **the claim is left unverified rather than asserted from
   general knowledge** — the honesty rule is that a blocked source is recorded, never silently
   substituted. What *is* verified is narrower and sufficient for the stance: **this repo's own
   instruments have no reach to 2028**, so leg 4 has no expression here regardless.

6. **The corridor is empty, and that is itself the finding that generates work — SUPPORTED.** The
   ±60-day sweep over all 925 entries returned only `fed-board-closure-2028-11-10`. Two dated,
   **primary-sourced** adjacencies were found by direct fetch of nyse.com/markets/hours-calendars
   (**2026-09-09, HTTP 200 after its 302, 109,180 bytes**) and are proposed in this PR: its 2028
   column reads **"Thursday, November 23\*\*\*"** for Thanksgiving, and footnote \*\*\* names
   **"Friday, November 24, 2028 (the day after Thanksgiving)"** as a 1:00 p.m. ET early close
   verbatim. Both file `estimate` under open issue **#2552** — the confirmed-prefix taxonomy has no
   member for an exchange operator's hours page, which currently strands **37 of 37** closure
   entries at `estimate`. They matter to *this* ledger because leg 4 is an attribution claim about
   sessions near the election, and D+16/D+17 being shut and half-length is a precondition for
   reading anything off that window.

7. **The cadence cost of this entry is measurable and worth capturing before it is paid —
   SUPPORTED.** `assessment-cadence.json`'s `high` tier reassesses every **14 days** beyond 61 days
   out. At **D-790** that is **~56 pulses** before this event reaches the 21-day band. The
   deterministic screen (issue #724) absorbs most pulses cheaply — but its price check cannot fire
   on `symbols: []`, its adjacency check has one static neighbour, and its **staleness ceiling
   forces every third consecutive screen to be material**, so the arithmetic is roughly **19 forced
   Claude sessions** on an event whose honest content will not change for a year. This is captured
   as a `bottleneck` (CLAUDE.md: capture the instant it is measured, pursuit is delegated) and
   **explicitly not acted on** — narrowing a cadence band is a policy change, not this lane's call.

### What the conditions support

**A measurement banked and a control delivered — no position, at any horizon.** Concretely: (a)
nothing to do about 2028-11-07 for roughly two years; (b) carry leg 3's unconditional-drift control
back to [`midterm-elections-2026-11-03`](midterm-elections-2026-11-03.md), which named the gap and
could not fill it, before that ledger's 2026-11-03 close-out has to reason about the same statistic
again; (c) hold leg 4 as the single durable claim this event contributes and register it as
**FT-presidential-election-2028-11-07-1**, scored at the event's own close-out from re-run data;
(d) file the leg 7 cadence arithmetic as a `bottleneck` capture rather than touching cadence policy.

### Honest limits

**This doc makes no political claim whatsoever, and that is deliberate rather than a gap.** At
D-790 there are no candidates, no nominees, no polls worth a citation and no prediction-market
depth; anything written here about *who wins* would be stale before the 2026-09-23 pulse and would
contaminate a ledger whose measured content is durable. **Leg 4 is n=13 and always will be** —
presidential elections arrive four years apart, so no amount of waiting fixes the sample, and the
permutation and binomial tests are run against a *November* pool that shares its regime with the
election weeks themselves (they are drawn from the same 50 years, so the baseline is not fully
independent of the treatment). The ex-2008 robustness check is the honest guard against a single
crisis year carrying the result, and it is the number a sceptic should quote (**1.396%, P = 0.021**),
not the headline. **Leg 3's refutation is a comparison of means over overlapping windows** — the
12-month baseline uses every start date, so its observations are heavily autocorrelated and the
"77% vs 77%" agreement is more persuasive than the point estimates. **Leg 5 is unverified**: two
venues refused the fetch, and the statement "no listed instrument reaches 2028-11" is reasoning this
lane could not check. **The single fastest-decaying line in this document is the tape reading** —
VIX moved **14.53 → 16.24** in three sessions while this was being written. Finally, the whole
document rests on one price series from one vendor; nothing here was cross-checked against a second
index or a second data provider.

## Stance & kill switches

**Stance (date statutory and computed, outcome unknown, entry filed `estimate` at D-790).** Take
**no position, no hedge and no sizing change** off this event, at any horizon on the sheet above,
and expect that to remain the correct answer for roughly two years. The event's entire value to this
book today is **archival and methodological**: it supplies the unconditional-drift control that two
sibling ledgers rejected a statistic *without*, and it banks one significant, robustness-checked
fact — **the session after a presidential election is ~2.2× the ordinary November session in
absolute terms with no directional tilt** — at a moment when nobody has any incentive to bend it.
No probability is placed on any political outcome, and none will be until an instrument exists that
could use one; stating a forecast here would be false precision of exactly the kind the
[midterm ledger](midterm-elections-2026-11-03.md) refused. The `estimate` label forbids date-keyed
action and `symbols: []` means there is nothing to key it to.

**Kill switches:**

- **The S&P's absolute move on 2028-11-08 is under 1.0%** — leg 4's dispersion finding fails its
  first and only out-of-sample test (**FT-presidential-election-2028-11-07-1** scores a kill), and
  the one durable claim this ledger contributes goes to the sweep doc's kill list.
- **A re-run of leg 3 over a different index or a non-overlapping window shows post-election
  12-month returns beating the unconditional baseline by more than 3 percentage points** — the
  refutation was an artifact of `^GSPC` and overlapping windows, and the deliverable carried to the
  midterm ledger has to be withdrawn rather than adjusted.
- **This entry acquires a non-empty `symbols` list** — the transmission channel stops being generic
  and the stance's "nothing to key it to" premise dies; the horizon sheet needs rewriting, not
  updating.
- **A house playbook (S1/S2/E1/S3/S4 + G1) acquires a calendar- or macro-keyed trigger** — leg 4
  becomes expressible, and "banked but unusable" is no longer the honest description.
- **Cboe or an equivalent venue becomes reachable and shows a listed 2028-11 expiry with a visible
  election bump** — leg 5 resolves the way it was written to resolve, and the ledger gains a market
  price to test its own measurement against for the first time.
- **The 2026-09-23 and 2026-10-07 pulses are both absorbed as deterministic screens with no forced
  material row** — leg 7's ~19-session cost estimate is wrong, and the `bottleneck` capture retires
  unfired rather than being pursued.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-09 | D-790 | Initial research banked (above); **canonical `src/domain/market-events/presidential-election-2028-11-07.json` written** after reading the sole prior proposal (`.from-fed-board-closure-2028-11-10`), now inert — its date, D+3 identity and corridor finding all reproduce, its `high` tier was self-declared "inherited rather than measured" and is measured here. **Date:** re-derived, not accepted — 2 U.S.C. § 7 + weekday arithmetic over 1970–2030 gives 2028-11-07, and the Veterans-Day-on-a-Saturday identity puts Election Day on Nov 7 in all nine firing years (1972…2028). Stays `estimate` on taxonomy only (no confirmed prefix for a statute), never date doubt. **Measurement (this ledger's contribution):** 24,788 `^GSPC` daily bars, 1927→2026-09-08, fetched 09-09. **Refuted** — the post-election rally is unconditional drift: 12m forward +11.69%/77% positive (n=13, 1976–2024) vs +10.12%/77% baseline (1976–2026, all start dates), 3m +3.42% vs +2.42%, and the 13 outcomes rank at percentiles 4→97 of the baseline. This is the exact control [midterm-elections-2026-11-03](midterm-elections-2026-11-03.md) said it had no instrument to compute — **carried back to it as a deliverable**. **Supported** — D+1 is dispersion without direction: mean \|move\| 1.694% vs 0.766% (all Nov sessions, permutation P = 0.0029 / 20k draws), 9-of-13 ≥1.0% vs a 24.5% base (binomial P = 0.00084), 6-of-13 ≥1.5% vs 13.4% (P = 0.0043); survives dropping 2008 (1.396%, P = 0.021, n=12); presidential-specific (midterm D+1 1.127%, n=12); signed mean −0.324%, 46% positive. Week (Fri→Fri) \|move\| 3.089% vs 1.775%, P = 0.011, range −4.26% (2000) to +7.32% (2020). **Registered: FT-presidential-election-2028-11-07-1**, score-by 2028-11-09. **Adjacency sweep — peers:** n/a, `symbols: []`. **Corridor:** run mechanically over all 925 entries + proposals — nothing within ±60 days except `fed-board-closure-2028-11-10` (D+3). **Two dated adjacencies found → proposed in this PR**, both primary-sourced by direct fetch of nyse.com/markets/hours-calendars (09-09, HTTP 200, 109,180 bytes): `thanksgiving-market-closure-2028-11-23` (2028 column: "Thursday, November 23\*\*\*") and `thanksgiving-half-day-2028-11-24` (footnote \*\*\*, verbatim: "Friday, November 24, 2028 (the day after Thanksgiving)"), both `estimate`/`NEWS:`/`low` under the #2552 taxonomy gap. **Blocked, recorded not substituted:** cboe.com futures JSON 403 (×2 endpoints) and Yahoo `^SPX` option chain 401 — so leg 5's "nothing prices 2028-11 today" is **unverified reasoning**, not a reading. **Volatility regime — baseline set:** VIX **16.24** live 09-09 vs 14.53 on 09-04 (+1.71 in three sessions, past the screen's own 3-point materiality threshold if repeated); 09-08 closes S&P 7673.52 (7718.60 on 09-04), VVIX 88.69 (84.42), 10Y 4.81% (4.78%), RSP 216.73. **Macro/geopolitical:** nothing at D-790 is attributable to this event; no political content is banked, deliberately (see Honest limits). **Bottleneck captured:** `high` tier × 790 days = ~56 pulses at 14d, and with `symbols: []` the screen's price check can never fire, so the staleness ceiling forces ~19 full sessions on an event whose content will not move for a year. Filed as a capture; cadence policy untouched. | — (stance set: stand aside at every horizon; archival and methodological value only) | 2026-09-23 (high, 61+ band: every 14d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-presidential-election-2028-11-07.json`
(`status: "estimate"`) in the same PR — your own file, never another event's canonical one (#1717).
Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from
memory — after which this doc goes quiet.
