# S&P DJI December quarterly rebalance takes effect — the one December-only mechanism is a null, and two candidate findings died on their own controls — sp-quarterly-rebalance-effective-2027-12-20

**Kind:** sector · **Date:** 2027-12-20 (estimate — **EST: the owner's own effective-date wording, re-fetched this session from three separate quarters including a December one, then applied forward.** All three from S&P DJI's own newsroom, fetched direct 2026-09-08, HTTP 200: the **2025-12-05** release (79,722 bytes) — *"effective prior to the open of trading on **Monday, December 22**, to coincide with the quarterly rebalance"*, third Friday **2025-12-19**; the **2026-06-05** release (80,393 bytes) — *"Monday, June 22, 2026"*, third Friday **2026-06-19**; the **2026-09-04** release (79,423 bytes) — *"Monday, September 21, 2026"*, third Friday **2026-09-18**. One sentence, three quarters, one geometry. A fourth, **SEC-filed** primary names December explicitly and was re-fetched too: Select Sector SPDR Trust Form 497 (accession 0001193125-26-031948, 2,388,335 bytes) — *"Changes will become effective after the market close on the third Friday of March, June, September and December."* December 2027's Fridays are the 3rd, 10th, **17th**, 24th and 31st, so the third Friday is **2027-12-17** — independently `confirmed` on OCC's own 2027 calendar by [`opex-2027-12-17`](opex-2027-12-17.md) — and the rebalance is effective prior to the open on **Monday 2027-12-20**, implemented at the 2027-12-17 close. Stays `estimate` on two counts, not the proposal's three: this calendar's confirmed-tier prefixes have no member for an index owner's own schedule, and the 2027 release does not exist yet — it is due around **2027-12-03**) · **Impact:** low
**Last assessed:** 2026-09-08
<!-- probe-ref: {"symbols":{},"vix":15.72,"daysBand":"low:15+","adjacentIds":["bond-market-early-close-2027-12-23","christmas-market-closure-2027-12-24","consumer-confidence-2027-12-22","opex-2027-12-17","sifma-bond-early-close-2027-12-23","vix-expiration-2027-12-22"],"screenStreak":0,"blocked":[{"url":"https://www.spglobal.com/spdji/en/documents/methodologies/methodology-sp-us-indices.pdf","status":"403","at":"2026-09-08"},{"url":"https://www.spglobal.com/spdji/en/documents/methodologies/methodology-sp-float-adjustment.pdf","status":"403","at":"2026-09-08"},{"url":"https://stooq.com/q/d/l/?s=spy.us&i=d","status":"JS_CHALLENGE","at":"2026-09-08"}]} -->

## At a glance

**TL;DR.** **Stand aside on every horizon — and the reason this ledger is worth five minutes is that it raised two findings and killed both with its own controls.** The date is now solidly sourced: three re-fetched S&P DJI releases from three different quarters, **one of them a December instance**, all word the effective date identically, and an SEC-filed 497 names December outright — so `estimate` here is a missing source prefix and a not-yet-published 2027 release, not missing evidence. **The headline is a discharged flag.** [`opex-2027-12-17`](opex-2027-12-17.md)'s own proposal warned that December witching *"carries annual index reconstitution flow in some index families; this lane did not research that."* The family is Nasdaq's; its methodology, fetched direct today, puts the **annual NASDAQ-100 reconstitution effective at the open of 2027-12-20 — the same session as this event**. It leaves no index-level trace: QQQ's relative volume on the December effective open is the **lowest of any bucket measured** (0.864× mean / 0.898× median, **6 of 21** above 1.0×), its third-Friday volume shows **no** December step against its own other quarters (MW **p=88.9%**), and its excess return over SPY that session is **7 of 21** negative (sign **p=18.9%**). The S&P leg is the same null, December-specifically: SPY total return **9 of 21** negative (**p=66.4%**), relative volume indistinguishable from ordinary December sessions (**p=48.1%**) and from the same Dec 18–24 calendar window (**p=74.3%**). **Two candidate findings then died on their controls, and that is the transferable part.** A positive overnight gap on the effective open looked real at **16 of 21** (**p=2.7%**) — until every *other* December session printed the same gap (251 of 421, **p≈0.0%**; MW **p=13.7%**). And a large QQQ-minus-SPY third-Friday volume deficit looked decisive at **18 of 21** (**p=0.1%**, 10 of 10 since 2016) — until placebo **first** and **second** Fridays of December fired at 16 of 21 each (**p=2.7%**). Both statistics measure *December*, not this event. The only durable number is an execution one: the December implementation Friday is the **largest** of the four quarterly legs at **1.789× median** SPY volume, but that premium over the other quarterly legs is **not established** (MW **p=13.6%**, n=21) — only the step over an ordinary monthly opex Friday is (**p=1.89%**).

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** | High | The event is **468 days out**, `symbols` is empty by design, and no house playbook is rebalance-, opex- or index-flow-keyed — `trade-playbooks.md` and `multi-symbol-sweep.md` re-grepped this session for `rebalanc\|index effect\|reconstitut\|deletion\|witching\|closing auction` → **zero hits** in both | A house playbook keyed to index-flow or a closing auction landing in `trade-playbooks.md` before **2026-10-08**, this event's next scheduled pulse — there would then be a mechanism to point at this date |
| This week | **Stand aside** | High | Nothing about this event publishes for over a year: S&P DJI's December 2027 release is due around **2027-12-03**, and Nasdaq's reconstitution announcement is methodology-dated after the close on **2027-12-10** | S&P DJI publishing a **methodology change** to its rebalance schedule before **2026-10-08** — the Monday-after-third-Friday geometry all four sourced primaries agree on would stop dating this event |
| This month | **Stand aside — and do not re-run the two dead statistics** | High | The overnight-gap result (16/21, p=2.7%) and the QQQ−SPY volume deficit (18/21, p=0.1%) are both recorded here as **refuted by their own placebos**, so a later pulse that re-derives either has re-found a December seasonal, not this event | A December-only control this session did not build — a same-window placebo on a year with **no** December rebalance — showing the gap effect absent; there is no such year, which is precisely why the seasonal cannot be separated and the statistics stay dead |
| This quarter | **Treat 2027-12-17, not 2027-12-20, as the only session in this chain that carries an execution hazard — and size it as quarterly, not December** | Medium | SPY's third-Friday relative volume runs **1.639× mean / 1.789× median** in December against **1.420× / 1.377%** for Mar/Jun/Sep and **1.253× / 1.116×** for ordinary opex months. The step over ordinary months is real (MW **p=1.89%**); the step over the other **quarterly** legs is not (**p=13.6%**, n=21) | SPY's **2027-12-17** volume printing below **1.0×** its trailing-60 median — 5 of 21 December legs did, and the execution hazard this ledger hands the opex corridor would be overbuilt. Registered as `FT-…-2` |

**Signals & conditions** — the buy/sell/hold triggers:

- Date is `estimate` — **owner-published rule, three re-fetched instances, no 2027 release yet**. It widens caution and licenses **no** date-keyed action.
- **The effective open is a measured null on every channel tried** — SPY return 9/21 (p=66.4%), SPY volume vs ordinary December sessions (p=48.1%), QQQ volume the lowest bucket at 0.864×. Whatever 2027-12-20 prints is the corridor and the holiday week.
- **The annual NASDAQ-100 reconstitution is effective on this same open** (Nasdaq methodology, fetched 2026-09-08) — and adds no measurable index-level flow. The proposer's flag is discharged as a null, not as an unknown.
- **Two statistics are dead and must not be revived without a new control** — the +16/21 December gap and the −18/21 QQQ volume deficit. Placebo Fridays and other December sessions fire at the same rate.
- **The hazard, if any, is the 2027-12-17 close**, sized as a quarterly witching Friday (+0.30–0.67× median SPY volume over an ordinary opex Friday) and **not** as a December-specific one. That is an E1-class execution rule, not a trade.
- **Beware the trailing-60 window in December** — a December relative-volume ratio is measured against a Sep–Dec window that contains Thanksgiving week, which inflates it. Every cross-vehicle number here is a *difference* for exactly that reason.
- **The corridor is thin but ends in a closure** — **6** tracked ids within five days: [`opex-2027-12-17`](opex-2027-12-17.md) (**high**, `confirmed`) at T−3, `consumer-confidence-2027-12-22` (**medium**) and `vix-expiration-2027-12-22` at T+2, two bond early-close proposals at T+3, and `christmas-market-closure-2027-12-24` at T+4.
- Chain: NDX reconstitution reference close **2027-11-30** → S&P DJI release ~**2027-12-03** → Select Sector reference close + NDX announcement **2027-12-10** (both proposed this PR) → implementation at the **2027-12-17** close → **effective open 2027-12-20**.

## Initial research

### The question

This id reached the calendar as a single proposal from the [`opex-2027-12-17`](opex-2027-12-17.md) initial
research, filed 2026-09-08. That proposal did two useful things and left one hole. It named the mechanism
honestly — the rebalance prints at the third Friday's close, i.e. into the opex lane's own settlement — and
it then **refused the obvious inference on its own measurements**: the rebalance recurs every quarter, so it
cannot explain anything December-specific, and December quarterly expirations measured indistinguishable
from the other three quarterly months on VIX (−0.715 vs −0.201, P=0.198), |S&P| (0.774% vs 0.688%, P=0.693)
and following-five-session realized vol (0.793 vs 0.988, P=0.372).

The hole is its own, stated in capitals in a sibling proposal
(`proposals/opex-2027-12-17.from-consumer-confidence-2027-12-22.json`): *"December triple witching is the
one expiration that also carries **annual index reconstitution flow in some index families**; this lane did
not research that and makes no claim about it."*

**So: which family, on what date, and does it show up in the tape? And does the December leg of the
rebalance behave like the September leg the sibling ledger already measured as an index-level null?**

**One-line verdict:** the family is Nasdaq's, the annual NDX reconstitution is effective at the open of
**2027-12-20 — this event's own session** — and it is a null on every channel measurable from index
vehicles; the December S&P leg is the same null; and the two December-specific effects this session did
find both died against their own placebos, which is the finding worth carrying.

### Method

Macro / market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md). The entry carries
`symbols: []`, so no symbol-keyed instrument applies and `scripts/research/` owns no index-flow instrument.
Nothing was taken from the proposal on faith.

- **The proposal was read in full first**
  (`proposals/sp-quarterly-rebalance-effective-2027-12-20.from-opex-2027-12-17.json`), per the "your own
  event was proposed by others" rule — then the canonical
  `src/domain/market-events/sp-quarterly-rebalance-effective-2027-12-20.json` was written by this session.
- **The effective-date rule was re-sourced, not inherited.** The proposal rested on one September 2026
  instance read by a sibling ledger. This session fetched **three** S&P DJI releases direct from the owner's
  newsroom (December 2025, June 2026, September 2026; HTTP 200 each) and re-fetched the **SEC 497** that
  names December explicitly. The newsroom's own year index (`press.spglobal.com/index.php?s=2429&l=100`,
  and `&year=2025`) supplied the December URL; the default index only reaches back to 2026-03-22.
- **Nasdaq's index methodology PDF** (`indexes.nasdaqomx.com/docs/methodology_NDX.pdf`, HTTP 200, 422,314
  bytes) downloaded, its Flate streams inflated and text-extracted in-session — the source for every NDX
  schedule claim here.
- **Yahoo daily bars via `query1`** — SPY, QQQ, IJR, IJH, RSP, `^VIX`, `^GSPC`, `^NDX`, 1990→2026-09-08,
  fetched this session (HTTP 200 each; the first attempt without a contactable User-Agent returned 429,
  which is worth knowing for the next lane). Raw volume for turnover work, adjusted closes for returns.
- **Legs, not months.** A "leg" is a third Friday and the first trading session after it, computed by
  weekday arithmetic for every month 2005–2026 and then mapped onto actual sessions — 21 December legs,
  65 Mar/Jun/Sep legs, 174 non-quarterly months. Relative volume is a session's volume over its own
  trailing-60 median.
- **Two fetches failed and are recorded, not substituted.** S&P DJI's own methodology library returned
  **403** twice (`methodology-sp-us-indices.pdf`, `methodology-sp-float-adjustment.pdf`) — the same block
  the proposal recorded, re-confirmed rather than assumed — so no rebalancing-schedule clause was read from
  the methodology itself and the prefix stays `EST:` on the newsroom instances. A `stooq.com` CSV fallback
  answered with a JavaScript browser challenge. Both sit in `probe-ref.blocked`.
- **This repo** — the September 2026 sibling, the March 2027 reference-close entry and the `opex-2027-12-17`
  ledger read in full; the corridor computed from the calendar files rather than by eye; playbooks
  re-grepped.

### Conviction legs, tested

1. **The effective date is the Monday after the third Friday, and the rule now rests on three re-fetched
   instances across three quarters including a December one — SUPPORTED, and materially stronger than the
   proposal.** The proposal applied a rule read from one September instance forward into December, and
   flagged that as its first estimate count. This session removed that count:

   | Release fetched 2026-09-08 | Verbatim effective-date wording | That quarter's third Friday |
   |---|---|---|
   | 2025-12-05 (79,722 B) | *"effective prior to the open of trading on **Monday, December 22**, to coincide with the quarterly rebalance"* | 2025-12-19 |
   | 2026-06-05 (80,393 B) | *"…on **Monday, June 22, 2026**, to coincide with the quarterly rebalance"* | 2026-06-19 |
   | 2026-09-04 (79,423 B) | *"…on **Monday, September 21, 2026**, to coincide with the quarterly rebalance"* | 2026-09-18 |

   The SEC-filed 497 states the close side of the same geometry for the sister Select Sector complex and
   names the month outright: *"Changes will become effective after the market close on the third Friday of
   March, June, September and **December**."* December 2027's Fridays are the 3rd, 10th, **17th**, 24th and
   31st, so the third Friday is 2027-12-17 and the effective open is **Monday 2027-12-20**. What remains
   `estimate` is the **prefix** and the **not-yet-published 2027 release**, not the geometry.

2. **HEADLINE — the "annual index reconstitution flow" the opex lane flagged is Nasdaq's, it is effective on
   this event's own session, and it is an index-level null — SUPPORTED, and it discharges the flag.** From
   Nasdaq's own methodology, verbatim: *"Reconstitution Frequency: **Annually** … Reconstitution Reference
   Dates: **Last trading day of November** … Reconstitution Announcement Dates: **After the close on the
   sixth trading day prior to the Reconstitution Effective Date** … Reconstitution Effective Dates: **At
   market open on the first trading day following the third Friday in December**."* For 2027 that is
   **2027-12-20** — the same open. Three channels, 21 December legs:

   | Channel (QQQ, December legs) | Reading | Comparison | Test |
   |---|---|---|---|
   | Relative volume on the effective open | **0.864× mean / 0.898× median**, 6 / 21 above 1.0× | q3 1.070× / 0.962×; other months 1.038× / 0.948× | the **lowest** bucket measured |
   | Relative volume on the third Friday | 1.264× / **1.233×** | its own Mar/Jun/Sep 1.303× / **1.227×** | MW **p=88.9%** |
   | Excess return over SPY, effective open | mean −0.061%, median +0.093% | 7 / 21 negative | sign **p=18.9%**, MW vs all other months **p=32.6%** |

   A once-a-year, single-family membership overhaul that moved index-level flow would show *somewhere* in
   the vehicle that tracks it. It shows nowhere. The mechanism that predicts this is the September sibling's:
   index flow matters relative to a name's float, and NDX's 100 names are the largest in the market.

3. **The December S&P leg is the same index-level null the September sibling measured, now isolated to
   December — SUPPORTED.** SPY total return on the effective open, 2005–2026:

   | | n | mean | median | negative | sign p |
   |---|---|---|---|---|---|
   | **December legs** | 21 | −0.083% | +0.218% | 9 / 21 | **66.4%** |
   | Mar/Jun/Sep legs | 65 | +0.146% | −0.023% | 33 / 65 | 100.0% |
   | Non-quarterly months | 174 | +0.046% | +0.079% | 72 / 174 | 2.8% |

   Mann-Whitney: December vs Mar/Jun/Sep **p=79.8%**, December vs non-quarterly **p=81.2%**. Volume is the
   same story and better controlled: the December effective open runs **0.919× mean / 0.853× median** SPY
   relative volume, which is indistinguishable from **all other December sessions** (1.019× / 0.915×, n=421,
   MW **p=48.1%**) and from **the same Dec 18–24 calendar window** (1.072× / 0.928×, n=82, MW **p=74.3%**).
   The session is quiet because it is holiday week, not because a rebalance did or did not happen in it.

4. **A December overnight-gap effect looked real and is REFUTED by its own control.** SPY's gap from the
   third Friday's close to the effective open's opening print runs **16 of 21 positive** in December (mean
   +0.114%, median +0.274%, sign **p=2.7%**) while every other bucket sits at chance (Mar/Jun/Sep 34/65
   positive, p=80.4%; non-quarterly 92/174, p=49.5%). Tempting — and wrong:

   | Control | n | mean | median | positive | sign p | MW vs the December legs |
   |---|---|---|---|---|---|---|
   | **All other December sessions** | 421 | +0.089% | +0.084% | 251 / 421 | **≈0.0%** | **p=13.7%** |
   | Other December **Mondays** | 115 | +0.118% | +0.034% | 64 / 115 | 26.3% | **p=30.7%** |
   | All other Mondays 2005–2026 | 788 | +0.015% | +0.032% | 427 / 788 | 2.1% | **p=11.0%** |

   December gaps up. The rebalance leg is not distinguishable from the month it sits in on any of the three
   controls. **And the mechanism never agreed with the sign anyway:** if index flow moves the Friday close,
   a Monday gap should *reverse* it, not extend it.

5. **A cross-vehicle volume deficit looked decisive and is REFUTED by placebo Fridays — the sharper of the
   two kills.** QQQ's third-Friday relative volume **minus** SPY's (a difference, chosen precisely because
   December's trailing-60 window contains Thanksgiving week and inflates both ratios equally) runs
   **−0.375 mean / −0.270 median, 18 of 21 negative, sign p=0.1%** in December against −0.118 / −0.081
   (40/63, p=4.3%) in the other quarters — MW **p=0.35%** — and it is **10 of 10 since 2016** (mean −0.502,
   p=0.2%). Then the placebos:

   | Friday of December (2005–2026) | mean | median | negative | sign p |
   |---|---|---|---|---|
   | **Third** (S&P implementation + NDX effective next open) | −0.375 | −0.270 | 18 / 21 | **0.1%** |
   | **Second** (nothing) | −0.076 | −0.045 | 16 / 21 | **2.7%** |
   | **First** (nothing) | −0.115 | −0.136 | 16 / 21 | **2.7%** |

   The Nasdaq complex runs quiet relative to the S&P complex on **ordinary** December Fridays too. The third
   Friday's deficit is 2–6× larger in magnitude, which is suggestive, but the sign test fires identically on
   sessions with no rebalance and no reconstitution, so the statistic does not discriminate. It is reported
   as refuted rather than promoted.

6. **The same failure mode the opex lane caught, caught again on a different statistic — SUPPORTED, and it
   is why both legs above are killed rather than hedged.** [`opex-2027-12-17`](opex-2027-12-17.md) found a
   post-expiration drift at raw P=0.064 that strengthened to P=0.0047 under era-ranking, and then refused it
   because *against other sessions in the same Dec 15–24 window* it was P=0.487 — *"the drift is the calendar
   window, and the expiration contributes nothing."* Legs 4 and 5 are the identical shape on gap returns and
   on cross-vehicle turnover: a December statistic that survives everything except a December control. Two
   ledgers, three statistics, one lesson — **in December, the month is the confound, and the only honest
   control is another session in the same window.**

7. **The implementation Friday is a real volume event, but its December premium over the other quarterly
   legs is not established — SUPPORTED with a correction to the natural reading.** SPY volume against its own
   trailing-60 median on the third Friday, 2005–2026:

   | Third Fridays | n | mean | median | above 1.0× | MW vs December |
   |---|---|---|---|---|---|
   | **December** | 21 | **1.639×** | **1.789×** | 16 / 21 | — |
   | Mar/Jun/Sep | 63 | 1.420× | 1.377× | 53 / 63 | **p=13.6%** |
   | Other months (monthly opex only) | 170 | 1.253× | 1.116× | 109 / 170 | **p=1.89%** |

   December is the largest of the four quarterly legs and that is the number a reader will want to quote —
   but at n=21 it is not separable from its own quarterly siblings, only from ordinary opex months. There is
   also a **regime break** worth recording: SPY's December third-Friday ratio runs 0.66–1.06× for 2005–2011
   and 1.31–2.99× for 2012–2025, so the pooled figure blends two eras and the modern one is larger. The
   honest carry-forward for the corridor is **quarterly-sized hazard, December-flavoured, unproven**.

8. **No house playbook fits — SUPPORTED, re-verified not inherited.** `trade-playbooks.md` and
   `multi-symbol-sweep.md` re-grepped this session for
   `rebalanc|index effect|index inclusion|reconstitut|deletion|witching|closing auction`: **zero hits** in
   both. Nothing this house owns is keyed to index flow, and the constituent-level position the September
   sibling's finding implies is half blocked (shorting) and has no instrument.

9. **The corridor is thin by this calendar's standards and ends in a closure — SUPPORTED.** **6** tracked
   ids sit within five days of 2027-12-20, computed from the calendar files: `opex-2027-12-17` (**high**,
   `confirmed`) at T−3; `consumer-confidence-2027-12-22` (**medium**) and `vix-expiration-2027-12-22` at
   T+2; `bond-market-early-close-2027-12-23` and `sifma-bond-early-close-2027-12-23` at T+3; and
   `christmas-market-closure-2027-12-24` at T+4. Against the September 2026 sibling's **32**, this is a
   quiet corridor — which is exactly what makes the 2027-12-20 print *readable* as evidence, and is the one
   respect in which this instance is better than its predecessor.

### What the conditions support

Nothing directional, on any horizon, and this ledger's contribution is deliberately mostly negative. **A
discharged flag** — the "annual index reconstitution flow" the opex lane could not name is Nasdaq's, its
schedule is now sourced verbatim, its effective date is this event's own session, and it is a measured null
on all three channels an index vehicle can show. **A stronger date** — the proposal's one-instance forward
application is replaced by three re-fetched instances in three quarters including December, plus an SEC
primary that names the month. **Two dead statistics, recorded as dead** — the December gap effect and the
QQQ−SPY volume deficit, both killed by controls a later pulse would otherwise have to rediscover. **One
correction to a number a reader would want** — December's implementation Friday is the biggest quarterly
leg but not provably bigger than its quarterly siblings. **And two dated adjacents proposed**, both landing
**2027-12-10** and neither tracked for this quarter: `sp-rebalance-reference-close-2027-12-10` (the SEC-filed
Select Sector reference close, the December sibling of the calendar's own
[`sp-rebalance-reference-close-2027-03-12`](sp-rebalance-reference-close-2027-03-12.md)) and
`ndx-annual-reconstitution-announcement-2027-12-10` (methodology-dated, and the September sibling measured
the **announcement** rather than the effective date as the session where anything happens).

**Two milestones were deliberately NOT proposed**, recorded so a later lane does not re-litigate them.
`ndx-annual-reconstitution-effective-2027-12-20` is declined because leg 2 measured it as an index-level
null on the very session this entry already occupies — filing it would put a second null on one date. And
`sp-select-sector-secondary-reweight-2027-12-31` is declined **not** on its merits: it is derivable from the
same 497 this session re-fetched, and the calendar holds the 2026-09-30, 2026-12-31, 2027-03-31 and
2027-06-30 instances — but **2027-09-30 is missing too**, and filing only December would leave the series
arbitrarily holed. A later lane should file the pair or neither.

### Honest limits

**Everything here is index-vehicle evidence.** SPY and QQQ can only show what survives aggregation, and the
September 2026 sibling's whole finding was that a rebalance moves **constituents** while the index shows
nothing — so leg 2's null is a null *about QQQ*, not a claim that the NDX reconstitution does not move NDX
members. Testing that needs the constituent-level instrument this house still does not own, and it needs the
2027-12-10 announcement roster, which will not exist for over a year. **n=21 governs most of this document.**
The December leg has 21 draws; every MW test involving it is underpowered, which is why leg 7 reports
"largest but not separable" rather than a premium, and why legs 4 and 5 are killed on the *pattern* of their
controls rather than on a single p-value. **The 2012 regime break in leg 7 is unexplained** — the pooled
figure blends a pre-2012 era where SPY's December witching Friday was ordinary with a post-2012 era where it
runs 1.3–3.0×; a lane with more data should split it rather than pool it. **Relative volume in December is
structurally inflated** because the trailing-60 window contains Thanksgiving week; every cross-vehicle
statistic here is a difference for that reason, but the single-vehicle levels (0.853×, 1.789×) carry the
bias and should be read as ratios against each other, not as absolutes. **No historical constituent panel
was built** — the same gap the September sibling recorded, for the same reason: no reachable multi-year
source. **The date is `estimate`** and every trading-adjacent statement above carries that label; the 2027
S&P DJI release does not exist yet, shorting is blocked house-wide, `symbols` is empty by design, and no
house playbook is index-flow-keyed.

## Stance & kill switches

**Stance (date `estimate`, `EST:` from three re-fetched owner instances across three quarters including a
December one, plus an SEC-filed primary naming the month — prefix-gapped and one-release-early rather than
unsourced).** Treat 2027-12-20 as **a well-dated, thoroughly-measured non-event whose value to this calendar
is the two things it rules out**. Four legs. **(a) The date is now the strongest evidence class this lane can
reach without a confirmed-tier prefix** — one sentence, three quarters, one geometry, plus an SEC filing that
names December; the proposal's first estimate count is retired and only the taxonomy gap and the missing 2027
release remain. **(b) The opex lane's flagged unknown is discharged as a null.** The annual NASDAQ-100
reconstitution is effective at this event's own open (Nasdaq methodology, fetched 2026-09-08) and shows no
index-level footprint: QQQ relative volume the lowest bucket measured (0.864×, 6/21 above 1.0×), no December
step on its third Friday (MW p=88.9%), excess return 7/21 negative (p=18.9%). **(c) The December S&P leg is
the same null the September sibling found, and better controlled** — SPY return 9/21 (p=66.4%), volume
indistinguishable from ordinary December sessions (p=48.1%) and from the Dec 18–24 window (p=74.3%).
**(d) The two effects that did appear are refuted, and by design** — a 16/21 gap effect that every other
December session reproduces, and an 18/21 cross-vehicle volume deficit that placebo first and second Fridays
reproduce at 16/21 each. Carry forward the thing that outlives this event, and note that it is the *second*
ledger in this corridor to learn it: **in December, the month is the confound. A statistic that survives era
controls, quarter controls and vehicle controls but has never been shown another session in the same
calendar window has not been tested.**

**Kill switches:**

- **The December 2027 S&P DJI release words its effective date as anything other than Monday 2027-12-20** —
  the three-instance geometry breaks and this entry is misdated. Registered as
  `FT-sp-quarterly-rebalance-effective-2027-12-20-1`.
- **SPY's 2027-12-17 volume prints below 1.0× its trailing-60 median** — leg 7's quarterly volume step fails
  on its own draw, and the one execution statement this ledger hands the corridor is overbuilt. Registered as
  `FT-sp-quarterly-rebalance-effective-2027-12-20-2`.
- **QQQ's relative volume on 2027-12-20 exceeds SPY's by more than +0.20×** — leg 2's null on the NDX
  reconstitution fails out of sample (18 of 21 December legs stayed under that step), and the flag the opex
  lane raised turns out to have been real after all. Registered as
  `FT-sp-quarterly-rebalance-effective-2027-12-20-3`.
- **S&P DJI publishes a methodology change moving the quarterly rebalance off the third-Friday close** — all
  four sourced primaries date this event by one geometry, and a schedule change invalidates the entry rather
  than adjusting it.
- **A later lane finds a December year with no S&P rebalance, or an index family whose December calendar
  differs, and the gap effect (leg 4) is absent there** — the December seasonal would then be separable from
  the rebalance after all, and leg 4's kill was premature. No such year exists in this sample, which is why
  the leg is dead rather than open.
- **A constituent-level instrument, once built, shows NDX reconstitution additions moving on the 2027-12-10
  announcement the way S&P additions moved on 2026-09-08** — leg 2's null would be confirmed as
  *index-level only*, and the announcement, not this date, becomes the event worth tracking.
- **The 2012 regime break in leg 7 is explained by a data artefact rather than a market-structure change** —
  the December implementation-Friday numbers would need recomputing on a consistent basis before the
  execution call survives.

**Registered forward tests.** `FT-sp-quarterly-rebalance-effective-2027-12-20-1`, `-2` and `-3` — see
[`forward-tests/sp-quarterly-rebalance-effective-2027-12-20.md`](../forward-tests/sp-quarterly-rebalance-effective-2027-12-20.md).
Observations, never templates. All three score inside the close-out window, and all three adjudicate a claim
this ledger makes rather than a hypothesis it hopes for — `-1` the date, `-2` the one execution statement,
`-3` the headline null.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-08 | D-468 | Initial research banked; canonical `src/domain/market-events/<id>.json` written this session (the id existed only as `proposals/…from-opex-2027-12-17.json`, read in full first). probe-ref baseline set (no symbols by design, **VIX 15.72**, band `low:15+`, **6** adjacents, **3** blocked fetches). **DATE RE-SOURCED, NOT INHERITED:** three S&P DJI releases re-fetched direct (HTTP 200) — **2025-12-05** *"Monday, December 22"* (3rd Fri 12-19), **2026-06-05** *"Monday, June 22, 2026"* (3rd Fri 06-19), **2026-09-04** *"Monday, September 21, 2026"* (3rd Fri 09-18) — one sentence, three quarters, **one of them December**; plus the SEC 497 re-fetched, *"…the third Friday of March, June, September and **December**."* Dec 2027 Fridays are 3/10/**17**/24/31, so effective open **2027-12-20**. Retires the proposal's first estimate count; taxonomy gap + no 2027 release remain. **HEADLINE — THE OPEX LANE'S FLAGGED UNKNOWN IS DISCHARGED AS A NULL:** the family is Nasdaq's, and its own methodology PDF (fetched 2026-09-08, HTTP 200, 422,314 B) reads *"Reconstitution Effective Dates: At market open on the first trading day following the third Friday in December"* — **2027-12-20, this event's own session**. It shows nowhere: QQQ effective-open relative volume **0.864× / 0.898×, 6 of 21** above 1.0× (**lowest bucket measured**), no December step on its third Friday (1.264×/1.233× vs its own q3 1.303×/1.227×, **MW p=88.9%**), excess over SPY **7/21** negative (sign **p=18.9%**, MW **p=32.6%**). **THE S&P LEG IS THE SAME NULL, DECEMBER-ISOLATED:** SPY effective-open return **9/21** negative (**p=66.4%**; MW **79.8%** vs Mar/Jun/Sep, **81.2%** vs non-quarterly), volume **0.919×/0.853×** — indistinguishable from all other December sessions (n=421, **p=48.1%**) and from the Dec 18-24 window (n=82, **p=74.3%**). **TWO CANDIDATE FINDINGS RAISED AND KILLED BY THEIR OWN CONTROLS:** (i) a December effective-open **gap** at **16/21** positive (**p=2.7%**) dies against every other December session (251/421, p≈0.0%, **MW p=13.7%**), other December Mondays (**p=30.7%**) and all Mondays (**p=11.0%**) — and the mechanism never agreed with the sign; (ii) a **QQQ-minus-SPY** third-Friday volume deficit at **18/21** (**p=0.1%**, **10/10 since 2016**, MW vs q3 **p=0.35%**) dies against placebo **first** and **second** December Fridays, which fire at **16/21 each (p=2.7%)**. **SAME FAILURE MODE `opex-2027-12-17` CAUGHT ON ITS OWN DRIFT RESULT** (raw P=0.064 → era-ranked 0.0047 → same-window control P=0.487): in December the month is the confound. **ONE NUMBER CORRECTED FOR THE CORRIDOR:** SPY's December third Friday is the **largest** quarterly leg (**1.639×/1.789×**, 16/21 above 1.0×) but **not separable** from Mar/Jun/Sep (1.420×/1.377×, **MW p=13.6%**, n=21) — only from ordinary opex months (**p=1.89%**); a **2012 regime break** (0.66-1.06× pre-2012 vs 1.31-2.99× post) is recorded unexplained. **Adjacency — peers:** none (`symbols: []`). **Macro:** **6** tracked ids within 5d — `opex-2027-12-17` (**high**, `confirmed`) T−3, `consumer-confidence-2027-12-22` + `vix-expiration-2027-12-22` T+2, two bond early-close proposals T+3, `christmas-market-closure-2027-12-24` T+4; a thin corridor by this calendar's standards (the Sept 2026 sibling had 32), which makes the print readable. **Vol:** baseline, no prior; **VIX 15.72** (2026-09-08 daily bar). **Geopolitical:** nothing touching index methodology. **Event tape:** playbooks + sweep re-grepped incl. `reconstitut|index effect|closing auction` → **zero hits**. **BLOCKED, NOT SUBSTITUTED:** spdji `methodology-sp-us-indices.pdf` and `methodology-sp-float-adjustment.pdf` both **403** (prefix stays `EST:` on newsroom instances), `stooq.com` CSV a JS challenge; Yahoo `query1` 429'd without a contactable UA and 200'd with one. **TWO DATED ADJACENTS FILED, both 2027-12-10:** `sp-rebalance-reference-close-2027-12-10` (SEC-filed, the December sibling of the calendar's own 2027-03-12 entry, prices the capping trade printing into the 12-17 close) and `ndx-annual-reconstitution-announcement-2027-12-10` (methodology-dated six trading sessions back from 12-20; the Sept 2026 sibling measured the **announcement** as where anything happens). **TWO DECLINED ON THE RECORD:** `ndx-annual-reconstitution-effective-2027-12-20` (a measured null on a session already tracked) and `sp-select-sector-secondary-reweight-2027-12-31` (derivable, but 2027-09-30 is missing too — file the pair or neither). Registered **FT-…-1** (the Dec 2027 release words 2027-12-20), **FT-…-2** (SPY 12-17 volume ≥ 1.0× its 60d median), **FT-…-3** (QQQ 12-20 relvol does not exceed SPY's by >+0.20×). | — (stance set: **stand aside** on all four horizons, with the only non-refusal being **treat 2027-12-17, not 2027-12-20, as the execution hazard, sized quarterly rather than December**; the refusal rests on a well-sourced date attached to a measured null on every channel an index vehicle can show, two December statistics killed by their own placebos, and no house playbook or instrument keyed to index flow — with one open question, whether the NDX reconstitution moves NDX *constituents* on the 2027-12-10 announcement, which needs an instrument this house does not own) | 2026-10-08 (band `low:15+`, every 30d). Close-out by 2027-12-26 |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint notes any
row past ~1,200 chars): it is a note to the next session, not an essay, and a stance *change* earns its
sentence in the Stance section with the row as its receipt. The adjacency sweep (peer prints · macro
surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in every row; a dated
adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-sp-quarterly-rebalance-effective-2027-12-20.json`
(`status: "estimate"`) in the same PR — your own file, never another event's canonical one (#1717).
Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from
memory — after which this doc goes quiet.
