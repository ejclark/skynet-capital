# OPEC+ ministerial meeting (October quotas) — opec-plus-meeting-2026-09-06

**Kind:** geopolitical · **Date:** 2026-09-06 (estimate, EST: opec.org press release 2026-08-02 states verbatim "The next meeting will be held on 6 September 2026" — primary-sourced but filed estimate per the event-research lane's no-self-confirm limit, checked 2026-08-31) · **Impact:** medium
**Last assessed:** 2026-08-31
<!-- probe-ref: {"symbols":{},"vix":14.43,"daysBand":"medium:0+","adjacentIds":["aapl-iphone-18-launch-2026-09-09","adp-employment-2026-09-02","beige-book-2026-09-02","challenger-job-cuts-2026-09-03","cpi-2026-09-11","fomc-blackout-start-2026-09-05","ism-manufacturing-2026-09-01","ism-services-2026-09-03","jobs-2026-09-04","jolts-2026-09-01","ppi-2026-09-10","treasury-10y-note-2026-09-09","treasury-30y-bond-2026-09-10","treasury-3y-note-2026-09-08","treasury-buyback-10y20y-2026-09-10","treasury-buyback-increase-2026-09-09"],"screenStreak":0} -->

## At a glance

**TL;DR.** **Stand aside — and watch the chokepoint, not the quota.** Seven OPEC+ countries (Saudi
Arabia, Russia, Iraq, Kuwait, Kazakhstan, Algeria, Oman) meet **Sunday 2026-09-06** to set October
levels. The base case is a **pause** — no October increase — but that is reported by delegates and
by Rystad, **not** written anywhere in OPEC's own 2026-08-02 press release, which says nothing at
all about Q4 (verified verbatim against the primary today). The bigger point is that the quota is
the wrong variable this cycle: the Strait of Hormuz has been effectively closed to routine
commercial traffic since early July, roughly **20% of world oil and LNG** moves through it, and
essentially **all** of OPEC's spare capacity sits behind it — so a ±188 kb/d paper decision is
second-order to whether the barrels can physically sail. The tape agrees: crude fell **>5% on the
week to 8/28** on the 8/26–8/27 Iran–Oman corridor framework, then rose **~1.7%** on a single
military strike (US hit Iranian rocket launchers on **Larak Island** on 8/30; Brent Nov ~$89.62,
WTI ~$84.69). Nothing here is name-keyed — `symbols: []` — and the event is **estimate**-dated, so
no date-keyed action is licensed regardless. Two calendar quirks worth knowing: 9/6 is a **Sunday**,
and Monday 9/7 is **Labor Day**, so crude reprices at the Sunday-evening futures open while US cash
equities cannot react until **Tuesday 2026-09-08**.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-6) | **Stand aside** | High | Nothing name-keyed (`symbols: []`), date is **estimate**, and the meeting's expected outcome is "change nothing." | An OPEC+ headline before **2026-09-06** moving Brent >5% in one session — the meeting would be getting traded in advance rather than being the non-event this call assumes |
| This week | **Watch the Hormuz tape, not the communiqué** | Medium | The pause is source-reported, not on the record; but even a surprise is small against a chokepoint running far below baseline. Crude prices it Sunday evening; equities not until Tue **09-08**. | The **2026-09-06** statement announcing an **October increase** instead of a pause — the "agreement in principle" reporting was wrong and the group is back in market-share mode |
| This month | **No position; treat crude as an input to the Fed corridor, not a trade** | Medium | Transmission to our names is two-step (crude → CPI energy / ISM prices-paid → Sep-16 hike odds → real yields), and our own registered FT-12 says CPI reactions are **core**-keyed, discounting energy-driven headline surprises. | Brent sustaining **>$100 through 2026-09-30** — energy stops being a discountable headline component and starts broadening into core, which is the [CPI ledger](cpi-2026-09-11.md)'s stated flip condition |
| This quarter | **Watch the 2027 baseline fight — that is the event with a real tail** | Low | Third-party MSC capacity audits (commissioned Jan–Sep 2026) set 2027 baselines; Iraq wants more, Kazakhstan carries the largest compensation burden. Cohesion, not October, is the risk. | A member publicly rejecting its 2027 baseline or exiting on/before the **2026-10-04** JMMC (proposed to the calendar in this PR) — "the pause is orderly" dies |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — take a crude- or energy-keyed position off this meeting. `symbols: []`, the date is
  **estimate**, and no house playbook covers commodities.
- **The number that matters is not the quota** — it is Hormuz transit. Baseline ~110 vessels/day;
  late-August throughput reported at ~20% of pre-war average. Sustained recovery >60/day is what
  would make an OPEC quota decision price-relevant again.
- **The surprise to size, if one comes** — an **October increase** (bearish crude, mildly
  disinflationary into the 09-10 PPI / 09-11 CPI) is the low-probability tail; an explicit deeper
  cut is the other. A pause is already in the price.
- **Most exposed among our names, and only indirectly** — CRWV, then the high-multiple semis, via
  the real-yield discount rate; see [`ai-energy-constraint.md`](../ai-energy-constraint.md) for the
  separate, direct power-opex channel.
- **Watch (dated)** — jobs **2026-09-04** · FOMC blackout starts **2026-09-05** · this meeting
  **2026-09-06** · first US equity session that can react **2026-09-08** · PPI **2026-09-10** ·
  CPI **2026-09-11** · FOMC **2026-09-16** · 68th JMMC **2026-10-04** (estimate).

## Initial research

**The question.** What is OPEC+ likely to decide about October quotas at the 2026-09-06 meeting,
how would the market react in each direction, and does any of it change how we should sit in the
tracked names (NVDA MRVL AVGO CRWV MSFT GOOG META AAPL AMZN)?

**One-line verdict:** a widely-expected non-decision (a Q4 pause) taken by a group whose spare
capacity is physically trapped behind a chokepoint running far below normal — so the meeting is
low-information for price, the transmission to our book is a weak two-step through the Fed corridor,
and the honest play is a stand-aside with the Hormuz tape as the thing actually worth watching.

**Method.** Sourced web research per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md)
(geopolitical mode: no price instruments — the house instruments are equity/earnings-keyed and
cover no commodity). Primaries fetched directly: opec.org's 2026-08-02 seven-country press release
and its 2026-08-02 67th-JMMC release. Price readings pulled live from the same Yahoo endpoint
`scripts/event-material-scan.mjs` uses (BZ=F, CL=F, ^VIX, XLE, USO), 2026-08-31. Trade press (Oil &
Gas Journal, EnergyConnects, The National, Investing.com, RFE/RL, Washington Post headline) used for
reaction narration and delegate sourcing, each claim dated.

**Two source hygiene notes, stated up front.** (1) A search for OPEC+ market-share/Trump-pressure
context returned a coherent-looking but **2025**-vintage cluster — "+548 kb/d in August", "oil
settling around $67", "October increase of 137 kb/d", "next meeting October 5" — every figure of
which contradicts the 2026 primary (188 kb/d, Brent ~$89, next meeting 09-06). **Discarded, not
used**, the same stale-extraction trap the [CPI ledger](cpi-2026-09-11.md)'s D-18 row caught. (2)
`hormuzstraitmonitor.com` supplied a detailed crisis timeline; it is an aggregator of unverified
provenance, so it is used for shape only and every load-bearing item taken from it is labelled as
such below.

**Conviction legs, tested:**

1. **The date is right, and its calendar position is unusual — SUPPORTED.** OPEC's own press
   release of 2026-08-02 (opec.org, fetched 2026-08-31) closes with the verbatim sentence "The next
   meeting will be held on 6 September 2026." It stays **estimate** in our calendar per this lane's
   no-self-confirm limit, not because the source is weak. Two consequences nobody has written down
   yet: **2026-09-06 is a Sunday**, so the headline lands before the Sunday-evening futures reopen
   and crude prices it roughly 24 hours ahead of anything else; and **Monday 2026-09-07 is Labor
   Day**, so the first US cash-equity session that can react is **Tuesday 2026-09-08** — which is
   also the 3-year note auction ([`treasury-3y-note-2026-09-08`](treasury-3y-note-2026-09-08.md),
   carrying its own registered FT-20). Any equity-side reaction on 9/8 is therefore confounded by
   the auction from the start.

2. **The base case is a pause — SUPPORTED, but it is *not* on the record — and one outlet has
   overstated it.** The 8/2 meeting agreed **+188 kb/d for September**, completing the rollback of
   the April-2023 voluntary layer; the seven noted the step "will provide an opportunity for the
   participating countries to accelerate their compensation" (opec.org primary). On October or Q4
   the release is **silent** — Oil & Gas Journal states it plainly: "the group's official statement
   gave no explicit guidance on fourth-quarter policy." The pause comes from elsewhere: delegates
   via Reuters/Bloomberg said the group expects quotas held steady for the rest of 2026; a source
   described an "agreement in principle" for a September increase and a pause thereafter (New
   Straits Times headline, 2026-08); and Rystad's Jorge Leon is quoted directly — "Our base case is
   a fourth-quarter pause while the group prepares for the 2027 quota negotiations" (EnergyConnects,
   2026-08). Against that, The National wrote the pause as settled fact ("The group **will** pause
   production increases in the fourth quarter"), which the primary does not support. **That gap is
   the event risk**: a well-telegraphed pause is priced, and the only thing left to surprise is the
   telegraph being wrong.

3. **The quota is the wrong variable this cycle — SUPPORTED on direction, MIXED on magnitude.** The
   Strait of Hormuz has been the binding constraint since the conflict opened on 2026-02-28: Iran
   closed it in early March, a mid-June memorandum reopened it partially, that framework collapsed
   in early July, and the strait has been effectively shut to routine commercial shipping since
   (aggregator timeline, corroborated in shape by CNN's 2026-08-13 live coverage and Al Jazeera's
   2026-08-12 report that fresh attacks dented reopening hopes). Roughly **20% of world oil and
   LNG** transits it, and Saudi and UAE — who hold essentially all meaningful global spare capacity
   — both export through it. So restoring a quota does not restore a barrel. The tape's revealed
   sensitivity supports this ordering: Brent extended **weekly losses over 5%** into 2026-08-28 on
   the **Iran–Oman phased corridor framework** (announced 8/26, revenue-sharing confirmed 8/27),
   then gained on a single strike two days later. **MIXED on magnitude** because no event study of
   crude's reaction to 2026 OPEC+ decision days was assembled this session — see Limits.

4. **The 8/30 Larak strike is the live escalation, and it is smaller than one sibling ledger says —
   SUPPORTED.** US forces struck two Iranian rocket launchers on **Larak Island** on 2026-08-30
   after the IRGC was observed preparing to fire rockets carrying sea mines into the strait; it was
   the first publicly reported direct US strike on Iranian positions in over a month (Washington
   Post, RFE/RL, 2026-08-30). Larak sits at the 39-km narrows opposite Oman's Great Quoin Island.
   Price effect, from two independent reads: Investing.com reports Brent Nov **+1.7% to $89.62** and
   WTI **+1.6% to $84.69** in Asian trade; the tape I pulled myself agrees — BZ=F ran 89.75 → 89.25
   across the Sunday-evening session (last print 2026-08-31T00:44Z), CL=F 84.34, against a Friday
   8/28 last of ~88.29. **Correction worth banking:** the same-day
   [`ism-manufacturing-2026-09-01`](ism-manufacturing-2026-09-01.md) D-1 row states Brent went "back
   above $90 (+2.5%)", sourced to profilenews.com. Neither my hourly BZ=F bars nor Investing.com
   corroborate a $90 print. The **direction** is right in both accounts; the **level** is not, and
   the higher figure traces to the weaker source.

5. **Transmission to our tracked names is two-step and low-fidelity — SUPPORTED.** This event
   carries `symbols: []` for a reason: we hold no energy names. The only path to our book is crude
   → CPI energy and ISM prices-paid → September hike odds (~56–59% after Warsh's 2026-08-28 Jackson
   Hole keynote, per the [CPI](cpi-2026-09-11.md) and [ISM](ism-manufacturing-2026-09-01.md)
   ledgers) → real yields → long-duration AI names, CRWV most exposed. Two things attenuate it hard.
   The August CPI collection window is already closed, so a September crude move cannot reach the
   09-11 print at all. And our own **FT-12** registers the claim that CPI reactions are **core**-
   keyed, with energy-driven headline surprises discounted — which is precisely the kind of surprise
   this event could produce. A weak channel, further discounted by our own reaction-function
   hypothesis, is not a trade.

6. **The real event is 2027, not October — SUPPORTED (structural, low urgency).** OPEC+ is running
   third-party audits of members' Maximum Sustainable Capacity, commissioned across January–
   September 2026, to set the **2027 baselines** from which quotas derive. Iraq is pushing for a
   higher individual quota to reflect capacity; Kazakhstan carries the alliance's largest cumulative
   compensation burden, with analysts openly doubting its makeup schedules are deliverable while its
   mega-projects ramp. That is the fight that could actually fracture the group — and the pause is
   partly *for* it, buying quiet while the numbers get negotiated. Its next scheduled public
   checkpoint is the **68th JMMC on 2026-10-04**, stated verbatim in opec.org's 2026-08-02 JMMC
   release ("The next meeting of the JMMC (68th) is scheduled for 4 October 2026") and **proposed to
   the calendar as an `estimate` in this PR**. Note the JMMC monitors conformity and recommends — it
   does not set quotas — which is why it is filed `low` impact, not `medium`.

**What the conditions support.** Nothing to enter. The honest output of this research is a
stand-aside plus a **watch-list re-pointing**: for the next month, the variable to track for the
inflation leg of the CPI/ISM/PPI ledgers is **Hormuz transit volume**, not OPEC+ quota headlines.
That is a cheap, checkable substitution and it is the whole deliverable.

**Limits, honestly.**
- **The biggest gap:** no measured base rate for crude's reaction to OPEC+ decision days exists in
  this repo. `earnings-cycle.mjs`/`intraday-edges.mjs` are equity- and earnings-keyed and cover no
  commodity, and none was built this session. Leg 3's magnitude claim therefore rests on narrative
  comparison of two dated moves, not on a distribution. Anyone promoting this to a sized view needs
  that study first.
- **The pause has no primary.** It traces to unnamed delegates through secondaries. Treat "priced"
  as an inference about consensus, not an observation of it — no OPEC-decision prediction market was
  found this session.
- **Level figures carry ±~$1 source risk.** Yahoo's BZ=F daily bar for 8/28 reads 89.31 while its
  own hourly last for the same session reads 88.29 (settlement vs last). Directions are reliable;
  levels are quoted to the source that produced them and not smoothed across sources.
- **Hormuz status is aggregator-sourced.** The transit figures (~110/day baseline, ~20% of pre-war
  average in late August) come from a monitor site of unverified provenance, corroborated only in
  shape by CNN and Al Jazeera reporting. A kill switch keyed to that number should be checked
  against IMF PortWatch directly, not against the aggregator.

## Stance & kill switches

**Stance (set 2026-08-31, D-6): stand aside; watch the chokepoint, not the quota.** The
2026-09-06 meeting is **estimate**-dated, carries no tracked symbols, and its expected outcome is
"change nothing." Even a surprise is second-order to Hormuz transit, and the path from crude to our
book is a discounted two-step through the Fed corridor. No entry, no hedge, no pre-positioning is
licensed by this event — and the **estimate** label forbids date-keyed action independently of any
of the above.

**Kill switches** — any of these fires and the stance gets re-argued, not tweaked:

1. **The pause doesn't happen.** The 2026-09-06 communiqué announces an **October increase**.
   → the delegate reporting was wrong, the group is back in market-share mode, and the crude-side
   disinflation leg in the CPI/ISM/PPI ledgers needs re-weighting. Check: opec.org press releases,
   2026-09-06.
2. **The quota starts mattering again.** Hormuz transit recovering above ~60 vessels/day and
   holding a week before **2026-09-30** → spare capacity becomes physically deliverable and OPEC
   decisions regain price power. Check: IMF PortWatch (primary), not the aggregator.
3. **Cohesion breaks.** A member publicly rejecting its 2027 MSC baseline, or announcing exit, on or
   before the **2026-10-04** JMMC → "the pause is orderly" was the wrong frame and the tail is much
   fatter than `medium` impact implies.
4. **The channel gets strong enough to matter.** Brent sustaining **>$100 through 2026-09-30** →
   energy stops being a discountable headline component and begins broadening into core, the
   [CPI ledger](cpi-2026-09-11.md)'s own stated condition for flipping energy from noise to signal.

**Forward tests registered** in [`forward-tests.md`](../forward-tests.md) this session: **FT-25**
(the 09-06 meeting produces no October increase) and **FT-26** (the decision is a non-event for
crude — |Brent 09-04 → 09-08 settle| < 3%).

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-08-31 | D-6 | Initial research banked. Date **estimate**, re-verified against the opec.org primary today (2026-08-02 release, verbatim "The next meeting will be held on 6 September 2026"). **Peers:** n/a — `symbols: []`, no energy names tracked. **Macro:** the corridor around this event is thick — ISM-mfg + JOLTS 9/1, ADP + Beige Book 9/2, Challenger + ISM-svcs 9/3, jobs 9/4, FOMC blackout starts 9/5, 3Y auction 9/8, PPI 9/10, CPI 9/11 (16 adjacent ids inside ±5d, all already on the calendar). Sep-16 hike odds ~56–59% post-Warsh (8/28), carried from the CPI/FOMC ledgers, not re-derived. **Volatility:** VIX **14.43** (8/28 close, latest available) — calm 14–16 band intact, no regime shift; XLE 62.68, USO 129.70 (8/28). **Geopolitical (the live leg):** US struck two Iranian rocket launchers on **Larak Island** 8/30, first direct strike in >1 month, after IRGC was seen preparing mine-carrying rockets (WaPo/RFE/RL). Crude up modestly — Brent Nov ~**$89.62** (+1.7%), WTI ~**$84.69** (+1.6%) per Investing.com; my own BZ=F pull agrees (89.75 → 89.25 across the Sunday session, last 2026-08-31T00:44Z), **contradicting** the same-day ism-manufacturing D-1 row's "back above $90" (profilenews-sourced) — direction right, level not corroborated. This follows the **8/26–8/27 Iran–Oman phased corridor + revenue-sharing framework** that drove Brent >5% lower on the week. **Event tape:** the Q4 pause is delegate/Rystad-sourced ("Our base case is a fourth-quarter pause while the group prepares for the 2027 quota negotiations", Leon), **absent from OPEC's own statement** (OGJ: "no explicit guidance on fourth-quarter policy"); The National reports it as settled fact, which the primary does not support. Structural driver: MSC capacity audits (Jan–Sep 2026) setting 2027 baselines, Iraq pushing for more, Kazakhstan carrying the largest compensation burden. **Discarded:** a 2025-vintage search cluster (+548 kb/d August, $67 oil, 137 kb/d October, "next meeting October 5") contradicting every 2026 primary — not used. **Dated discovery proposed:** 68th **JMMC 2026-10-04** (opec.org primary, filed `estimate`/`low` in this PR — JMMC monitors and recommends, it does not set quotas). **Calendar quirks logged:** 9/6 is a Sunday and 9/7 is Labor Day, so crude prices the decision at the Sunday-evening open and US equities cannot react until Tue 9/8 — itself the 3Y auction, so any equity reaction is confounded from the start. | — (stance set: stand aside; watch Hormuz transit, not the quota) | 2026-09-02 (medium, 0–7d band: every 2d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse: it is a note to
the next session, not an essay, and a stance *change* earns its sentence in the Stance section with
the row as its receipt. The adjacency sweep (peer prints · macro surprises · VIX regime ·
geopolitical · event tape) runs in every row; a dated adjacent event found gets proposed to
`market-events.ts` as an `estimate` in the same PR. Close-out fills `## Outcome` below from re-run
instrument data (cache busted first), never from memory — after which this doc goes quiet.
