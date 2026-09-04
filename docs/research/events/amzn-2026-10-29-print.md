# AMZN earnings print — amzn-2026-10-29-print

**Kind:** earnings · **Date:** 2026-10-29 (estimate, 8-K cadence) · **Impact:** critical
**Last assessed:** 2026-09-02
<!-- probe-ref: {"symbols":{"AMZN":254.92},"vix":16.0,"daysBand":"critical:21+","adjacentIds":["aapl-2026-10-29-print","consumer-confidence-2026-10-27","fomc-2026-10-28","gdp-q3-2026-advance-2026-10-29","goog-2026-10-28-print","ism-manufacturing-2026-11-02","meta-2026-10-28-print","midterm-elections-2026-11-03","msft-2026-10-27-print","pce-2026-10-29","sloos-2026-11-02","treasury-borrowing-estimates-2026-11-02"],"screenStreak":0} -->

## At a glance

**TL;DR.** No AMZN positioning into this print at any horizon — the one pre-print edge was killed in
the sweep and re-confirmed on a fresh run (p=0.6854), so nothing here pays for taking the date. What
the print *does* carry is measured ±10% single-night tails, which makes it a risk-management event:
be flat across it, sized to those tails. Date is an **estimate** (D-65), so the flat-by rule keys to
the earliest plausible day of the cadence window, never the point estimate. The live question is not
direction but narrative — the first quarter $220B capex reads as a liability rather than AI
conviction changes the reaction function.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** | High | No surviving pre-print edge on AMZN; S1 killed 2026-08-12 and re-confirmed p=0.6854 on 2026-08-17 | ≥3 new prints clearing a base-rate + peer control for the gap family |
| This week | **Nothing to do** — watch for the IR date | High | The date is an estimate; IR normally announces 2–3 weeks out, so no announcement is due yet | An IR announcement landing early, or on a date ≠ **2026-10-29** |
| This month | **Watch consensus drift, don't trade it** | Medium | The light $197–202B guide is the bar; drift against it changes the print's difficulty, not its tradability | Consensus ≥ **$206B** (≈2% clear of the guide top) or ≤ **$197B** by **2026-10-08** — re-specified 2026-09-02, see that row |
| This quarter | **Flat across the print night (S2), E1 on any execution** | High | ±10% measured overnight tails with no edge to pay for them — a guard, not a bet | Nothing kills a no-alpha guard; only ≥3 repriced-regime prints revise it |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — carry unhedged AMZN exposure across the print night for the gap; the tails are ±10% and no edge pays for them.
- **Watch (dated)** — IR date announcement expected ~**2026-10-08** to **2026-10-15** · the estimated print **2026-10-29** · FOMC **2026-10-28**, D-1.
- **The narrative tell** — $220B capex read as a liability rather than conviction; that reaction-function shift matters more than the beat.
- **Zero-size observation only** — the S3 direction lean dies if the reaction day closes green on 2 of the next 3 prints.
- **Re-keys everything if** — the IR date lands anywhere other than 2026-10-29.

## Initial research

**The question.** AMZN's Q3 2026 print lands in ~73 days (date **estimate**). After a blowout Q2
(2026-07-30: revenue $200.6B +20%, AWS +37% — fastest in 18 quarters, +9% after hours), what is
likely to happen into and around the Q3 print, and which house playbooks apply?

**One-line verdict.** Guards only: S2 + E1 apply with full force; every AMZN alpha-shaped play
was already killed or shelved by the [`multi-symbol-sweep.md`](../multi-symbol-sweep.md) red team,
and the fresh instrument run (2026-08-17, cache busted) re-confirms each kill — the event-shaped
work here is the *setup*: a bar reset high by Q2, a deliberately light Q3 guide, and a congested
mega-cap week where four peer prints land within 48 hours of this one.

**Method.** `earnings-cycle.mjs AMZN --bench QQQ --peers MSFT,GOOG,META` (87 prints,
2004-10-21 → 2026-04-29) + `intraday-edges.mjs AMZN` (721 sessions, hourly + 5-min), both run
fresh 2026-08-17; read against the sweep's per-symbol verdicts and kill list; sourced web research
for the date, the Q2 baseline, and consensus. **Instrument caveat (known debt, not repaired
here):** the event list ends at 2026-04-29 — the 2026-07-30 print (8-K exists; SEC EDGAR
amzn-20260630 ex-99.1) is missing, consistent with the sweep's forward-window-guard finding that
blinds five of eight tickers to their newest print. Every modern-era n=14 cell below therefore
excludes the single most relevant data point: the AWS-acceleration print that gapped ~+9%.

**Conviction legs tested.**

1. **"Pre-print positioning pays on AMZN" (S1) — REFUTED**, again. Kill-list entry #2
   ([`multi-symbol-sweep.md`](../multi-symbol-sweep.md), 2026-08-12) stands: the fresh run's
   modern-era control shows the D-20 run-up (9/14 positive, mean +4.78%) at **p=0.6854 vs the
   era's own base rate** (887 windows, mean +2.60%, win 67%) — statistically indistinguishable
   from a bull market. The peer control is the tell: GOOG (+5.50%) and META (+6.87%) run *harder*
   over AMZN's own pre-print windows than AMZN does. Sector seasonality, not an AMZN edge.
2. **"The gap can be held/traded" (anti-S2) — REFUTED; S2 SUPPORTED.** All-era gap: win 48%,
   median −1.27%, p10 −10.33% / p90 +11.31% (fresh run, 2026-08-17) — a fat-tailed coin flip,
   exactly the sweep's all-eight verdict. The modern cell (win 57%, median +3.79%, n=14) is the
   familiar bull-era gloss over ±9–10% tails; note the missing 2026-07-30 +9% gap would flatter
   it further, which is precisely why hold-the-print theses keep getting re-proposed and keep
   dying (0-for-3 family: AVGO, META, NVDA).
3. **"Fade the reaction-day open" (S3) — MIXED**, unchanged from the sweep's "direction only"
   lean. Fresh run: modern-era reaction session mean −0.60%, win 29% vs an ordinary session's
   +0.05%/52%. Direction lean re-confirmed, but AMZN never cleared significance (MSFT p=3.4e-4
   did; AMZN did not), and shorting is blocked anyway. Inert; observation only.
4. **"Overnight-only beats holding" (S4) — REFUTED**, kill-list #9 stands. Fresh run: overnight
   carries the return (win 56%, +74.4% total gross) but nets +2.4% vs buy-and-hold's +78.0% at
   5bps/side — the market-wide overnight anomaly, value-destroyed by costs.
5. **"E1: defer the open" — SUPPORTED.** First hour carries 30.5% of daily volatility at −0.016%
   mean return (win 48%). Cost rule for non-urgent entries, as everywhere.
6. **The Q3 setup (event-specific, new since the sweep) — MIXED, and the real content.** Q2
   (2026-07-30, CNBC/SEC) reset the bar: AWS +37% to $42.2B, backlog $496B, but capex guided to
   $220B for the year with free cash flow turning negative, and the Q3 revenue guide of
   $197–202B came in *below* the street's $204.1B (LSEG). The market forgave the light guide on
   AWS acceleration. So the Q3 print (date **estimate**) must beat its own conservative guide
   *and* show AWS comps holding near 37% against a much harder bar — while the capex/FCF
   question sharpens each quarter. Consensus is uniformly bullish (Buy, mean PT ~$322 vs ~$267
   spot as of 2026-08-13/16, per MarketBeat/24-7WallSt aggregation — no Sell ratings), which is
   itself positioning information: the crowded side is long.

**Date verification (primary-source hunt, 2026-08-17).** Amazon IR has published **no** Q3 2026
call notice yet (ir.aboutamazon.com news releases end at the Q2 cycle). Wall Street Horizon
forecasts Thu **2026-10-29 AMC, explicitly unconfirmed**, matching the domain table's 8-K-cadence
estimate (Q2 printed Thu 2026-07-30; +91d = Oct 29; prior Q3s were Oct 30 2025, Oct 31 2024 —
last-Thursday-of-October cadence). One aggregator (Bybit wiki) claims "Oct 22, confirmed" with no
primary backing — the exact aggregator trap the seeding of this calendar caught on CPI; rejected.
The date stays **estimate** until an IR press release lands; no domain edit from this session.

**What the conditions support.** Guard rules only, both carrying the **estimate** label: any
AMZN position flat by the close of D (S2), where D itself is estimated — and per the honesty
rules an estimated date only *widens* caution (flat by the earliest plausible print day, not the
latest); E1 for any non-urgent entry regardless. No pre-print long (S1 killed), no gap hold
(kill list), no fade (blocked + sub-significance), no overnight round-trip (killed). The
congestion note matters more than any single-symbol number: MSFT 10/27, GOOG 10/28, META 10/28,
AMZN 10/29, AAPL 10/29 (all **estimates**, 8-K cadence) — five mega-cap prints in 48 hours, so
the never-stack-pre-print-longs rule binds hard that week, including against the one live GOOG
run-up hold. FT-5 (AAPL post-print drift, [`forward-tests.md`](../forward-tests.md)) keys off the
same estimated day; nothing here duplicates or edits it.

**Honest limits.** n=14 modern cells, minus the newest print (instrument debt above); one
bull-regime intraday sample; SEC filing dates stand in for announcement times; date is an
estimate for another ~2 months; consensus/PT figures are aggregator-sourced (no primary
disclosure exists for "consensus"); D-73 means implied move and whisper are not yet quotable —
expect them from ~D-21.

## Stance & kill switches

**Stance (date: estimate).** No positioning into this print at any horizon — AMZN carries no
surviving pre-print edge (S1 killed 2026-08-12; re-confirmed p=0.6854 on 2026-08-17). S2 and E1
apply as universal guards: flat across the print night, sized to the measured ±10% overnight
tails; because the date is an **estimate**, the flat-by rule keys to the earliest plausible print
day of the cadence window, never the point estimate. The event-shaped watch items are (a) the IR
date announcement (expected ~2–3 weeks before the print; it flips the label to confirmed), (b)
consensus drift against the light $197–202B guide, and (c) the capex/FCF narrative — the first
quarter where $220B capex reads as a liability rather than AI conviction changes the reaction
function.

**Kill switches.** The no-positioning stance is killed only by the sweep's stated bar: new-print
evidence that clears a base-rate + peer control (≥3 prints for the gap family) — not by any
in-window rally. The S2 guard has no kill switch; it is a risk rule, not a bet. The
S3-direction-lean observation (zero size) dies if the reaction day closes green on 2 of the next
3 prints. If the IR announcement lands on a date ≠ Oct 29, the calendar entry gets a same-PR
correction proposal (estimate → confirmed) and every window in this doc re-keys.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-08-17 | D-73 | Initial research banked. Instruments fresh (cache busted): S1 kill re-confirmed (D-20 control p=0.6854; GOOG/META outrun AMZN over its own windows); gap all-era win 48% ±10% tails (S2); fade direction-lean only (29% win modern, inert); S4 net +2.4% vs B&H +78% (killed stands). Instrument debt: event list ends 2026-04-29 — the 2026-07-30 print is missing (forward-window guard, known sweep debt), so all n=14 modern cells exclude the +9%-gap AWS print. Date hunt: IR silent; WSH forecasts 10/29 AMC unconfirmed (matches 8-K cadence); Bybit "Oct 22 confirmed" rejected as unsourced aggregator. Adjacency: no peer prints or macro releases since 8/15 (weekend); VIX 14.56 Fri 8/15 (2026 low) but SKEW +6.6% m/m and Brent +6%/wk — calm index, rising tail-hedge demand (shared with the NVDA 8/17 row); no new AMZN-specific tariff/policy action found, capex-driven memory-cost pressure noted (CNBC 7/30); tape: consensus Buy, mean PT ~$322 vs ~$267 spot, zero Sells — crowded long; Q3 guide $197–202B vs street $204.1B is the bar; implied move not yet quotable at D-73. Dated discovery: AWS re:Invent Nov 30–Dec 4 2026, Las Vegas — proposed as estimate. Congestion: MSFT 10/27 · GOOG/META 10/28 · AMZN/AAPL 10/29 (all est.) — never-stack binds that week. | — (stance set) | 2026-08-24 (critical, 61+d band: every 7d) |
| 2026-08-24 | D-66 | Adjacency sweep. Event tape: date estimate still 10/29, no IR notice this session, unchanged. AMZN spot **$260.11** (8/24), down from the ~$267 cited at D-73 — a modest pullback, not a break. One search returned an internally inconsistent "$267.30 PT, 21.5% upside" figure that doesn't reconcile arithmetically with the quoted spot (267.30/260.11 ≈ +2.8%, not +21.5%) — likely conflated with the D-73 row's own ~$322 mean PT; discarded as an unreliable extraction, the D-73 PT figure stands uncorrected. Peers: NVDA/MRVL both report this week (own docs); AVGO's XPV overhang deepened, MRVL's implied move jumped on its Google deal (own docs) — AI-capex sentiment context, not AMZN-specific (AMZN's own capex-driven memory-cost pressure thread from D-73 unchanged, no update found). Macro: no CPI/jobs surprise since 8/17; Sep-16 FOMC read is 68.4% hold/31.6% hike as of 8/20 (FOMC sibling doc). Volatility regime: VIX 15.13, calm, no shift. Geopolitical: Brent -1.38% to $93.09 on 8/24, first pause in the two-week escalation (new Iran sanctions pending) — same finding as sibling docs. No new dated adjacency found — AWS re:Invent (Nov 30-Dec 4) already proposed at D-73. | — (no change; too far out for a substantive stance shift) | 2026-08-31 (critical, 61+d band: every 7d) |
| 2026-08-30 | D-60 | Adjacency sweep. **Cadence band transition:** critical `61+` → `21+` at D-60, so pulses tighten 7d → 3d. This pulse was also forced material by `no-reference-baseline` — the ledger carried no `probe-ref` block until this row wrote one; baseline now set (AMZN **$266.43**, VIX **14.43**, 9 adjacent ids). **Event tape — the material item.** On **2026-08-28** AWS and NVIDIA announced an expanded deployment of **2 million additional NVIDIA GPUs across 2027–2028**, roughly tripling AMZN's committed total to ~3M, contract value press-described as "hundreds of billions"; AMZN closed **+3.97% at $266.43**, ~$110B of market cap added (Yahoo Finance / 24-7 Wall St. / ts2.tech, 8/28) on a session where the S&P was −0.13% to −0.25%. Week path vs the D-66 row: $260.11 (8/24) → $256.26 (8/27 close) → $266.43 (8/28), net **+2.4%**. **This is a dated receipt against this doc's own watch item (c).** The stance says the reaction function flips the first quarter "$220B capex reads as a liability rather than AI conviction" — the market was instead handed a materially *larger* forward capex commitment and paid +4% for it. Conviction-mode intact as of 8/28; no flip, and nothing here changes the stance, because no measured edge exists in either direction. *Reasoning, not a sourced claim:* those GPUs deploy in 2027–2028, so their dollars land in the **FY2027** capex guide (the January print), not in the 10-29 Q3 line, which stays bounded by the already-guided $220B FY2026 — the liability-flip is likelier a Q4-print event than this one. **Date:** still **estimate** 10-29; ir.aboutamazon.com carries no Q3 call announcement. A search summary this session again asserted a *confirmed* **10-22** date citing MarketBeat/Investing.com — fetching MarketBeat directly returns the opposite, verbatim: "Amazon.com has not confirmed its next earnings publication date, but the company's estimated earnings date is Thursday, October 29th, 2026." Second instance of the identical aggregator trap on this exact field (D-73 rejected Bybit's "Oct 22 confirmed"); rejected again, no domain edit. **Peers:** no hyperscaler prints — MSFT/GOOG/META all report inside the 10-27→10-29 corridor; NVDA printed 8/26, MRVL 8/27 (−7.6% AH on a margin miss; own docs). Aggregate 2026 hyperscaler capex ~$725B, +~77% y/y, GOOGL raised to $195–205B, META narrowed to $130–145B (aggregator-sourced, context only). Contested attribution flagged not resolved: the jackson-hole close-out reads NVDA −3.40% on 8/28 as keynote + MRVL digestion, while 8/28 AWS-deal coverage frames the same −4% as the deal's own reaction ("…Why Is NVIDIA Falling 4%?"). Three candidate causes, one session; not load-bearing for AMZN, and the past row stands unedited. **Macro:** Jackson Hole 8/28 landed hawkish — hike odds 35% → 57–59%, 2y +8bp, equities flat (own doc). Its durable finding applies directly here: on this chair a hawkish surprise prices into the **front end**, not into equity vol — so a long-duration AI-capex name is carrying rate-repricing risk the options market is not charging for. Observation only; licenses nothing (and the date is an **estimate**, which only widens caution). **Volatility regime:** VIX **14.43** vs 15.13 at D-66 (−0.70), a 2026 low set 8/28 — well inside the 3-point threshold, no regime shift. **Geopolitical:** Brent **$90.07** on 8/28 vs $93.09 on 8/24 (−3.2%), de-escalating — the 8/24 Iran sanctions package was shrugged off and an Iran/Oman phased Hormuz shipping-corridor framework landed 8/26 (CNBC 8/24–8/25; Vantage 8/28). No AMZN-specific tariff or export-control action found. **Dated discovery → proposed in this PR:** the **FTC v. Amazon monopolization bench trial, 2027-03-29** (W.D. Wash., Judge John Chun; briefs 3/22, pretrial conference 3/15) — the date has already reset twice (Oct 2026 → 2027-02-09 → 2027-03-29), so it enters `estimate` / `NEWS:` at `impact: medium`; it sits ~5 months past this print and carries no read on it. | — (no change; the 8/28 receipt strengthens watch item (c) without flipping any call) | 2026-09-02 (critical, 21+d band: every 3d) |
| 2026-09-02 | D-57 | Adjacency sweep. **Why this pulse was material:** three *new* adjacent ids entered the ±5d corridor since the last probe-ref (`ism-manufacturing-2026-11-02`, `sloos-2026-11-02`, `treasury-borrowing-estimates-2026-11-02` — filed by other sessions, 9→12 tracked); price and VIX both stayed inside their thresholds. **Event tape — the material item: the 8/28 pop is fully round-tripped.** AMZN **$266.43** (8/28) → **$259.77** (8/31, −2.50%) → **$254.92** (9/1, −1.87%), net **−4.32%** from the D-60 baseline (stockanalysis.com close series, fetched 9/2) — the entire +3.97% AWS–NVIDIA 2M-GPU reaction is gone in two sessions. *Attribution is contested and this row does not resolve it:* TradingKey's 8/31 mover note attributes that session to the capex thread verbatim — "Amazon raised its 2026 capital expenditure target to approximately $220 billion… pushing its free cash flow into negative territory" — i.e. **watch item (c), the liability read**, while 9/1 is plainly broad risk-off (Nasdaq −1.03% to 26,099, 10y **4.796%**, growth < value). So the D-60 row's "conviction-mode intact as of 8/28" was a one-session receipt that has **not** persisted; the item stays open in both directions and neither reading moves a stance that has no measured edge behind it. Same source disagrees with the close series on the 8/31 magnitude (−3.06% vs −2.50%); the price series is preferred and the gap flagged, not reconciled. **Date:** still **estimate** 10-29 — press.aboutamazon.com's release archive fetched 9/2 runs only to 8/25 (Career Choice Japan, an AWS/NBA Africa education item), no Q3 call notice; third consecutive session of IR silence. **Peers:** no hyperscaler prints since the last row (MSFT/GOOG/META all sit inside the 10-27→10-29 corridor); AVGO prints 9/2 AMC tonight (own doc) as the nearest AI-capex sentiment read. **Macro — the soft prints did not buy any duration relief.** 9/1 ISM Manufacturing **54.6** from 55.6 with the employment sub **51.2** vs 53.0 consensus, and JOLTS **7.271M** vs 7.300M — two misses, and the 10y still rose to 4.796% (highest since Jan 2025) on oil plus hawkish Warsh rhetoric. That is the D-60 durable finding showing up on the tape rather than in theory: a long-duration AI-capex name is carrying rate-repricing risk equity vol is not charging for. Observation only; the date is an **estimate**, which only widens caution. **Volatility regime:** VIX closed **below 15** on 8/31 (lowest monthly close since Nov 2024), then **15.84** by 9/1 mid-morning, **16.80** intraday high, **closing above 16** — no source fetched this session published an exact 9/1 close, so the probe-ref records the sourced floor **16.0**; ≈+1.6 from 14.43, well inside the 3-point threshold, but it is this doc's first *expansion* reading after four rows of compression. **Geopolitical — the D-60 de-escalation read reversed in three sessions.** US strikes on Iranian targets 8/31–9/1, Iran stating its armed forces "have launched a military operation in response"; Brent **$94.65** (+4.6%) and WTI **$90.22** (+5.2%) vs Brent $90.07 on 8/28, with the Hormuz reopening clouded again. AMZN's channel is fuel/logistics cost into Q4 and the inflation→rates path, not AWS. **Consensus drift:** ChartMill carries **$205.65B** for the coming quarter vs the $204.1B LSEG figure logged at D-73 — drift is *up*, i.e. further above the $197–202B guide top, making the bar harder. A FactSet-attributed "$188.8B" surfaced in the same search and is discarded as an unreliable extraction (irreconcilable with every other figure; same class as the D-66 discarded PT). Mean PT **$322.17** across 36 analysts, Buy, zero Sells (8/26) — unchanged from D-73's ~$322, crowded-long intact; Citizens reiterated Market Outperform / $315. **Falsifier hygiene (a correction to a live call, not to a past row):** the This-month falsifier read "consensus settling above the guide range" — but the D-73 row *itself* recorded consensus at $204.1B against a $197–202B guide, so the test was satisfied the moment it was written. Mis-specified, not tripped. The At-a-glance cell is re-specified to a numeric dated bar (≥$206B or ≤$197B by 2026-10-08); every ledger row stands byte-unchanged and this row is the receipt. **AWS narrative:** Anthropic signed a **$35B** cloud deal with Nvidia-backed Lambda (8/31, Bloomberg/Reuters) — AWS's anchor AI tenant multi-sourcing compute; set against Amazon's own stated ">$100B over a decade, 5GW, Trainium3" Anthropic commitment it is not the largest item on that list, so: backlog-quality context, not a thesis change. **Dated discovery → none proposed.** Prime Big Deal Days: aggregators name **Oct 7–8**, which is the exact 2025 pair, and no Amazon primary announces 2026 fall-event dates — the calendar already banked this decision verbatim in `retail-sales-2026-11-17`'s note, so no entry is filed (third aggregator-trap rejection in this doc's history, after Bybit's "Oct 22 confirmed" and MarketBeat's). AWS's first Saudi region carries only "by December 2026" ($5.3B) — no day precision, not proposable. | — (no change; the 8/28 receipt is round-tripped, which re-opens watch item (c) rather than flipping it) | 2026-09-05 (critical, 21+d band: every 3d) |

**Rules.** Rows append only — editing a past row is falsification. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see [EVENT-RESEARCH.md](../../process/EVENT-RESEARCH.md)) runs in
every row; a dated adjacent event found gets proposed to `market-events.ts` as an `estimate` in
the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first),
never from memory — after which this doc goes quiet.
