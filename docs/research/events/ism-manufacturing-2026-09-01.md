# ISM Manufacturing PMI (Aug 2026 data) — ism-manufacturing-2026-09-01

**Kind:** macro-print · **Date:** 2026-09-01 (confirmed, ISM: ismworld.org ROB calendar — 10:00 ET (1st business day), checked 2026-08-18) · **Impact:** high
**Last assessed:** 2026-08-29
<!-- probe-ref: {"symbols":{},"vix":14.43,"daysBand":"high:0+","adjacentIds":["adp-employment-2026-09-02","avgo-2026-09-02-print","ism-services-2026-09-03","jackson-hole-2026-08-28","jobs-2026-09-04","jolts-2026-09-01","mrvl-2026-08-27-print","treasury-7y-note-2026-08-27"],"screenStreak":0} -->

## At a glance

**TL;DR.** The August ISM Manufacturing PMI lands Tuesday 2026-09-01 at 10:00 ET — the *second*
release of the day (JOLTS also hits 10:00 ET) and the opening bell of the pre-FOMC data run that
ends on the Sep-16 decision. It matters to us for two subcomponents, not the headline:
**prices-paid** (a sticky-goods-inflation read that reprices the Fed hike/cut path) and
**new-orders** (forward demand). The July print (released 2026-08-01) was hawkish on both — the
headline PMI jumped to **55.6**, its strongest since May 2022, and prices-paid held **71.1**, above
70 for a sixth straight month — and it contributed to Treasury yields printing fresh 2026 highs
that week. Nothing here is a trade: it is a rate-path read. The asymmetry is the point — a *hot*
prices-paid / strong-new-orders August print lifts yields and pressures our long-duration AI names
into the corridor; a soft print is dovish relief. **New at D-3 and the reason to read this doc
today:** Chicago PMI — the closest-timed regional analog — **collapsed to 47.1 on 2026-08-28**
against a ~58 consensus and a 57.6 prior, its worst reading of 2026, on the same morning Warsh
called the economy "strengthened" and the market repriced September hike odds from ~35% to ~57–59%.
The betting tape on this print has **not** moved for it (Polymarket's bins still cluster mid-50s).
That divergence widens the distribution around 9/1; it does not tell you which side is right.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-3) | Stand aside | High | Nothing name-keyed; `symbols: []`. The Chicago miss widens the outcome distribution without giving a tradable direction. | Polymarket's August bins repricing sharply toward sub-52 before **2026-09-01**, which would mean the divergence has closed and the surprise is already in |
| This week | Watch — and watch the *gap*, not the headline | Medium | Confirmed 9/1 10:00 ET. The rate-relevant read stays prices-paid + new-orders; the new question is whether a Chicago-style downside surprise can move hike odds at all now that Warsh has anchored the hawkish case on inflation rather than growth. | A soft print — headline back below ~52 with prices-paid under 65 — that leaves 9/16 hike odds *unchanged*, which would prove growth data no longer reprices this Fed |
| This month | Watch | Medium | Opens the Sep-1 → Sep-16 pre-FOMC corridor (JOLTS same day, ISM-svcs 9/3, jobs 9/4, PPI 9/10, CPI 9/11); with forward guidance formally abolished on 8/28, these prints are now the *only* channel that moves the path. | A weak JOLTS the same day or a weak jobs print on **2026-09-04** collapsing hike odds toward zero |
| This quarter | Stand aside on this print specifically | Medium | The binding constraint on our duration names runs through the Sep FOMC/CPI corridor, not a single ISM release; treat this as regime context. | The **2026-09-16** FOMC resolving the duration question this print only feeds |

**Signals & conditions.**
- Prices-paid re-accelerating back toward the low-70s or higher (July 71.1, down from June's 73.0
  but still >70 for six months) → sharpens the "sticky goods inflation keeps the hike live" read
  into the corridor; watch, don't act — tightens caution on the highest-duration names (CRWV, then
  semis).
- New-orders holding well above 50 (July 56.7) *with* hot prices → the hawkish two-axis combination
  that drove yields to fresh 2026 highs after the July print; the leg most likely to move rate-desk
  positioning off this release.
- A soft print — headline back below ~52 and prices-paid breaking under 65 → dovish relief on the
  same channel recent inflation/jobs misses ran (bullish for long-duration names), but manufacturing
  is a smaller economic share than services, so its dovish signal is weaker than ISM-svcs's.
- Any print reading *hot activity + soft labor subcomponent* (July employment jumped to 52.8, first
  expansion since Jan 2025) → a mixed signal the Fed reads through to the 9/4 jobs report, not a
  clean directional trigger.

## Initial research

**The question.** What is the consensus for the August 2026 ISM Manufacturing PMI, what does the
July print and recent trend say, how has the market reacted to this release in each direction
during 2026, and which of our tracked names (NVDA MRVL AVGO CRWV MSFT GOOG META AAPL AMZN) carry
the most sensitivity — around 2026-09-01?

**One-line verdict:** a strong, hawkish-tilted July print (PMI 55.6, prices-paid 71.1) leaves the
August release positioned as an early rate-path input in a live Fed *hike* debate; no August street
consensus exists yet at D-13; the market trades ISM through the yield channel (hot prices/orders →
yields up → long-duration tech pressured), and the house answer is guard-shaped, not directional —
no macro playbook exists, so the play is known-date variance discipline as the pre-FOMC corridor
opens.

**Method.** Sourced web research per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md)
(macro-print mode: no price instruments). Primary source is ismworld.org (the Report On Business
release calendar and the July report); press (PRNewswire, TD Economics, Neil's Newsletter, Penn
Mutual, CNBC) used only for reaction narration and component detail, each claim dated. The ROB
release-calendar primary sits behind an SSO login (ecommerce.ismworld.org) and was not directly
fetchable — the date rests on ISM's published cadence rule plus convergent secondary aggregation,
noted as a limit in leg 1, not treated as unconfirmed.

**Conviction legs, tested:**

1. **The date and time are right — SUPPORTED (with a gated-primary caveat).** ISM publishes the
   Manufacturing PMI on the **first business day of the month at 10:00 ET** (ismworld.org ROB
   report-calendar page; the cadence stated across the July report's own release and multiple
   aggregations, fetched 2026-08-19). September 2026's first business day is **Tuesday, Sep 1**
   (Labor Day falls Monday Sep 7, so no early-month holiday displaces it) — matching the checked-in
   calendar entry exactly. The ROB calendar's exact line-item page redirects to an SSO login and
   could not be fetched directly, so this leg rests on the cadence rule + convergent aggregation
   rather than a single fetched primary line — the same gated-primary limit the
   [`consumer-confidence doc`](consumer-confidence-2026-08-25.md) flagged for the Conference Board.

2. **The July print was strong and hawkish-tilted — SUPPORTED.** July Manufacturing PMI (released
   2026-08-01) rose **2.3 points to 55.6** from June's 53.3, beating a ~54.0 consensus and marking
   the strongest factory expansion since May 2022 (ismworld.org / PRNewswire / TradingEconomics,
   2026-08-01). Output surged to 58.5 (fastest since Nov 2021), New Orders rose to **56.7** (from
   56.0), and Employment returned to expansion at 52.8 (from 49.7) — its first expansionary reading
   since January 2025. This was a broadly strong report: momentum, forward demand, and a labor
   subcomponent all firming at once.

3. **Prices-paid is elevated and sticky — SUPPORTED.** July Prices-paid printed **71.1**, down from
   June's 73.0 (a third straight monthly easing, to a five-month low) but **above 70 for a sixth
   consecutive month** (TD Economics / Neil's Newsletter, 2026-08-01). The calendar's own note is
   exactly right: prices-paid + new-orders are the subcomponents that "reprice the Fed-cut path and
   10Y real yields." A print this hot on prices, alongside strong new-orders, is the goods-inflation
   evidence the hawkish FOMC minority (three July hike dissents, per the [`FOMC doc`](fomc-2026-09-16.md))
   points to.

4. **The market trades ISM through the yield channel, asymmetrically — SUPPORTED (this-cycle
   precedent).** The strong July manufacturing print (8/1) plus the hot July services print (8/5)
   drove Treasury yields to **fresh 2026 highs** that week (Penn Mutual Asset Management,
   2026-08-03; and the [`ISM-services sibling doc`](ism-services-2026-09-03.md) 8/5 reaction:
   10Y ~+9bps, 30Y ~+10bps — level figures carry aggregator risk, the *direction* is the reliable
   part). That week's hawkish activity/prices data reversed only when the 8/7 jobs report collapsed
   (yields fell, hike odds 67%→44%, per the FOMC doc) and the 8/12 in-line CPI extended the relief.
   The pattern: strong-activity / hot-prices ISM prints lift yields and pressure long-duration
   equities; the dovish relief comes from the *labor* and *inflation* prints, not from ISM. The
   asymmetry now favors the hot tail mattering more into the corridor — a hot August prices-paid
   re-arms the September hike five days before the FOMC blackout resolves it.

5. **This print opens the pre-FOMC data run, but is not itself decisive — MIXED.** Sep 1 stacks
   ISM-mfg + **JOLTS** (both 10:00 ET; JOLTS is the labor-slack read the Fed weights) at the front
   of a dense corridor — ISM-svcs 9/3, jobs 9/4, PPI 9/10, CPI 9/11, FOMC 9/16 (all confirmed and
   on the calendar). Manufacturing is a smaller share of the economy than services (leg-3 of the
   [`ISM-services doc`](ism-services-2026-09-03.md) notes services is ~70% of output), so this
   release moves rates less than ISM-svcs or the jobs/CPI prints that follow. It is an early input
   that *sets the tone* for the corridor, not the fork that resolves the hike debate — that weight
   sits with the 9/4 jobs and 9/11 CPI prints.

6. **Tracked-name sensitivity — ranked, with mechanism.** `symbols: []` on this event — it is
   market-wide, and the ranking is about *our* risk, not the event's scope. All nine trade as
   long-duration assets on the rate path (the calendar's own CPI note). Most sensitive: **CRWV**
   (debt-financed, capital-intensive datacenter build — a hawkish repricing hits both its discount
   rate *and* its cost of capital; the tape agrees, +21% on the single tame-CPI day 8/12 per the
   FOMC doc). Then the high-multiple semis **NVDA / AVGO / MRVL** (AI-beta, longest-duration cash
   flows). Middle: **MSFT / GOOG / META** (mega-cap duration, but fortress balance sheets mute the
   financing channel). Least direct: **AAPL / AMZN** (rate-path exposure only here; their
   consumer-facing channel is the retail-sales print, not ISM manufacturing). Sympathy plumbing:
   QQQ-level ISM reactions transmit to every name — the sweep
   ([`multi-symbol-sweep.md`](../multi-symbol-sweep.md)) showed peer windows are one AI-beta bet,
   not nine.

**What the conditions support.** Nothing directional — no macro playbook exists in the house set
(S1/S2/E1/S3/S4 + G1 are symbol/earnings-keyed, and every macro-shaped alpha claim would start from
zero evidence). What travels is the *shape* of S2's logic: 09-01 10:00 ET is a known-date variance
event for anything rate-sensitive that is open, and it opens the Sep 1→Sep 16 compound-risk
corridor (JOLTS same day → ISM-svcs → jobs → PPI → CPI → FOMC). Support = discipline: no new
rate-duration-sensitive paper entries initiated *into* the print without a reason that survives both
a hot-prices and a soft outcome; read the release as regime context feeding the corridor stance
docs, not as its own trigger.

**Honest limits.** D-13: no August street consensus exists yet (ISM survey consensus typically firms
in the days just ahead of release) and no whisper is findable — the July trend is the earliest honest
proxy, and it is history, not a forecast. The ROB release-calendar primary is SSO-gated (leg 1) — the
date rests on the cadence rule plus convergent aggregation, a real limit noted honestly. Reaction-day
characterizations come from press narration, not our own price instruments (macro-print mode has
none); the specific yield-level figures cited carry aggregator risk the direction does not. Search
results for 2026 macro coverage interleave stale 2022/2025 articles (one reaction search returned a
50.1 ISM-services headline that contradicts the PRNewswire primary's 54.1 — discarded) — every number
above was date-checked against a primary or a dated press source.

## Stance & kill switches

**Stance (date confirmed, ISM cadence + convergence re-checked 2026-08-19).** Treat 2026-09-01 10:00
ET as a high-impact known-date rate-path read, not a tradeable edge: no directional macro position,
no new rate-sensitive paper entries initiated into the print, and any open position sized as if both
outcomes (hot prices-paid/strong-orders → yield lift; soft print → dovish relief) are live. Base case
(**estimate-labeled**: trend extrapolation, no street consensus exists at D-13): continued expansion
near the July level with prices-paid holding elevated (>65), a hawkish-tilted read the market absorbs
unless prices-paid re-accelerates sharply. The asymmetric risk is a hot prices-paid + strong new-orders
combination that lifts yields and re-arms the September hike into the corridor, hitting CRWV and the
high-multiple semis hardest.

**Kill switches:**

- **A soft August print** — headline back below ~52 with prices-paid under 65 — kills the hawkish
  base case and flips this into a dovish-relief input on the same channel the 8/7 jobs miss and 8/12
  CPI ran; reassess the corridor skew from the actual print.
- **A weak JOLTS same-day (9/1) or jobs print (9/4)** collapsing hike odds toward zero drops this
  print's rate-path weight a tier — ISM becomes confirmation, not a fork.
- **A published August consensus emerging before 9/1** resolves this doc's biggest limit — re-run the
  "surprise" framing against it rather than the July-trend extrapolation above.
- **Energy de-escalation** (the [`CPI doc`](cpi-2026-09-11.md)'s own kill switch — a holding
  ceasefire, Hormuz reopening) would ease the goods-inflation pass-through that keeps prices-paid
  elevated; a continuation or re-shock is the leg to watch hardest in the prices subcomponent.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-08-19 | D-13 | Initial research banked (above). Date confirmed via ISM cadence rule (1st business day, 10:00 ET) + convergent aggregation; ROB primary calendar is SSO-gated (flagged). July print (rel 8/1): PMI 55.6 (+2.3, strongest since May 2022, beat ~54.0), Output 58.5, New Orders 56.7, Employment 52.8 (first expansion since Jan 2025), Prices-paid 71.1 (>70 for 6th straight month) — strong, hawkish-tilted; contributed to fresh-2026-high yields that week (Penn Mutual 8/3). Adjacency — peers: no tracked-name prints since 8/18. Macro: standing regime per the sibling CPI/FOMC/GDP ledgers (Jul CPI in-line 3.4% 8/12; Jul jobs miss 8/7; Aug 13 PPI flat → Sep hike odds <40%; energy shock/Hormuz still hot). VIX 15.84 close 8/18 (up 4.28% on day), ticked up from the 14.56 2026-low noted 8/17 — still a calm regime, no shift. Geopolitical: Hormuz tanker attacks / failed ceasefire continuing, the goods-inflation pass-through behind sticky prices-paid. Event tape: no August consensus/whisper found at D-13 (flagged as a limit). No new dated adjacencies — the existing calendar already covers the full Sep 1→Sep 16 corridor (JOLTS 9/1, ISM-svcs 9/3, jobs 9/4, PPI 9/10, CPI 9/11, FOMC 9/16); nothing to propose. | — (stance set) | 2026-08-22 (high, 8–20d band: every 3d) |
| 2026-08-24 | D-8 | Adjacency sweep. Event tape: **a consensus surfaced since D-13** — Polymarket now clusters ~28.5% on PMI 55.0–55.9, ~24% on 54.0–54.9, ~17.6% on 56.0–56.9 (nearly 60% combined in the mid-55 band), continuing straight-line off July's 55.6 beat rather than pricing a reversal. Peers: no tracked-name prints since 8/18; NVDA's implied move fell to ~5.3%, MRVL's jumped to ~18.4% (both own docs) — tape context, not ISM-specific. Macro: no CPI/jobs/FOMC surprise since 8/19; standing regime unchanged (Sep-16 read hawkish-hold ~60-70%/hike ~30-40%/cut ~0%, per the FOMC sibling doc — supersedes the D-13 row's "<40% hike odds" framing, which predates that doc's own correction). Volatility regime: VIX 15.13, calm, no shift. Geopolitical: Brent -1.38% to $93.09 on 8/24, first pause in the two-week escalation (new Iran sanctions pending) — same finding as sibling docs; still the live driver behind sticky prices-paid if August repeats the >70 streak. No new dated adjacency found. | — (no change; consensus now exists and sits in-line with the strong-July base case, not a surprise setup) | 2026-08-27 (high, 8-20d band: every 3d) |
| 2026-08-26 | D-6 | Adjacency sweep. Event tape: consensus clustering reconfirmed, unchanged from D-8 — fresh sources (PNC Economics, Lines.com prediction markets, checked today) still anchor the mid-55 band, with 55.0–55.9 and 54.0–54.9 bins together capturing nearly 60% of implied probability, straight-lining off July's 55.6 beat; no reversal being priced. Peers: NVDA reports tonight, MRVL tomorrow (D-1) — both own docs now show de-stressed implied moves (NVDA ~5.3%, MRVL deflated to ~8.5% from 18.4%) since the D-8 row. Macro: Sep 15–16 FOMC odds firmed further to ~73% hold / 26% hike / 1% cut (Kalshi, checked today) from the ~60-70%/30-40%/~0% split carried since D-13 — hold conviction building, still zero cut priced; consistent direction with, not a reversal of, the standing regime. Volatility regime: VIX ~15.8 (Bespoke/Fed data, checked 8/25) — same calm range held all month, no break. Geopolitical: Strait of Hormuz escalated further overnight (tanker hit off Oman 8/25) — the same energy-pass-through risk that's kept prices-paid >70 for six straight months; watch August's prices-paid subcomponent for a seventh. No new dated adjacency to propose — the Sep 1→16 data corridor is already fully on the calendar. | — (no change; consensus still sits in-line with the strong-July base case) | 2026-08-29 (high, 8-20d band: every 3d) |
| 2026-08-27 | D-5 | Adjacency sweep. Peers: not directly applicable — `symbols: []`, market-wide event; no tracked-name print since MRVL (8/27, today, own doc). Macro surprises: the two 8/26 compound-day prints closed out (own PRs #683/#684, both open/pending merge, cited as prior context) — GDP 2nd estimate unrevised at **+1.5%** (kill switch did not fire) and core PCE **+0.2% m/m / 3.3% y/y**, dead-center on the priced whisper, in line; headline PCE **+0.2% m/m / 3.7% y/y**, a mild ~0.1pt upside miss vs the 3.6% street consensus on the headline leg only. Both scored as non-events, base case confirmed — no shift to the standing ~73% hold / 26% hike / 1% cut FOMC pricing carried since the D-6 row. Jackson Hole (Warsh's first keynote, 08-28 10:00 ET) has not landed as of this pulse — still one day out, watch next row. Volatility regime: VIX ~15.21 close 8/27 (down ~1.6% on the day, per live coverage) — same calm 14–16 range held all month, no break. Geopolitical: mixed, not a clean de-escalation — a tanker was hit by a projectile off Oman 8/25 (per the D-6 row), but fresh checks show ~236 ships transited the strait over 19 days in August (a real recovery vs the acute-disruption period), an Iran–Oman temporary-shipping-route proposal, and Qatar's PM visiting Tehran to de-escalate; Section 232 steel/aluminum/copper tariffs unchanged since the June 2026 modification, no new dated trade action. Event tape: prediction-market consensus unchanged from D-8/D-6 (Polymarket, checked today: 55.0–55.9 at 28.5%, 54.0–54.9 at 24%, 56.0–56.9 at 17.6%, still straight-lining off July's 55.6 beat). **New finding not previously in this doc:** S&P Global's flash US Manufacturing PMI (a different, independent survey from ISM) printed **53.2** for August (released 2026-08-21, a 5-month low, missing its own 53.9 estimate, attributed to reduced safety-stock building and supply delays) — the first genuinely soft manufacturing data point this cycle, though it measures on a different scale/methodology than ISM's index (which hit 55.6 in July) and is not a like-for-like predictor. Chicago PMI and the Richmond Fed survey have not yet posted August readings (Chicago PMI releases 8/28, same day as Jackson Hole) — no regional-Fed preview available yet. No new dated adjacency found — the Sep 1→16 corridor is already fully on the calendar. | — (no change; strong-July base case holds, but the S&P Global flash miss is a genuine first soft data point worth weighing against the mid-55 consensus clustering into the print) | 2026-08-28 (high, 0-7d band: every 1d) |
| 2026-08-28 | D-4 | Adjacency sweep. Peers: n/a, `symbols: []`. Macro surprises: Warsh's first Jackson Hole keynote as Fed chair lands today (reported timing conflicts across sources, 8:00–10:00 ET — the sibling [`jackson-hole doc`](jackson-hole-2026-08-28.md) owns the outcome) and had not landed as of this check; prediction markets ahead of it priced <10% odds Warsh says "rate cut," with the setup risk being an absence of a clear reaction function reading as dovish by default. Chicago PMI (same-day release, ~9:45 ET) had also not posted its August reading as of this check — its most recent fetchable data point remains August 2025's 41.5 miss, not usable as an August-2026 read. Volatility regime: VIX ~15.2, holding the same 14–16 calm range carried since D-6, no break. Geopolitical: no material change from the D-5 row — Hormuz transit volumes continue their partial recovery (U.S. Centcom: ~660M bbl aided since May; recent nightly transits 15–20 tankers, still well below the ~20M bbl/day pre-war baseline), no new attack or ceasefire dated since 8/25. Event tape: ISM-mfg prediction-market consensus unchanged (55.0–55.9 / 54.0–54.9 / 56.0–56.9 the top three bins, same as D-8/D-6/D-5), still straight-lining off July's 55.6 beat; the S&P Global flash-PMI soft print (53.2, 8/21) remains the one dissenting data point, unconfirmed by any second source since. No new dated adjacency found — the Sep 1→16 corridor is already fully on the calendar. | — (no change; base case and the flash-PMI caveat both stand unresolved pending today's Jackson Hole and Chicago PMI outcomes, which land after this pulse was run) | 2026-08-29 (high, 0-7d band: every 1d) |

| 2026-08-29 | D-3 | Adjacency sweep. **Peers:** n/a — `symbols: []`, market-wide event. **Macro surprises — two on 2026-08-28, pointing opposite ways, and the tape only listened to one.** (a) **Chicago PMI collapsed to 47.1** (Aug data, released 8/28 09:45 ET) against a **57.9–58.3** consensus and a **57.6** July print — a **−10.5pt** m/m plunge into contraction and the lowest reading of 2026 (tradingeconomics.com/united-states/chicago-pmi fetched directly today; Investing.com/cryptobriefing corroborate the 47.1 and the >10pt miss; the consensus figure itself differs 57.9 vs 58.3 across sources and is not reconciled here). This is the single most relevant new input for **this** print: Chicago is the closest-timed regional analog to the national ISM and it missed by more than ten points three days out. **Honest weight:** the Chicago→ISM relationship is noisy and has diverged badly in single months before — this widens the distribution around 9/1, it does not shift the point estimate, and this doc is not calling a soft print off one regional survey. (b) **Warsh's Jackson Hole keynote landed hawkish** — inflation "still too high," the Fed has "more work to do," financial conditions judged accommodative rather than restrictive, and **forward guidance formally abandoned** ("a discipline, not a decision"); September hike odds went **~35% → 57–59%** on futures (Kalshi **48% hike** vs ~70% hold pre-speech), 2y **+~8bp**, 10y **+4bp to 4.72%**. Full scoring in the sibling [`jackson-hole`](jackson-hole-2026-08-28.md) close-out, filed the same day. **Recording a miss in this doc's own prior row:** the D-4 row named the setup risk as "an absence of a clear reaction function reading as **dovish** by default." That was wrong. The absence read **hawkish** — the market treated the vacuum plus the inflation framing as a hike signal, not a dovish one. **The tension that matters for 9/1:** Warsh called the economy "strengthened" the same morning the sharpest regional growth miss of the year printed, and the tape sided with Warsh — which raises the bar for a soft ISM to move hike odds at all. **Volatility regime:** VIX **14.43** at the 8/28 close (`event-material-scan` probe), from 14.56 on 8/27, with an intraday **14.1** — the **lowest of 2026**. No regime break; the anomaly worth naming is equity vol at a year low on the session hike odds nearly doubled. **Geopolitical:** Brent fell **below $87** in a fourth straight down session on an Iran–Oman Hormuz revenue-sharing agreement, though Tehran stressed it does not reopen the strait; Hormuz crude flow is still ~**4.9 mb/d** (Q2 2026) against **21.6 mb/d** pre-conflict (EIA/CRS). Falling crude is a mild disinflationary offset feeding directly into this doc's prices-paid leg — the first input since seeding that argues prices-paid could soften rather than hold >70. **Event tape:** ISM confirms the Aug-data release **2026-09-01, 10:00 ET**. July restated for the record: headline **55.6** (vs 54.0 consensus, strongest since May 2022), prices-paid **71.1**, new-orders **56.7**, employment **52.8**. Polymarket's August bins still cluster **55.0–55.9 and 54.0–54.9 (~60% of implied)** — the betting tape has **not** repriced for Chicago. **New dated adjacency found → proposed in this PR:** **Chicago PMI is not on our calendar at all**, despite just delivering a >10pt surprise that leads this print; `chicago-pmi-2026-09-30` is added as `status: estimate` (`NEWS:` mnimarkets.com publication calendar, 09:45 ET) — the publisher's own calendar, but filed as an estimate per this lane's limits rather than claimed as primary. | — (no directional change; the soft-print branch gains a real leading indicator while the betting tape has not moved, and the decision header is updated to say so) | 2026-08-30 (high, 0+ band: every 1d) |

**Rules.** Rows append only — editing a past row is falsification. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed to `market-events.ts` as an `estimate` in
the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first),
never from memory — after which this doc goes quiet.
