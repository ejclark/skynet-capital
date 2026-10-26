# CBRS IPO lockup ends — Cerebras Systems, 180 days after its 2026-05-13 prospectus — cbrs-lockup-expiry-2026-11-09

**Kind:** lockup-expiry · **Date:** 2026-11-09 (estimate, EST: 424B4 https://www.sec.gov/Archives/edgar/data/2021728/000162828026035214/cerebras-424b4.htm re-read in full 2026-10-20 — 2026-11-09 is the LATEST the final release can happen; it moves earlier only if Q3 results come out on or before 2026-11-04) · **Impact:** high
**Last assessed:** 2026-10-20
<!-- probe-ref: {"symbols":{"CBRS":124.66},"vix":17.72,"daysBand":"high:8+","adjacentIds":["adp-employment-2026-11-04","boe-decision-2026-11-05","boj-minutes-2026-11-05","boj-summary-of-opinions-2026-11-10","bund-30y-auction-2026-11-11","bxdc-lockup-expiry-2026-11-09","cpi-2026-11-10","crwv-2026-11-10-print","eia-steo-2026-11-10","eurostat-hicp-flash-2026-11-04","existing-home-sales-2026-11-12","intl-trade-full-report-2026-11-04","ism-services-2026-11-04","jgb-10y-auction-2026-11-05","jgb-30y-auction-2026-11-10","jgb-5y-auction-2026-11-12","jobs-2026-11-06","mts-october-2026-11-12","ppi-2026-11-13","productivity-costs-q3-2026-11-05","russell-recon-preliminary-2026-11-13","sifma-bond-market-closure-2026-11-11","sp-global-investment-manager-index-2026-11-10","treasury-10y-note-2026-11-10","treasury-30y-bond-2026-11-12","treasury-3y-note-2026-11-09","treasury-buyback-10y20y-2026-11-04","treasury-buyback-1mo2y-2026-11-05","treasury-coupon-announcement-2026-11-12","treasury-refunding-2026-11-04","umich-sentiment-prelim-2026-11-06","us-china-tariff-truce-expiry-2026-11-10","wholesale-trade-2026-11-09"],"adjacentStrongIds":["cpi-2026-11-10","jobs-2026-11-06"],"screenStreak":0,"blocked":[{"url":"https://cdn.cboe.com/api/global/delayed_quotes/options/CBRS.json","status":"307 (followed to cdn-api.cboe.com, 200)","at":"2026-10-20"}]} -->

## At a glance

**TL;DR.** Stand aside (estimate-dated event: this widens caution, it never licenses a trade). The filing shows Cerebras' lock-up is a staircase, not a cliff: about 171M of its 215M shares were scheduled to unlock in dated steps from the IPO through 2026-10-28, so the 2026-11-09 step is only about 14M shares (roughly 1.5 days of trading volume). The stock is already $124.66, 33% under its $185 IPO price and 60% under its first close, and its options show no extra premium for the unlock date. The bigger scheduled risks that week are Cerebras' own Q3 report (est. 2026-11-11; its last two reports were -19% and -13% against semiconductors), CPI on 11-10 and the CoreWeave print (est.) on 11-10.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | Stand aside — no position (estimate event) | medium | -33% vs IPO price, 16% drop in five sessions; ~14M shares left to unlock; nothing in the tape licenses an entry | Oct 28 tranche day (19.4M shares, ~2x volume) closes up ≥5% vs SMH: supply no longer sets the price — revisit on 2026-10-28 |
| This week | Stand aside | medium | Realized vol ~75% (a normal day is ±4.7%); no CBRS-specific scheduled catalyst before the 10-28 tranche | A Q3 release date announced on or before 2026-11-04 (unlock then moves earlier) |
| This month | Flat into the unlock; watch the 10-28 tranche first | medium | The unlock is mostly already priced in the staged releases; Nov 9-10 also carries CPI and the CoreWeave print (est.) | 2026-11-10 close: cumulative CBRS move vs SMH from 11-06 worse than -7% (FT-2) |
| This quarter | Avoid until two sessions after the Q3 print (est. 2026-11-11) | low | Both prior reactions were large and down; guidance on a company this young is unreadable from here | Q3 print holds the gap: CBRS closes the session after the print above its pre-print close, dated 2026-11-12 |

**Call:** wait until 2026-11-09

**Signals & conditions** — the buy/sell/hold triggers:

- **Buy signal:** no — estimate-dated event, a name 33% under its IPO price, and no instrument here shows an edge; "stand aside" is the call
- Date shifts earlier: an 8-K Item 2.02 or press release dated on or before 2026-11-04 makes the final release the second trading day after it (FT-3)
- 2026-10-28 (19.4M-share tranche): a close worse than -5% vs SMH on heavy volume says tranches still move the stock — treat 11-09 with more caution, not less
- An underwriter early-release announcement (Morgan Stanley, Citigroup, Barclays may release at any time) would pull supply forward
- Insider Form 144 / Form 4 filings turning from ~1.8M shares sold in two months to several million a week: insiders are selling the released stock

## Initial research

### The question
Does the CBRS lock-up expiry on 2026-11-09 put enough new supply on the market to be worth a position, a hedge, or a stand-aside, and on what date does it actually fire?

**Verdict: the date is real but the supply is mostly gone — stand aside.** The 424B4 releases the bulk of insider shares in 10 dated steps through 10-28, so 2026-11-09 is only the last, smaller step (~14M shares, derived below). Both labels stay `estimate`: the date can only move earlier, never later, and any trading-adjacent line here carries that label.

### Method
Read the 424B4 end to end (EDGAR, fetched 2026-10-20) for the lock-up clause, the staged release table ("Shares Eligible for Future Sale") and the share count; EDGAR submissions API for 8-Ks and Form 144s; Yahoo daily bars for CBRS, SMH, QQQ, NVDA, AMD, CRWV, ^VIX (fetched 2026-10-20 during the session, so the 10-20 bar is partial); Cboe's delayed option chain (snapshot 2026-10-20 10:34 ET, spot 123.61). `earnings-cycle.mjs` and `intraday-edges.mjs` were not run: the name has 110 sessions of history and two reports, below what either instrument can read. `research:dossier` could not run (`tsx` missing in this checkout); the calendar and `docs/research` hold no other CBRS ledger, forward test or kill-list entry (grepped).

### Leg 1 — the date: SUPPORTED, with an earlier-only wrinkle
The lock-up runs to "the earlier of (i) 6:00 a.m. Eastern Time on the second trading day following our release of earnings for the quarter ending September 30, 2026 or (ii) 180 days after the date of this prospectus". 180 days after 2026-05-13 is 2026-11-09 (a Monday). Earnings-release arithmetic: a release on Wed 11-04 unlocks 11-06; Thu 11-05 unlocks 11-09 (same day); anything later leaves the 180-day date in force. Cerebras' history: Q1 8-K 2026-06-23, Q2 8-K and 10-Q both 2026-08-12 (day 43 after quarter-end). Day 43 after 09-30 is 2026-11-12; aggregators project 2026-11-11 after the close (company has not announced). So the date holds unless Cerebras reports at least a week ahead of its only on-cadence precedent. The text says the period ends "180 days after"; whether the first sellable session is 11-09 or 11-10 is not settled by the filing, so the tests below score both sessions together.

### Leg 2 — supply: REFUTED as a cliff
The staged table: 2.5M (first trading day) + 2.5M (second day, since the first-day close of $311.07 exceeded 133% of the $185 IPO price) + 27.7M (second trading day after Q1 results) + 36.4M (after Q2 results) + 14.6M on each of 08-19, 09-02, 09-16 + 19.4M on each of 09-30, 10-14, 10-28 = **171.1M, exactly the filing's own "up to approximately 171.1 million shares will be released ... during the Lock-up Period"**. The IPO sold 30.0M Class A shares and 185.1M Class B shares were outstanding (215.1M total). So the final step is derived at 215.1 − 30.0 − 171.1 = **~14.0M shares: 6.5% of shares outstanding, ~1.5 days of the 20-day average volume of 9.5M**. That subtraction is mine, not the filing's: it ignores the 4.5M over-allotment option, RSUs whose service condition is met by 11-09 ("Eligible Securities" include them), 21.5M vested options, and the OpenAI warrant's Class N shares (excluded from the 215.1M). Treat 14M as the central figure and 14–30M as the honest band. The 10-28 step (19.4M, ~2.0 days of volume) is bigger than the final one. Affiliates remain bound by Rule 144 volume limits after 11-09 (the greater of 1% of Class A, ~300K shares at IPO, or four-week average volume).

### Leg 3 — price and run-up: MIXED (the usual pullback premise is absent)
IPO $185; first-day open $350, close $311.07 (+68%); 10-19 close $120.66 is the lowest close since listing; 10-20 partial $124.66 (-32.6% vs IPO, -59.9% vs first close, -40% since 09-21's $208.49). Five-day drop 16.4% (10-13 $149.09) against CRWV -18.4%, AMD -9.9%, SMH -6.3%, NVDA -4.6%, QQQ -3.0%: a sector sell-off with CBRS the high-beta end. The expiry literature (Field & Hanka 2001; Ofek & Richardson 2000 — cited from memory, not re-fetched) finds the pullback largest after a big run-up; there is no run-up to unwind here, and the released supply has already been absorbed on the way down.

### Leg 4 — options: MIXED, nothing priced for the unlock specifically
Cboe snapshot 2026-10-20 (spot 123.61, iv30 86.8%): ATM IV 87–88% for the 11-06 expiry (straddle 15.2% of spot, 17 days), 86–92% for 11-13 (18.4%, 24 days), 89–94% for 11-20 (21.3%). Realized vol: 20-day 75%, 10-day 70–79% (ex- and including the partial day), so ATM IV runs ~1.2x realized. Skew is mild: 85%-moneyness put IV 87% vs 115% call 84% on 11-06, 87 vs 82 on 11-20. Forward vol between the 11-06 and 11-13 expiries (the window holding the unlock, CPI, CoreWeave and the est. Q3 print) is 92% against 76% for the week before: about 7% of one-sigma extra move for all four events together, while the two prior earnings reactions alone were -19.1% and -12.6% vs SMH. So the market has not carved out a separate unlock premium. Caveat: weekly open interest at the strikes is a handful of contracts, so these IVs are quotes, not trades.

### Leg 5 — insiders: SUPPORTED as small so far
EDGAR lists 14 Form 144 filings (2026-08-14 to 2026-09-29); the 12 with readable quantities total **1.76M shares** against ~113M released by 09-29 (1.6%). Sales so far are ~1% of what could have been sold: no selling pressure from insiders is visible. Form 4s (61 filings) were not summed.

### Leg 6 — do released tranches move the stock?
Close-to-close excess return vs SMH on the five tranche days: -0.4%, +5.9%, +2.9%, -9.2% (09-30, 19.4M), -1.1% (10-14, 19.4M): mean -0.4%, against a mean of -1.1% on 40 other sessions since 08-17 (σ 4.4%). Indistinguishable, n=5. The two earnings reactions, -19.1% (06-24) and -12.6% (08-13), dwarf any tranche day. The 10-28 tranche is the next free read (FT-1).

### What plays the conditions support
None. No short: borrow and squeeze risk on a 60%-down 90%-IV name is not a paper-trade edge, and the supply that justified one is largely out. No long: nothing here is a buy signal. If a position-sizing question arises, low confidence means size zero. The lockup playbook (#5912) stays at "stand aside" for this event.

### Honest limits
110 sessions and two reports: no cycle statistics. Share counts rely on the filing's "up to" estimates from April/May. I did not read the Q2 10-Q for current share count or any lock-up amendment. Yahoo bars for 10-20 are intraday. Cboe's `cdn.cboe.com` returned a 307 and was read at `cdn-api.cboe.com` instead (recorded in `probe-ref.blocked`; same data, not a downgraded source).

## Stance & kill switches

Stand aside on CBRS around the lock-up (**estimate**-dated; widens caution only). Kill switches, each with a date:
- **2026-11-04**: a Q3 release (8-K Item 2.02) on or before this date → final unlock is two trading days after it; re-date the event.
- **2026-10-28**: the 19.4M tranche closes worse than -5% vs SMH on ≥2x average volume → supply is still price-setting; raise caution on 11-09 (never a long signal).
- **Any day**: a Morgan Stanley / Citigroup / Barclays early-release notice or a new Form 144 wave above ~3M shares in a week.
- **2026-11-10 close**: FT-2 reading (cumulative 11-06 → 11-10 excess vs SMH).

Registered forward tests (`docs/research/forward-tests/cbrs-lockup-expiry-2026-11-09.md`): FT-1 (the 10-28 tranche, score by 2026-10-30), FT-2 (the unlock window, score by 2026-11-13), FT-3 (no early Q3 release, score by 2026-11-05).

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-10-20 | 20 | Initial research. Staged lock-up read from the 424B4: 171.1M shares in 10 dated steps through 10-28, final ~14M (derived). CBRS $124.66 (-33% vs IPO), 5d -16.4%. Peers 5d: CRWV -18.4%, AMD -9.9%, SMH -6.3%, NVDA -4.6%. VIX 17.72. ATM IV 87–94% vs RV20 75%. Form 144s ~1.8M shares total. Adjacent: jobs 11-06, CPI 11-10 (confirmed high), CRWV print est. 11-10, US-China tariff truce expiry est. 11-10, own Q3 print est. 11-11 (proposed: `cbrs-q3-2026-results-2026-11-11`). Beyond horizon: none noted | Initial stance: stand aside | 2026-10-27 (high band, 7 days) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found **inside the research horizon**
(`assessment-cadence.json`'s `horizon`: nothing past `maxDaysOut`, and past `allImpactsWithinDays`
only critical/high) gets proposed as a new
`src/domain/market-events/proposals/<id>.from-<this-event-id>.json` (`status: "estimate"`) in the
same PR — your own file, never another event's canonical one (#1717). One past the horizon is named
in the row instead (#2946): it can never become due, so a calendar file for it is clutter, while
prose in a row is free. Close-out fills `## Outcome` below from re-run instrument data (cache busted
first), never from memory. After that the assessment is closed; the doc reopens only to score a
registered forward test whose `Score by` has arrived (`forward-test-due`).

**Last assessed:** 2026-10-20
<!-- probe-ref: {"symbols":{"CBRS":124.66},"vix":17.72,"daysBand":"high:8+","adjacentIds":["adp-employment-2026-11-04","boe-decision-2026-11-05","boj-minutes-2026-11-05","boj-summary-of-opinions-2026-11-10","bund-30y-auction-2026-11-11","bxdc-lockup-expiry-2026-11-09","cpi-2026-11-10","crwv-2026-11-10-print","eia-steo-2026-11-10","eurostat-hicp-flash-2026-11-04","existing-home-sales-2026-11-12","intl-trade-full-report-2026-11-04","ism-services-2026-11-04","jgb-10y-auction-2026-11-05","jgb-30y-auction-2026-11-10","jgb-5y-auction-2026-11-12","jobs-2026-11-06","mts-october-2026-11-12","ppi-2026-11-13","productivity-costs-q3-2026-11-05","russell-recon-preliminary-2026-11-13","sifma-bond-market-closure-2026-11-11","sp-global-investment-manager-index-2026-11-10","treasury-10y-note-2026-11-10","treasury-30y-bond-2026-11-12","treasury-3y-note-2026-11-09","treasury-buyback-10y20y-2026-11-04","treasury-buyback-1mo2y-2026-11-05","treasury-coupon-announcement-2026-11-12","treasury-refunding-2026-11-04","umich-sentiment-prelim-2026-11-06","us-china-tariff-truce-expiry-2026-11-10","wholesale-trade-2026-11-09"],"adjacentStrongIds":["cpi-2026-11-10","jobs-2026-11-06"],"screenStreak":0,"blocked":[{"url":"https://cdn.cboe.com/api/global/delayed_quotes/options/CBRS.json","status":"307 (followed to cdn-api.cboe.com, 200)","at":"2026-10-20"}]} -->
