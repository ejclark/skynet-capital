# 7-Year Treasury Note auction — treasury-7y-note-2026-08-27

**Kind:** rates · **Date:** 2026-08-27 (confirmed, TSY: treasurydirect.gov upcoming auctions — announced,
1:00pm ET, checked 2026-08-18) · **Impact:** medium
**Last assessed:** 2026-08-26

## At a glance

**TL;DR.** This is a routine month-end belly-of-the-curve Treasury auction, not a symbol-keyed trade
signal — it carries no tracked tickers. The 7-year tenor has a real historical reputation for being the
softest-demand note in the coupon block, and 2026's two most recent 7-year prints (Jun 25: bid-to-cover
2.50, indirect 57.6% vs a 64.8% six-month average; Jul 28: bid-to-cover 2.49, yield up to 4.47% from
4.26%) read as soft-but-not-disastrous, in line with that reputation rather than an outlier break from
it. The bigger story for 2026-08-27 is timing, not the auction itself: it lands the day after NVDA's
confirmed after-close print (2026-08-26) and the same day as MRVL's confirmed print, stacked alongside
the 5-Year Note auction, PCE, and the second GDP estimate all landing 2026-08-26. A weak tail here is
more likely to get lost in NVDA-reaction noise than to move the tape on its own — unless NVDA disappoints
and risk-off compounds. No position is licensed by this doc; it exists to sharpen the risk read around
that week for rate-sensitive long-duration names already being tracked (NVDA and peers).

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (8/19) | Stand aside | High | 8 days out; medium-impact, symbol-less rates event — nothing here licenses action yet. | Nothing at 8 days out; a symbol-less rates event licenses no action |
| This week (8/19–8/23) | Stand aside | High | Pre-auction; the 5Y/7Y/NVDA/MRVL/PCE/GDP stack is next week, not this one. | The **2026-08-26** 5Y result setting a concession tone the 7Y visibly inherits |
| This month (into 8/26–8/27) | Watch | Medium | 5Y auction (8/26) sets the concession tone the 7Y inherits the next morning, same day NVDA's overnight reaction and PCE/GDP hit the tape — a genuinely stacked-risk session for anything rate- or duration-sensitive. | A markedly weak print — bid-to-cover well under ~2.40, tail beyond ~1.5bp, indirects materially below trend |
| This quarter (Q3) | Watch | Medium | Feeds the belly-of-curve softness narrative into the Sep 9–24 coupon block (10Y/30Y/20Y/7Y) and the Sep 16 FOMC; context for the rates read on long-duration AI names, not a standalone trade. | A clean print — bid-to-cover near or above the ~2.50–2.64 band with a tail near zero — killing the belly-softness narrative |

**Signals & conditions** (all confirmed-status auction; a weak print still only *widens caution*, never
licenses a new trade on its own):
- 7Y bid-to-cover **< ~2.40** or a tail **> ~1.5bp** vs when-issued on 8/27 → confirms belly-of-curve
  weak-demand read; treat as compounding risk-off if it lands alongside a soft NVDA reaction, not as an
  independent signal.
- Indirect (foreign) bidder share **< ~55%** → continues the pullback seen in the Jun 25 print
  (57.6% vs 64.8% six-month avg); a second consecutive miss would be worth naming explicitly at the next
  pulse check.
- 5Y auction (8/26) tails badly (BTC well under recent norms, per its own note "stacked-risk session")
  → raises the bar for what counts as a "clean" 7Y the next day; a clean 7Y after a dirty 5Y is itself
  informative.
- NVDA prints strong AC 8/26 and risk appetite is high → expect the 7Y's result to get comparatively
  little tape attention regardless of its own quality — the flagged adjacency risk.
- VIX regime elevated (>20) heading into 8/26–27 → any auction softness reads larger than the same
  numbers would in a calm tape; check the adjacency sweep's volatility-regime step at the next pulse.

## Initial research

**Question:** does the 7-year note's reputation as the coupon block's weakest-demand tenor still hold in
the current (2026) auction cycle, and does the auction's proximity to NVDA's and MRVL's confirmed prints
change how much the tape will care about the result either way?

**Verdict in one line:** the reputation is real but not currently the sharpest edge in the belly of the
curve — the **5-year**, not the 7-year, has been 2026's weakest print — and the calendar stacking is a
documented fact, not a forecast: NVDA (AC 8/26), the 5Y auction (8/26), PCE (8/26), GDP 2nd estimate
(8/26), and MRVL (8/27) all sit on top of this auction, which is exactly the kind of session where a
routine auction result gets buried under earnings-tape noise rather than moving markets on its own.

**Method:** primary-source auction results (treasurydirect.gov / fiscaldata.treasury.gov auction result
PDFs) plus dated financial-press coverage of the two most recent 2026 7-year prints and the immediately
preceding 5-year print, cross-checked against `src/domain/market-events-data.ts` and
`src/domain/earnings-calendar.ts` for the adjacent confirmed dates already on the calendar. Web research
performed 2026-08-19.

### Leg (a) — "the 7-year has a durable historical reputation as the weakest-demand tenor" → **MIXED**

- Supporting history: Jan 2024 7Y bid-to-cover 2.23, described in contemporaneous coverage as "one of the
  worst on record" (search-aggregated financial press, dated Jan 2024); Apr 2025 7Y bid-to-cover 2.55 vs
  a 2.64 ten-auction average ("below average demand," Nasdaq/RTTNews, Apr 2025); Sep 2021 7Y auction
  widely previewed as risking a "disastrous" result on weak 2Y/5Y bidding metrics (Saxo Group, Sep 2021);
  Mar 2026 7Y described as showing "noticeable declines in demand, higher [dealer] absorption, and
  greater auction tails than normal" (aggregator summary of Mar 2026 coverage, incl. CRFB's "Weak
  Auctions Underscore Risks of our Growing Debt Burden," 2026-03-31).
- Complicating evidence: in the two most recent 2026 prints (Jun 25, Jul 28 — see Leg (b)), the 7-year's
  own numbers were soft-but-ordinary, while the **5-year** auction on Jul 27 was reported as
  "historically weak" with bid-to-cover at its **lowest level in nearly five years** and indirect bidding
  the **weakest since July 2025**, tailing the when-issued yield at its **highest level since December
  2024** (TFTC market summary, dated Jul 2026, sourced to that week's auction results). The same week's
  2-year auction was comparatively strong (bid-to-cover 2.662, "one of the cleaner 2-year auctions in
  months"). Read together: the belly-of-curve softness in mid-2026 is real, but the *worst* prints
  currently sit at the 5-year, not the 7-year — the reputation is directionally right but not the most
  precise description of exactly where 2026's weakness concentrates.
- **Caveat:** the "worst on record" framing for Jan 2024 and the tenor-ranking claims come from
  press/aggregator summaries, not a systematic multi-year statistical comparison across all tenors — this
  doc did not build that comparison itself.

### Leg (b) — "2026's 7-year prints reflect real, current belly-of-curve demand softness" → **SUPPORTED (soft-not-disastrous)**

Two most recent 7-year note auctions, primary/near-primary sourced:

| Date | High yield | Bid-to-cover | Indirect | Direct | Dealer | Source |
|---|---|---|---|---|---|---|
| 2026-06-25 | 4.260% | 2.50 | 57.6% (vs 64.8% 6-mo avg) | 29.7% (vs 24.3% avg) | 12.8% (vs 10.9% avg) | investinglive.com / cryptobriefing.com, dated 2026-06-25 |
| 2026-07-28 | 4.473% (median 4.405%, low 4.300%) | 2.49 | not isolated in sources found | — | — | Exante Data auction summary (X/Twitter, dated 2026-07-28) + treasurydirect.gov result PDF `R_20260728_2.pdf` (image-based, not machine-readable via fetch) |

Reading: bid-to-cover held essentially flat (2.50 → 2.49) while the stop-out yield rose ~21bp
month-over-month, consistent with the broader Jul 2026 rate backdrop (this repo's own 20Y/30Y-TIPS
event notes flag an Aug-18 bond sell-off and pre-auction concession into that week). Indirect demand in
June ran meaningfully below its own six-month average — a genuine, if modest, foreign-demand pullback —
while direct and dealer participation absorbed the slack. Overall characterization in the June write-up:
"a little lower than average," not a rout.

**Caveat — data-quality limit:** the Jul 28 indirect/direct/dealer breakdown was not independently
recovered; the official treasurydirect PDF is a scanned/image document that a text fetch cannot parse,
and the numbers reported here rely on a third-party (Exante Data) summary. Re-verify against
fiscaldata.treasury.gov's structured auction-results dataset before citing exact Jul 28 bidder shares
elsewhere.

### Leg (c) — "the Aug 27 auction lands in a session dominated by NVDA reaction / MRVL positioning, and may get less attention than usual or compound a risk-off tape" → **SUPPORTED as a structural/calendar fact; the market-reaction half is a forecast, not something testable yet**

Confirmed in this repo's own calendars, cross-checked 2026-08-19:
- `src/domain/earnings-calendar.ts`: NVDA confirmed 2026-08-26 after-close (IR: nvidianews.nvidia.com);
  MRVL confirmed 2026-08-27 post-close (IR: investor.marvell.com).
- `src/domain/market-events-data.ts`: the 5-Year Note auction (2026-08-26) already carries the note
  "Belly supply; lands the same day as the NVDA print + PCE — a stacked-risk session"; PCE
  (2026-08-26, BEA) and the GDP 2nd estimate (2026-08-26, BEA) both land the same day; this 7-year
  event's own existing note already says "the 7Y is the historically wobbliest of the coupon block."
- So the stacking is real and dated, not speculative: **Wed 8/26** carries the NVDA print, the 5Y
  auction, PCE, and GDP; **Thu 8/27** carries this 7Y auction and the MRVL print. Whether the tape
  actually pays *less* attention to the 7Y that day, or *more* (if NVDA disappointed and risk-off is
  already running), is a directional call this doc does not have evidence to score yet — it is exactly
  the kind of thing the next pulse check (due 2026-08-26, the day before) should re-read once the NVDA
  reaction is known.

### What plays the conditions support

None, directly — this event carries **no symbols**, and house rules (`docs/plans/trade-playbooks.md`)
require a `confirmed` date for date-keyed action even where a symbol exists; a rates auction with no
attached ticker licenses **monitoring, not entries**. The load-bearing use of this research is as an
input to the NVDA print playbook already on file
([`nvda-aug-2026-print.md`](../nvda-aug-2026-print.md)): its own P0 guard ("no unhedged share position
past D-1," "confirm the print date," "no entries in the first hour") already covers the 8/26–27 window;
this doc adds one refinement — if the 5Y (8/26) or 7Y (8/27) auctions both tail badly, that is
incremental evidence for a risk-off tape and argues for *more* caution around any post-print NVDA share
entry (P3 in that doc), not less. No new trade is proposed here.

### Honest limits

- The Jul 28 7-year bidder-composition breakdown (indirect/direct/dealer %) could not be independently
  confirmed from a machine-readable primary source in this session — the official PDF is image-based and
  the number relied on a third-party X/Twitter summary. Flagged above; re-verify before repeating those
  figures.
- The Aug 27 2026 auction's own size/announcement had not yet been observed directly (the formal
  announcement pattern for this tenor runs ~5–6 business days prior, i.e. around 2026-08-20) — this doc
  relies on the tentative-schedule-based `confirmed` status already set on the calendar entry, which this
  doc does not and must not alter.
- "Weakest tenor" claims for 2024/2025/early-2026 come from press/aggregator characterizations
  ("worst on record," "below average"), not a from-scratch multi-tenor statistical study built by this
  doc.
- The Leg (c) market-attention claim (auction gets less/more notice under NVDA's shadow) is a forecast,
  not yet observable — it is explicitly flagged as such and deferred to the next pulse check.
- Educational, paper-standard context throughout; this is research, not action, and every trading-
  adjacent statement above is written to be honest about the event's `confirmed` status without implying
  any auction-outcome prediction is itself confirmed.

## Stance & kill switches

**Stance: stand aside.** No new position is initiated or implied by this auction. Treat 2026-08-26
through 2026-08-27 as a heightened-monitoring window for existing rate-sensitive, long-duration positions
(NVDA and peers per the NVDA print doc) rather than as a signal to act on the auction itself — the event
carries no symbols and medium impact, and its main value is context for that week's rates backdrop.

**Kill switches (what would change this stance):**
- A markedly weak 7Y print (bid-to-cover well under ~2.40, tail beyond ~1.5bp, indirect materially below
  the 55–58% band seen in the last two prints) **landing alongside a disappointing NVDA reaction** would
  escalate this from "context" to "a real risk-off compounding factor" worth naming explicitly in the
  NVDA/MRVL stance, not just this doc.
- A clean 7Y print (bid-to-cover back near/above the ~2.50–2.64 recent-average band, tail near zero)
  removes the belly-of-curve concern for this cycle and would be noted as such at the next pulse check.
- No forward-test entry is registered in `forward-tests.md` for this event — a Treasury auction result is
  not a directional equity prediction of the kind that ledger scores, so none is proposed here.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-08-19 | D8 | Initial research banked. 7-year's weak-demand reputation is real historically (Jan 2024 BTC 2.23, Apr 2025 BTC 2.55 vs 2.64 avg, Mar 2026 wider-than-normal tails) but the *sharpest* 2026 softness currently sits at the 5-year (Jul 27: BTC lowest in ~5yrs, indirect weakest since Jul 2025), not the 7-year, whose Jun 25/Jul 28 prints were soft-not-disastrous (BTC 2.50 → 2.49, yield 4.26% → 4.47%, Jun indirect 57.6% vs 64.8% avg). Adjacency confirmed and dated: this auction lands the day after NVDA's confirmed 8/26 AC print and the same day as MRVL's confirmed 8/27 print, with the 5Y auction/PCE/GDP also stacked onto 8/26 — a genuinely compound-risk session where the 7Y result is more likely to get overshadowed by the NVDA reaction than to move the tape on its own, unless NVDA disappoints and risk-off compounds through the auction. | — (stance set) | 2026-08-26 |
| 2026-08-24 | D3 | Adjacency sweep. Peers/event tape: MRVL's own doc (prints same day, 8/27) logs a major move since D8 — MRVL spiked +5.79% on a disclosed Google/Alphabet warrant deal (8/19/8/20), then round-tripped essentially the entire gain by 8/21; MRVL's implied move for its own print jumped ~14%→~18.4%. NVDA's implied move fell ~7.0%→~5.3% over the same window (own doc). Neither changes this auction's own demand read directly, but both raise how much idiosyncratic single-name noise this compound-risk session (NVDA AC 8/26, 5Y auction + PCE + GDP 8/26, this 7Y auction + MRVL print 8/27) will carry relative to the 7Y's own signal. Macro: no CPI/jobs/FOMC surprise since 8/19; Sep-16 FOMC read unchanged (hawkish-hold ~60-70%/hike ~30-40%/cut ~0%, per the FOMC sibling doc). Volatility regime: VIX 15.13 (down from the 15.86 cited by sibling docs at D7-equivalent dates) — calm, no shift. Geopolitical: Brent -1.38% to $93.09 on 8/24, first pause in the two-week escalation (new Iran sanctions pending) — same finding as sibling docs. No new 7Y-specific demand data since the Jul-28 auction (this is the next one); no new dated adjacency found. | — (no change; compound-risk framing reinforced, not altered) | 2026-08-27 (event day; next assessment is this event's own outcome) |
| 2026-08-26 | D1 | Final pre-auction pulse (auction is tomorrow, 1:00pm ET). Peers/event tape: MRVL's own doc (D-1 today) logs its implied move deflating sharply back to ~8.5% from the 18.4% Google-deal spike, with the stock +4.49% to $239.60 on 8/25 — a constructive recovery, not fresh stress; NVDA reported this evening (after this pulse ran). Neither is a rates-demand signal directly, but both narrow the idiosyncratic-noise risk this 7Y auction competes with tomorrow, now that both same-week earnings names have de-stressed somewhat. Macro: Sep 15–16 FOMC odds firmed to ~73% hold / 26% hike / 1% cut (Kalshi, checked today) from the ~60-70%/30-40%/~0% split at D8 — hold conviction building, still zero cut priced; belly-of-curve read (leg c) unaffected in direction. Volatility regime: VIX ~15.8 (Bespoke/Fed data, checked 8/25) — calm, no shift; SKEW last confirmed 142.93 (8/19), no fresher print, same gap as sibling docs. Geopolitical: Strait of Hormuz escalated further overnight (tanker hit off Oman 8/25, engine disabled, crew safe) despite Trump's "demined" declaration — an energy-risk-premium input, not yet reflected in any auction result. No new 7Y-specific size/CUSIP or demand data found this pass (result posts tomorrow); no new dated adjacency to propose. | — (stand-aside stance holds; compound-risk framing unchanged into the auction) | 2026-08-28 (event now in the past; close-out expected once the scanner marks it event-passed-unscored) |

**Rules.** Rows append only — editing a past row is falsification. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed to `market-events.ts` as an `estimate` in
the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first),
never from memory — after which this doc goes quiet.

## Outcome

**Assessed 2026-08-28**, from the primary source (TreasuryDirect result PDF, CUSIP 91282CRJ2,
fetched directly this session — `R_20260827_3.pdf`, the machine-readable data this doc's initial
research explicitly could not recover for the prior two prints) cross-checked against wire
coverage (investinglive.com, dated 2026-08-27).

**The print (confirmed via TSY primary PDF + wire).** $44B 7-year note, high yield **4.512%**
(up from Jul 28's 4.473%, continuing the month-over-month rise flagged in Leg (b)) exactly matching
a **4.512% when-issued** level → **0.0bp tail** (better than the ~0.2bp average — no tail at all).
Bid-to-cover **2.50x** (in line with the ~2.49x six-month average, and at the very floor of this
doc's own "clean" band of ~2.50–2.64). Bidder mix: **indirect 60.8%** (below the ~65.1% six-month
average, but *above* the 55.6–57.6% band this doc flagged as the two-print pullback pattern —
a partial recovery, not a second consecutive miss), **direct 27.0%** (above the ~23.1% average,
continuing Jun 25's elevated direct share), **dealer (primary) 12.3%** (roughly flat vs the
~11.8% average). Wire grade: **"C"** — "no tail, bid-to-cover near the average," domestic buyers
more aggressive than international ones.

**Market reaction, auction day (Aug 27).** NVDA's confirmed AC 8/26 print landed strong (guidance
reassured on AI demand; stock **+5.95%** premarket 8/27) — the benign outcome, not the disappoint-
and-compound-risk-off scenario this doc's kill switches were watching for. The 10-year yield rose
for a second straight session to **~4.66–4.67%**, but the driver was the **prior day's PCE print**
(core PCE +0.2% m/m vs +0.1% expected, headline annual 3.7% vs 3.6% expected — a hawkish surprise
that firmed Fed hike odds into the Sep 15–16 FOMC) rather than this auction. No wire coverage
found ties the day's yield or equity move to the 7Y result itself; the print cleared without
incident and, per this doc's own Leg (c) forecast, was overshadowed by the NVDA/PCE tape rather
than driving it.

**Kill-switch scoring (against the pre-registered stance).**
- **"Markedly weak print"** (BTC well under ~2.40, tail beyond ~1.5bp, indirect materially below
  the 55–58% band) — **did not fire.** BTC (2.50) held at the six-month average, the tail was
  zero, not wide, and indirect (60.8%) sat *above* the recent two-print band rather than below it.
- **"Clean print"** (BTC near/above the ~2.50–2.64 band, tail near zero) — **partially fired.**
  The tail condition was met exactly (0.0bp); BTC landed at the floor of the band (2.50x) rather
  than clearly inside or above it — a marginal, not a decisive, clean read.
- **Compounding risk-off via a disappointing NVDA reaction** — **did not fire.** NVDA's print was
  read as strong, not weak; risk appetite was up, not down, into and through the auction.

**Verdict vs. the stance.** The stand-aside, no-new-position call held up as the right read: no
trade was licensed by this event and none should have been. The auction itself printed as an
unremarkable, in-line result — a "C," not a rout and not a standout — continuing this doc's Leg
(b) finding that 2026's belly-of-curve softness has not concentrated at the 7-year specifically;
if anything, indirect demand recovered somewhat from the two-print pullback this doc flagged for a
future pulse check, so that specific watch item is now stood down rather than escalated. Leg (c)'s
forecast (the auction would get less tape attention than usual, buried under the NVDA/PCE stack)
resolved as stated: no news coverage found treats the 7Y result as market-moving on its own. No
forward test in `forward-tests.md` is keyed to this event, so nothing scores there. This doc goes
quiet after this entry per the close-out rule.
