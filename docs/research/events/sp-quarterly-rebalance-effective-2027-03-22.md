# S&P DJI March quarterly rebalance takes effect — March is the clean quarter, the execution step clears a same-month control, and the tier tilt dies for want of a volume footprint — sp-quarterly-rebalance-effective-2027-03-22

**Kind:** sector · **Date:** 2027-03-22 (estimate — **EST: the owner's own effective-date wording, re-sourced this session from two MARCH instances, the quarter this family had never read.** Both fetched direct from S&P DJI's newsroom 2026-09-09, HTTP 200: the **2025-03-07** release (92,611 bytes) — *"…indices **effective prior to the open of trading on Monday, March 24**, to coincide with the quarterly rebalance"*, third Friday **2025-03-21**; the **2026-03-06** release (94,408 bytes) — *"…will **take effect before the market opens on Monday, March 23**, as part of the quarterly rebalance"*, **58** index-action rows stamped *"Mar 23, 2026"*, third Friday **2026-03-20**. A **SEC-filed** primary names March outright and was re-fetched too: Select Sector SPDR Trust Form 497 (accession 0001193125-26-031948, 2,388,335 bytes) — *"Changes will become effective after the market close on the third Friday of March, June, September and December."* March 2027's Fridays are the 5th, 12th, **19th** and 26th, so the third Friday is **2027-03-19** — already tracked as [`opex-2027-03-19`](opex-2027-03-19.md) — and the rebalance is effective prior to the open on **Monday 2027-03-22**, implemented at the 2027-03-19 close. Stays `estimate` on two counts: this calendar's confirmed-tier prefixes have no member for an index owner's own schedule, and the 2027 release does not exist yet — it is due around **2027-03-05**) · **Impact:** low
**Last assessed:** 2026-09-09
<!-- probe-ref: {"symbols":{},"vix":15.72,"daysBand":"low:15+","adjacentIds":["boj-decision-2027-03-18","boj-minutes-2027-03-24","fomc-2027-03-17","good-friday-market-closure-2027-03-26","japan-cpi-2027-03-19","japan-cpi-tokyo-flash-2027-03-26","jpx-market-closure-2027-03-22","opex-2027-03-19","russell-quarterly-ipo-review-effective-2027-03-22","sifma-bond-early-close-2027-03-25","vix-expiration-2027-03-17"],"screenStreak":0,"blocked":[{"url":"https://www.spglobal.com/spdji/en/documents/methodologies/methodology-sp-us-indices.pdf","status":"403","at":"2026-09-09"}]} -->

## At a glance

**TL;DR.** **Stand aside on every horizon — but this is the sibling in the family worth reading, because March is the one quarterly leg where the controls actually work, and running them both confirmed one statistic and killed another.** The date is now the best-sourced in the family for this quarter: two S&P DJI releases from **March itself** (2025 and 2026), re-fetched today, plus a re-fetched SEC filing that names March explicitly — so `estimate` here is a missing source prefix and a not-yet-published 2027 release, not missing evidence. **What survives is one execution number, and it is the first in this family to clear a same-month control.** SPY volume on the 22 March implementation Fridays 2005–2026 runs **1.496× mean / 1.291× median, above 1.0× in 19 of 22**, against **1.297× / 1.097×** for all other March sessions (n=437) at Mann-Whitney **p=2.64%**. The September sibling measured this on the pooled quarterly sample and the December sibling could not separate its month at all; March can, and it holds. It does **not** separate March from the other quarterly legs (**p=44.0%**), so the hazard is **quarterly-sized, not March-sized**. **Two candidate findings then died on controls built for them, and the kills are the transferable part.** A March effective-open volume step looked real at **1.185× / 1.086×, 14 of 22** above 1.0× against the Jun/Sep/Dec legs' **0.975× / 0.899×, 21 of 64** (**MW p=8.68%**) — until the within-March control returned **p=25.5%**, with other March sessions running a *higher* median (1.097×) than the legs. The cause is the denominator: **March is the highest-mean relative-volume month of the twelve** (1.301× vs 1.098× for all sessions, **MW p<0.001%**) because a trailing-60 window ending mid-March straddles the Christmas–New Year lull. That is the exact **mirror** of the December sibling's Thanksgiving caution, and it generalises: *the trailing-60 denominator is seasonally biased in both directions; only a same-month or same-window control is safe.* The second death is sharper. A small-cap tier tilt on the effective open looked real — **IJR−SPY median +0.408%, MW p=3.95%** against the other quarterly legs, monotone in tier (IJR > IJH > SPY, equal-weight RSP flat at p=49.5%) — and it dies twice: its sign test never fired (**14 of 22**, p=28.6%), and the per-quarter split shows the MW result is March's **+0.408%** being compared against **September's −0.195%**, because pooling the two quarters that implement two sessions after an FOMC (March, September) against the two that do not (June, December) gives **p=49.2%** on IJR−SPY and **p=87.3%** on SPY returns. **And decisively, there is no flow footprint**: IJR's relative volume on the effective open is indistinguishable from SPY's (**MW p=92.9%**). Index flow moves turnover before it moves price, so a return tilt with no turnover signature is not rebalance flow. **The one genuinely 2027-specific fact is structural, not statistical.** Easter 2027 is early, so Good Friday is **2027-03-26** — the *fourth* Friday, one week after implementation — and the market is closed (NYSE's own calendar, fetched today). The effective week is **four sessions**, not five. Only **2 of 22** March legs share that shape (2005, 2016; next in 2032) and they disagree by 2× on week volume — named, and **refused on power**.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** | High | The event is **194 days out**, `symbols` is empty by design, and no house playbook is rebalance-, opex- or index-flow-keyed — `trade-playbooks.md` and `multi-symbol-sweep.md` re-grepped this session for `rebalanc\|index effect\|reconstitut\|deletion\|witching\|closing auction` → **zero hits** in both | A house playbook keyed to index flow or a closing auction landing in `trade-playbooks.md` before **2026-10-09**, this event's next scheduled pulse — there would then be a mechanism to point at this date |
| This week | **Stand aside** | High | Nothing about this event publishes for nearly six months: the March 2027 S&P DJI release is due around **2027-03-05** (first Friday of the rebalance month — the convention both re-fetched March instances follow), proposed this PR as `sp-rebalance-proforma-2027-03-05` | S&P DJI publishing a **methodology change** to its rebalance schedule before **2026-10-09** — the Monday-after-third-Friday geometry both March primaries and the SEC filing agree on would stop dating this event |
| This month | **Stand aside — and do not re-run either dead statistic** | High | The March effective-open volume step (14/22, p=8.68%) and the IJR−SPY tier tilt (median +0.408%, MW p=3.95%) are both recorded here as **refuted by their own controls**, so a later pulse that re-derives either has re-found a denominator artefact or a four-bucket coincidence, not this event | An index-flow instrument, once built, showing **constituent-level** small-cap repricing on the 2027-03-22 open the way the September 2026 sibling measured it on an *announcement* — the tier-ETF null would then be an aggregation limit rather than an absence (deliberately **not** registered as a forward test: no single 2027-03-22 observation can adjudicate it — see leg 4) |
| This quarter | **Treat 2027-03-19, not 2027-03-22, as the only session in this chain carrying an execution hazard — quarterly-sized, and now same-month-controlled** | Medium | March third Fridays run SPY at **1.496× mean / 1.291× median, 19 of 22** above 1.0×, and it survives the control neither sibling ran: **p=2.64%** against 437 other March sessions. It does not separate from Jun/Sep/Dec (**p=44.0%**), so size it as a quarterly witching close, not a March one | SPY's **2027-03-19** volume printing below **1.0×** its trailing-60 median — 3 of 22 March legs did, and the execution statement this ledger hands the March corridor would be overbuilt. Registered as `FT-…-2` |

**Signals & conditions** — the buy/sell/hold triggers:

- Date is `estimate` — **owner-published rule, two re-fetched March instances, one SEC filing naming the month, no 2027 release yet**. It widens caution and licenses **no** date-keyed action.
- **The effective open is an index-level null on the March leg too** — SPY return **9 of 22** negative (sign **p=52.3%**), and against other March sessions **p=11.2%**. Whatever 2027-03-22 prints is the corridor.
- **The hazard is the 2027-03-19 close**, sized as a quarterly witching Friday. That is an E1-class execution rule, not a trade.
- **Two statistics are dead and must not be revived without a new control** — the March effective-open volume step (a denominator artefact) and the IJR−SPY tier tilt (no volume footprint, and a four-bucket sign flip).
- **The denominator caution now has a direction and a mechanism** — March relative-volume ratios are *inflated* (Christmas–New Year lull in the lookback), December's are *inflated* (Thanksgiving). Read every single-vehicle level here as a ratio against another, never as an absolute.
- **The effective week is four sessions, ending in a closure** — Mon 2027-03-22 through Thu 2027-03-25, market shut Fri 2027-03-26. That is calendar arithmetic and carries **no volume claim**: Holy Week is not reliably quiet (**11 of 20** week-mean relative volumes above 1.0×). No equity early close applies; the 2:00 p.m. ET Thursday close is fixed income only.
- **Do not read a Good-Friday collision into this** — in **2008** Good Friday *was* the March third Friday (2008-03-21), moving implementation to the Thursday 2008-03-20 close. 2027 does not collide.
- **The corridor's heaviest item is `fomc-2027-03-17`, and that is normal for March** — March and September legs implement **two** days after an FOMC decision; June and December, **nine**. The geometry explains nothing about the effective open (**p=87.3%**), which is itself the finding.
- **The corridor is mid-sized — 11 tracked ids within five days**, including [`fomc-2027-03-17`](fomc-2027-03-17.md) (**high**) at T−5 and [`opex-2027-03-19`](opex-2027-03-19.md) (**high**) at T−3, plus a **second index-flow event on this same open**, `russell-quarterly-ipo-review-effective-2027-03-22`.
- Chain: announcement + pro-forma ~**2027-03-05** (proposed this PR) → Select Sector reference close **2027-03-12** → implementation at the **2027-03-19** close → **effective open 2027-03-22** → secondary reweight test **2027-03-30**, effective after the **2027-03-31** close.

## Initial research

### The question

This id reached the calendar as a single proposal from the
[`russell-style-quarter-end-capping-effective-2027-03-31`](russell-style-quarter-end-capping-effective-2027-03-31.md)
initial research, filed 2026-09-09. That proposal argued the right thing for the right reason: the March
2027 rebalance is a **hole in a series this calendar already tracks** for three other quarters, and its own
reference close (`sp-rebalance-reference-close-2027-03-12`) is already carried — *"the calendar currently
carries the input to this event without carrying the event, which is the shape of a hole rather than of an
extrapolation."* It rested its date, however, on a rule the December sibling established from **four
December instances**, applied forward into March.

Two siblings have already researched this series and both left the same gap. The September 2026 sibling
([`sp-quarterly-rebalance-effective-2026-09-21`](sp-quarterly-rebalance-effective-2026-09-21.md)) measured
the index-level null and found the constituent-level effect had **migrated down a tier** — but ran its one
durable execution statistic on the **pooled** quarterly sample. The December 2027 sibling
([`sp-quarterly-rebalance-effective-2027-12-20`](sp-quarterly-rebalance-effective-2027-12-20.md)) killed two
findings and closed on the lesson that *"in December, the month is the confound. A statistic that survives
era controls, quarter controls and vehicle controls but has never been shown another session in the same
calendar window has not been tested."* It could not run that same-window control on its own numbers, because
December's confound is December.

**So: does the March leg — the quarter with no annual-reconstitution overlay and no holiday seasonal —
survive the control the December sibling could only name? And what, if anything, does the 2027 instance
carry that no other March does?**

**One-line verdict:** March is the clean quarter, the same-month control **confirms** the implementation-Friday
execution step (p=2.64%) and **kills** both of this session's own candidate findings, and the only
2027-specific feature is a four-session effective week that is real on the calendar and untestable on n=2.

### Method

Macro / market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md). The entry carries
`symbols: []`, so no symbol-keyed instrument applies and `scripts/research/` owns no index-flow instrument.
Nothing was inherited on faith.

- **The proposal was read in full first**
  (`proposals/sp-quarterly-rebalance-effective-2027-03-22.from-russell-style-quarter-end-capping-effective-2027-03-31.json`),
  per the "your own event was proposed by others" rule — then the canonical
  `src/domain/market-events/sp-quarterly-rebalance-effective-2027-03-22.json` was written by this session.
- **The effective-date rule was re-sourced from March, not inherited from December.** The S&P DJI newsroom
  index paginates by offset (`press.spglobal.com/index.php?s=2429&l=100&o=<n>`; the default page reaches
  back only to 2026-03-22), and `o=100`/`o=200` surfaced the two March quarterly releases — **2026-03-06**
  and **2025-03-07** — both then fetched direct and text-extracted in-session.
- **The SEC 497 was re-fetched**, and the retrieval detail is worth the next lane's time: `sec.gov` returned
  **403** to a browser-style User-Agent and **200** to a declared-identity one (SEC's own stated
  requirement). Same shape as the `bls.gov` note in [`ppi-2026-11-13.md`](ppi-2026-11-13.md).
- **NYSE's own holiday calendar** (`nyse.com/markets/hours-calendars`, HTTP 200, 109,180 bytes) fetched
  direct for the Good Friday closure and checked for any March 2027 early close (there is none).
- **Yahoo daily bars via `query1`** — SPY, QQQ, IJR, IJH, RSP, `^VIX`, `^GSPC`, 1990→2026-09-08, fetched
  this session with a contactable User-Agent (HTTP 200 each). Raw volume for turnover, adjusted closes for
  returns.
- **A DATE-ALIGNMENT BUG WAS CAUGHT AND FIXED MID-SESSION, and it is recorded because it would have
  produced a publishable-looking wrong answer.** The first pass derived each bar's session date by adding
  12 hours to Yahoo's timestamp. US equity daily stamps are 13:30 UTC, so that shifted every SPY label
  forward one session while `^VIX`'s 07:00 UTC stamps stayed put — the two series silently disagreed. The
  tell was that 2005-03-18's "next session" printed as **2005-03-19, a Saturday**. Under the bug the
  overnight gap read **4 of 22 positive, sign p=0.43%** — a headline-grade false finding that was really the
  Thursday→Friday gap. The corrected figure is **15 of 22, p=13.4%**: nothing. Every number in this
  document is from the corrected pass, and the corrected VIX reading (**15.72** on 2026-09-08)
  independently reproduces the December sibling's.
- **Legs, not months.** A "leg" is a third Friday's session and the session after it, computed by weekday
  arithmetic for every month 2005–2026 and mapped onto SPY's actual trading calendar (which is how 2008's
  Good-Friday collision surfaced) — **22** March legs, 64 Jun/Sep/Dec legs, 174 non-quarterly months.
  Relative volume is a session's volume over its own trailing-60 median.
- **One fetch failed and is recorded, not substituted.** S&P DJI's methodology library returned **403**
  again (`methodology-sp-us-indices.pdf`) — the same block both siblings recorded, re-confirmed rather than
  assumed — so no rebalancing-schedule clause was read from the methodology and the prefix stays `EST:` on
  the newsroom instances. It sits in `probe-ref.blocked`.
- **This repo** — both sibling ledgers, the March reference-close entry and the Good Friday entry read in
  full; the corridor and the FOMC geometry computed from the calendar files rather than by eye; playbooks
  re-grepped.

### Conviction legs, tested

1. **The effective date is the Monday after the third Friday, and the rule now rests on two instances from
   March itself — SUPPORTED, and it closes the gap both siblings left.** Neither sibling had ever read a
   March release; the December one applied a December-established rule forward.

   | Release fetched 2026-09-09 | Verbatim effective-date wording | That quarter's third Friday |
   |---|---|---|
   | 2025-03-07 (92,611 B) | *"…indices **effective prior to the open of trading on Monday, March 24**, to coincide with the quarterly rebalance"* | 2025-03-21 |
   | 2026-03-06 (94,408 B) | *"…will **take effect before the market opens on Monday, March 23**, as part of the quarterly rebalance"* (**58** rows stamped *"Mar 23, 2026"*) | 2026-03-20 |

   The SEC-filed 497 states the close side of the same geometry and names the month outright: *"Changes will
   become effective after the market close on the third Friday of March, June, September and **December**."*
   March 2027's Fridays are the 5th, 12th, **19th** and 26th, so the third Friday is 2027-03-19 and the
   effective open is **Monday 2027-03-22**. **A TRAP FOR THE NEXT LANE:** the owner *paraphrases* this
   sentence. The 2026 release drops *"effective prior to the open of trading"* for *"will take effect
   before the market opens"* and *"to coincide with"* for *"as part of"* — a grep for the phrasing the
   December sibling recorded silently misses it. What remains `estimate` is the **prefix** and the
   **not-yet-published 2027 release**, not the geometry.

2. **HEADLINE — the implementation Friday's volume step survives a same-month control, the first time this
   family's execution caution has cleared one — SUPPORTED.** SPY volume against its own trailing-60 median:

   | Third Fridays | n | mean | median | above 1.0× | MW vs March |
   |---|---|---|---|---|---|
   | **March** | 22 | **1.496×** | **1.291×** | **19 / 22** | — |
   | Jun/Sep/Dec | 64 | 1.473× | 1.434× | 52 / 64 | p=44.0% |
   | Other months (monthly opex only) | 174 | 1.255× | 1.116× | 110 / 174 | p=8.27% |
   | **All other March sessions** | 437 | 1.297× | 1.097× | 264 / 437 | **p=2.64%** |

   The last row is the one that matters and the one neither sibling could run. The September sibling
   measured **+0.30× median at p=0.072%** on the pooled quarterly sample against ordinary opex Fridays;
   March alone is underpowered against that comparison (**p=8.27%**, n=22) but clears the *harder* test —
   its own month. **March carries no premium over the other quarterly legs (p=44.0%)**, so the honest
   carry-forward for the 2027-03 corridor is a **quarterly-sized** hazard that is now same-month-verified,
   not a March-specific one.

3. **A March effective-open volume step looked real and is REFUTED by the denominator — and the refutation
   generalises the December sibling's caution.** SPY relative volume on the effective open:

   | | n | mean | median | above 1.0× |
   |---|---|---|---|---|
   | **March legs** | 22 | **1.185×** | **1.086×** | 14 / 22 |
   | Jun/Sep/Dec legs | 64 | 0.975× | 0.899× | 21 / 64 |
   | Non-quarterly months | 174 | 0.998× | 0.906× | 65 / 174 |

   MW March vs Jun/Sep/Dec: **p=8.68%** — suggestive. Then the within-March control: **MW p=25.5%**, and
   other March sessions run a median of **1.097×**, *higher* than the legs' 1.086×. The same-window control
   (Mar 19–25, n=88) agrees at **p=21.5%**. The cause is mechanical:

   | SPY relative volume, 2005–2026 | n | mean | median |
   |---|---|---|---|
   | **All March sessions** | 481 | **1.301×** | **1.098×** |
   | All sessions | 5,454 | 1.098× | 0.988× |

   MW **p<0.001%**. March is the **highest-mean month of the twelve** (April 0.991×, July 0.994×, December
   1.020× for contrast) because a trailing-60 window ending mid-March straddles the Christmas–New Year lull
   and deflates the denominator. The December sibling recorded the inverse — Thanksgiving inflating December
   ratios. **Generalised: the trailing-60 relative-volume denominator is seasonally biased in both
   directions, largest wherever the lookback straddles a holiday period, and the only safe control is a
   same-month or same-window one.** 2016's effective open is the cautionary single draw: **0.532×**, because
   its lookback contained the January–February 2016 selloff.

4. **A small-cap tier tilt looked real and is REFUTED twice — the sharper kill, and the mechanism is why.**
   Excess total return over SPY on the March effective open:

   | Vehicle − SPY | n | mean | median | positive | sign p | JSD median | MW vs JSD |
   |---|---|---|---|---|---|---|---|
   | **IJR** (S&P 600) | 22 | +0.209% | **+0.408%** | 14 / 22 | 28.6% | −0.003% | **p=3.95%** |
   | **IJH** (S&P 400) | 22 | +0.118% | +0.185% | 12 / 22 | 83.2% | −0.034% | p=7.81% |
   | RSP (equal-weight 500) | 22 | −0.035% | −0.095% | 9 / 22 | 52.3% | −0.057% | p=49.5% |
   | QQQ | 22 | +0.234% | +0.282% | 15 / 22 | 13.4% | +0.058% | p=13.8% |

   Monotone in tier with equal-weight flat — exactly the shape the September sibling's mechanism predicts
   (index flow matters relative to a name's float). It still fails, on two independent grounds.
   **(a) No flow footprint.** IJR's relative volume on the effective open is indistinguishable from SPY's
   (**MW p=92.9%**; IJR itself above 1.0× on only **11 of 22** legs) and from other quarters. Index flow
   moves *turnover* before it moves price; a return tilt with no turnover signature is not rebalance flow.
   **This kill is not single-draw-adjudicable, and no forward test pretends otherwise.** The natural
   candidate — a threshold on IJR's relative volume minus SPY's on 2027-03-22 — was built and discarded:
   at the December sibling's +0.20× step, only **13 of 22** March legs come in under it (exceedances range
   to +1.40×), so a "kill" would fire ~41% of the time by chance. IJR tracks SPY far more loosely than QQQ
   does, which is what made that threshold work for the December sibling's null and not for this one.
   **(b) The MW result is a four-bucket coincidence.** Per quarter:

   | Quarter | n | SPY return median | IJR−SPY median |
   |---|---|---|---|
   | **March** | 22 | **+0.377%** | **+0.408%** |
   | June | 22 | −0.065% | +0.026% |
   | **September** | 21 | **−0.151%** | **−0.195%** |
   | December | 21 | +0.218% | +0.014% |

   No bucket's own sign test fires (52.3%, 83.2%, 66.4%, 66.4%) and the medians alternate in sign. March's
   apparent edge is March being high while September is low: pool the two quarters that implement **two
   sessions after an FOMC decision** (March, September) against the two that implement nine days after
   (June, December) and it vanishes — **p=49.2%** on IJR−SPY, **p=87.3%** on SPY returns. Four samples of
   n≈22 with one at p=3.95% is the arithmetic of multiple testing, not a finding.

5. **The FOMC geometry is a real structural asymmetry and explains nothing — SUPPORTED, and both halves are
   useful.** Computed from this repo's own FOMC entries: the **March and September** quarterly legs
   implement **two days** after an FOMC decision (2026-09-16→09-18, 2027-03-17→03-19, 2027-09-15→09-17)
   while **June and December** implement **nine days** after (2026-12-09→12-18, 2027-06-09→06-18,
   2027-12-08→12-17). So `fomc-2027-03-17` sitting at T−5 from this event is the **normal March
   configuration**, not a 2027 anomaly — worth knowing before anyone treats it as one. And as leg 4's
   pooling shows, it is not a mechanism: the two FOMC-adjacent quarters do not behave alike, they behave
   *oppositely*, which is what killed the tier tilt.

6. **The March effective open is the same index-level null both siblings measured — SUPPORTED.** SPY total
   return, 2005–2026:

   | | n | mean | median | negative | sign p |
   |---|---|---|---|---|---|
   | **March legs** | 22 | +0.583% | +0.377% | **9 / 22** | **52.3%** |
   | Jun/Sep/Dec legs | 64 | −0.080% | −0.027% | 33 / 64 | 90.1% |
   | Non-quarterly months | 174 | +0.046% | +0.079% | 72 / 174 | 2.8% |

   The **+0.583% mean is not the finding**: 2009-03-23 (+7.18%, the PPIP bank-plan rally) and 2020-03-23
   (−2.56%, the COVID-bottom session) contribute **+0.173%** of it, and dropping both leaves the median
   unchanged at +0.377% with the sign test at **p=50.3%**. Against other March sessions the return
   distribution is **p=11.2%**; against the Mar 19–25 window, **p=5.97%** — the strongest number in the
   document and, after four controls on one quantity, the one most likely to be the multiple-testing
   artefact leg 4 already demonstrated. Recorded as **not established**, with `FT-…-3` adjudicating the
   channel that would have to move first.

7. **The 2027 instance's four-session effective week is real on the calendar and untestable in the tape —
   MIXED, and deliberately halved.** Easter 2027 is 2027-03-28 (anonymous Gregorian algorithm), so Good
   Friday is **2027-03-26**, the *fourth* Friday of March. NYSE's own calendar, fetched today, parses its
   Good Friday row as *Friday, April 3 / **Friday, March 26** / Friday, April 14* for 2026 / 2027 / 2028 —
   independently reproducing [`good-friday-market-closure-2027-03-26`](good-friday-market-closure-2027-03-26.md).
   So the effective week runs **Mon 03-22 through Thu 03-25** and stops. Across 22 March legs only **2**
   share it:

   | Year | Effective open | SPY relvol that session | Week (4 sessions) relvol mean | Week return |
   |---|---|---|---|---|
   | 2005 | 2005-03-21 | 1.098× | 1.235× | −1.182% |
   | 2016 | 2016-03-21 | 0.532× | 0.613× | −0.616% |
   | **2027** | **2027-03-22** | — | — | — |

   Both weeks were negative and both were quieter than the pooled Holy Week (8 treated sessions at 0.924×
   mean vs 80 other Holy-Week sessions at 1.023×, **MW p=25.2%**) — but they disagree by a factor of two on
   volume, n=2, and the next recurrence is **2032**. **Refused on power.** **And the fallback base rate is
   refused too, which is the honest half of this leg:** Holy Week is *not* reliably quiet — across the 20
   non-rebalance Holy Weeks, **11 of 20 week-mean relative volumes came in above 1.0×** (week-mean median
   **1.018×**), so the session-level median of 0.982× is parity, not quietness. What survives is therefore
   **pure calendar arithmetic and no volume claim at all**: residual rebalance flow has **four sessions**
   before a closure rather than five. **And no equity early close applies** — the same NYSE page names none in March 2027;
   the 2:00 p.m. ET Thursday 2027-03-25 close already tracked as `sifma-bond-early-close-2027-03-25` is
   fixed income only.

8. **A Good-Friday *collision* is possible but is not this year — SUPPORTED, recorded so nobody assumes
   it.** In **2008** Good Friday fell **on** the March third Friday (2008-03-21). The market was shut, so
   implementation moved to the **Thursday 2008-03-20** close and the effective open was Monday 2008-03-24 —
   which is how the leg-mapping surfaced it. 2027 does not collide: Good Friday is the fourth Friday, a
   week after implementation.

9. **No house playbook fits — SUPPORTED, re-verified not inherited.** `trade-playbooks.md` and
   `multi-symbol-sweep.md` re-grepped this session for
   `rebalanc|index effect|index inclusion|reconstitut|deletion|witching|closing auction`: **zero hits** in
   both. Nothing this house owns is keyed to index flow, and the constituent-level position the September
   sibling's finding implies is half blocked (shorting) and has no instrument.

10. **The corridor is mid-sized and carries a second index-flow event on this same open — SUPPORTED.**
    **11** tracked ids sit within five days of 2027-03-22: [`fomc-2027-03-17`](fomc-2027-03-17.md)
    (**high**) and `vix-expiration-2027-03-17` at T−5; `boj-decision-2027-03-18` (**medium**) at T−4;
    [`opex-2027-03-19`](opex-2027-03-19.md) (**high**) and `japan-cpi-2027-03-19` at T−3;
    `jpx-market-closure-2027-03-22` and `russell-quarterly-ipo-review-effective-2027-03-22` at **T+0**;
    `boj-minutes-2027-03-24` at T+2; `sifma-bond-early-close-2027-03-25` at T+3; and
    `good-friday-market-closure-2027-03-26` plus `japan-cpi-tokyo-flash-2027-03-26` at T+4. Against the
    September 2026 sibling's **32** and the December 2027 sibling's **6**, this is mid-range. The item worth
    naming is the T+0 one: **two index families' flows land on the same open**, which is a reason the
    2027-03-22 print will be *harder* to read as evidence than the December sibling's quiet corridor, not
    easier.

### What the conditions support

Nothing directional, on any horizon. This ledger's contribution is one confirmation, two kills and one
piece of calendar arithmetic. **A confirmation the family needed** — the implementation-Friday execution
step, which the September sibling measured on pooled quarters and the December sibling could not isolate,
clears a **same-month** control on the March leg at p=2.64%. **A generalised methodological caution** — the
trailing-60 denominator is seasonally biased in *both* directions, and March is the inflated case for the
opposite reason to December's; the December sibling's "the month is the confound" now has a mechanism and a
sign. **Two dead statistics, recorded as dead** — a March effective-open volume step that is a denominator
artefact, and a small-cap tier tilt that has no turnover footprint and dissolves under a four-bucket split.
**A structural fact about 2027 and two honest refusals about it** — the four-session effective week is real
and only the third instance in 23 years; the two precedents disagree by 2× so the statistic is refused, and
the Holy-Week fallback is refused too (11 of 20 week-means above 1.0×), which leaves the execution note as
calendar arithmetic carrying no volume claim. **And one dated adjacent proposed**:
`sp-rebalance-proforma-2027-03-05`, the March 2027 announcement and pro-forma release, on the
first-Friday-of-the-rebalance-month convention that holds in **7 of 7** instances this family has read
(2024-12-06, 2025-03-07, 2025-09-05, 2025-12-05, 2026-03-06, 2026-06-05, 2026-09-04 — two of them fetched
by this session, five inherited as the December and September siblings' own citations) and that the calendar
already tracks as `sp-rebalance-proforma-2026-09-04` and `sp-rebalance-proforma-2026-12-04`.

**One milestone was deliberately NOT proposed**, recorded so a later lane does not re-litigate it. A capped
pro-forma entry for **2027-03-12** is derivable (the September 2026 quarter carries
`sp-rebalance-proforma-capped-2026-09-11` on the second Friday), but that date already carries
[`sp-rebalance-reference-close-2027-03-12`](sp-rebalance-reference-close-2027-03-12.md), and the December
sibling's precedent is not to file a second market-structure entry onto a session this calendar already
tracks.

### Honest limits

**Everything here is index-vehicle evidence.** SPY, IJR, IJH, RSP and QQQ can only show what survives
aggregation, and the September 2026 sibling's whole finding was that a rebalance moves **constituents**
while the index shows nothing — so leg 4's kill is a kill *about tier ETFs*, not a claim that S&P 600
additions do not reprice. Testing that needs the constituent-level instrument this house still does not own
and the March 2027 roster, which will not exist until ~2027-03-05. **n=22 governs most of this document.**
Every March-only Mann-Whitney is underpowered, which is why leg 2 reports "clears its own month but not its
quarterly siblings" rather than a premium, and why legs 3 and 4 are killed on the *pattern* of their
controls rather than on a single p-value. **Leg 6 is the honest loose end**: the March effective-open return
distribution sits at p=5.97% against its own calendar window, and this session's judgement is that four
controls on one quantity with one landing near 5% is multiple testing — a lane with a longer sample should
re-run it rather than accept that reasoning. **The date-alignment bug is a caution about this document's
method, not only about its early numbers**: one wrong offset produced a p=0.43% headline that survived
until a Saturday appeared in a session list, so nothing here should be trusted that a later lane cannot
re-derive from the sources named in Method. **The four-session-week statistic is n=2** and is reported as
refused, not as weak evidence. **Relative volume in March is structurally inflated** (leg 3); every
single-vehicle level in this document carries that bias and should be read against another level, not as an
absolute. **The date is `estimate`** and every trading-adjacent statement above carries that label; the
2027 S&P DJI release does not exist yet, shorting is blocked house-wide, `symbols` is empty by design, and
no house playbook is index-flow-keyed.

## Stance & kill switches

**Stance (date `estimate`, `EST:` from two re-fetched March instances plus a re-fetched SEC-filed primary
naming the month — prefix-gapped and one-release-early rather than unsourced).** Treat 2027-03-22 as **a
well-dated non-event whose value to this calendar is that March is the quarter where the controls work**.
Four legs. **(a) The date is the best-sourced in this family for this quarter** — two March releases, both
read today, plus an SEC filing that names March; the proposal's forward-application of a December-derived
rule is retired, and only the taxonomy gap and the missing 2027 release remain. **(b) The family's one
execution statement is now same-month-verified** — March third Fridays run SPY at 1.496× mean / 1.291×
median, 19 of 22 above 1.0×, at p=2.64% against 437 other March sessions, the control neither sibling could
run; it carries no March premium over the other quarterly legs (p=44.0%), so it is sized quarterly.
**(c) Both of this session's own candidate findings are refuted, and by design** — a March effective-open
volume step that dies to the denominator (within-March p=25.5%, and March is the highest-mean
relative-volume month of the twelve at p<0.001%), and an IJR−SPY tier tilt (median +0.408%, MW p=3.95%) that
dies twice over: no turnover footprint (p=92.9%) and a four-bucket sign flip that pools away to p=49.2%.
**(d) The 2027-specific feature is calendar, not tape** — Good Friday 2027-03-26 makes the effective week
four sessions; only 2 of 22 March legs share it, they disagree by 2×, the statistic is refused, and so is
the Holy-Week fallback (11 of 20 week-means above 1.0× — parity, not quietness), leaving the note as
arithmetic with no volume claim attached. Carry forward the thing that outlives
this event: **the December sibling wrote that in December the month is the confound; March shows the
confound has a direction and a mechanism. The trailing-60 denominator is seasonally biased both ways, so a
cross-quarter comparison of relative volume measures the lookback window, and a return tilt with no
turnover signature is not flow.**

**Kill switches:**

- **The March 2027 S&P DJI release words its effective date as anything other than Monday 2027-03-22** —
  the two-instance March geometry breaks and this entry is misdated. Registered as
  `FT-sp-quarterly-rebalance-effective-2027-03-22-1`.
- **SPY's 2027-03-19 volume prints below 1.0× its trailing-60 median** — leg 2's execution step fails on its
  own draw against a 19-of-22 base rate, and the one non-refusal this ledger hands the March corridor is
  overbuilt. Registered as `FT-sp-quarterly-rebalance-effective-2027-03-22-2`.
- **The March 2027 S&P DJI quarterly-rebalance release publishes on any date other than 2027-03-05** — the
  first-Friday-of-the-rebalance-month convention holds in **7 of 7** instances this family has read, and it
  is the sole basis for the `sp-rebalance-proforma-2027-03-05` adjacent proposed in this PR. Registered as
  `FT-sp-quarterly-rebalance-effective-2027-03-22-3`.
- **S&P DJI publishes a methodology change moving the quarterly rebalance off the third-Friday close** — all
  three sourced primaries date this event by one geometry, and a schedule change invalidates the entry
  rather than adjusting it.
- **A lane with a longer sample shows the March effective-open return distribution separating from its own
  calendar window at p<1%** — leg 6's judgement that p=5.97% after four controls is multiple testing would
  be wrong, and the one quantity this session declined to promote becomes a finding.
- **A constituent-level instrument, once built, shows S&P 600 additions repricing on the 2027-03-22 *open*
  rather than on the ~2027-03-05 announcement** — leg 4's kill would be confirmed as tier-ETF-only, and the
  effective date, not the announcement, becomes the session worth tracking.
- **The 2027-03-22 print is unreadable because two index families' flows land on it** — `russell-quarterly-ipo-review-effective-2027-03-22`
  shares this open, so a close-out that attributes anything on that session to the S&P rebalance alone is
  unsound; the honest close-out may have to score `FT-…-3` and decline the rest.

**Registered forward tests.** `FT-sp-quarterly-rebalance-effective-2027-03-22-1`, `-2` and `-3` — see
[`forward-tests/sp-quarterly-rebalance-effective-2027-03-22.md`](../forward-tests/sp-quarterly-rebalance-effective-2027-03-22.md).
Observations, never templates. All three adjudicate a claim this ledger makes rather than a hypothesis it
hopes for — `-1` the date, `-2` the one surviving execution statement, `-3` the convention the proposed
adjacent rests on. **What is deliberately NOT registered is leg 4's kill**, because no single 2027-03-22
observation can adjudicate it: the obvious threshold test was built, measured at a 13-of-22 base rate, and
discarded rather than shipped at that power (leg 4a). Registering a test that fires 41% of the time by
chance would launder a coin flip as evidence.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-09 | D-194 | Initial research banked; canonical `src/domain/market-events/<id>.json` written this session (the id existed only as `proposals/…from-russell-style-quarter-end-capping-effective-2027-03-31.json`, read in full first). probe-ref baseline set (no symbols by design, **VIX 15.72**, band `low:15+`, **11** adjacents, **1** blocked fetch). **DATE RE-SOURCED FROM MARCH, THE QUARTER NEITHER SIBLING HAD READ:** two S&P DJI releases fetched direct (HTTP 200) via the newsroom's offset pagination — **2025-03-07** *"effective prior to the open of trading on Monday, March 24"* (3rd Fri 2025-03-21) and **2026-03-06** *"will take effect before the market opens on Monday, March 23, as part of the quarterly rebalance"*, **58** rows stamped *"Mar 23, 2026"* (3rd Fri 2026-03-20); plus the SEC 497 re-fetched, *"…the third Friday of **March**, June, September and December."* March 2027 Fridays are 5/12/**19**/26, so effective open **2027-03-22**. **TRAP RECORDED:** the owner paraphrases the sentence, so a grep for the December sibling's phrasing misses the 2026 release. **HEADLINE — THE EXECUTION STEP CLEARS A SAME-MONTH CONTROL, A FIRST FOR THIS FAMILY:** SPY 3rd-Friday relvol **1.496×/1.291×, 19 of 22** above 1.0× vs **all other March sessions** 1.297×/1.097× (n=437, **MW p=2.64%**); no premium over Jun/Sep/Dec (**p=44.0%**), weak vs ordinary opex at n=22 (**p=8.27%**) — so quarterly-sized, now same-month-verified. **TWO CANDIDATE FINDINGS RAISED AND KILLED:** (i) a March effective-open relvol step (**1.185×/1.086×, 14/22** vs JSD 0.975×/0.899×, 21/64, **MW p=8.68%**) dies within-March (**p=25.5%**; other March sessions' median 1.097× is HIGHER) and on the Mar 19-25 window (**p=21.5%**) — cause is the **denominator**: March is the **highest-mean relvol month of twelve** (1.301×/1.098× vs 1.098×/0.988× all sessions, **p<0.001%**) because the trailing-60 lookback straddles the Christmas-New Year lull, the exact MIRROR of the December sibling's Thanksgiving note; (ii) an **IJR−SPY** effective-open tilt (median **+0.408%**, **MW p=3.95%** vs JSD, monotone IJR>IJH>SPY with RSP flat at p=49.5%) dies twice — **no turnover footprint** (IJR relvol vs SPY **p=92.9%**) and a four-bucket sign flip (Mar +0.408% / Jun +0.026% / **Sep −0.195%** / Dec +0.014%, no bucket's sign test firing; pooling FOMC-adjacent Mar+Sep vs Jun+Dec gives **p=49.2%** on IJR−SPY and **p=87.3%** on SPY returns). **INDEX-LEVEL NULL CONFIRMED ON THE MARCH LEG:** SPY return **9/22** negative (**p=52.3%**); the +0.583% mean is 2009-03-23 (+7.18%) and 2020-03-23 (−2.56%) contributing +0.173%, median unchanged at +0.377% without them; vs other March sessions **p=11.2%**, vs the Mar 19-25 window **p=5.97%** — recorded NOT established, as multiple testing on one quantity. **A DATE-ALIGNMENT BUG WAS CAUGHT MID-SESSION AND IS RECORDED:** a +12h offset shifted SPY's session labels one day while `^VIX`'s held, and under it the overnight gap read **4/22 positive, p=0.43%** — a false headline; corrected it is **15/22, p=13.4%** (nothing), and the corrected VIX 15.72 reproduces the December sibling's reading. **2027-SPECIFIC, STRUCTURAL:** Good Friday **2027-03-26** (NYSE calendar fetched direct, 109,180 B; row parses Apr 3 / **Mar 26** / Apr 14 for 2026/27/28) is the FOURTH Friday, so the effective week is **4 sessions** (Mon 03-22 - Thu 03-25); only **2 of 22** March legs share it (2005, 2016; next **2032**) and they disagree 2× on week relvol (1.235× vs 0.613×) — **refused on power**, and the Holy-Week fallback is refused too (**11 of 20** non-rebalance week-mean relvols above 1.0×, week-mean median 1.018× — parity, not quietness), leaving the note as arithmetic with **no volume claim**. No equity early close in March 2027 (same NYSE page); the 03-25 2:00 p.m. ET close is fixed income only. **2008 PRECEDENT:** Good Friday fell ON the March 3rd Friday (2008-03-21), moving implementation to the Thursday 03-20 close — 2027 does NOT collide. **Adjacency — peers:** none (`symbols: []`). **Macro:** **11** tracked ids within 5d — `fomc-2027-03-17` (**high**) + `vix-expiration-2027-03-17` T−5, `boj-decision-2027-03-18` (**medium**) T−4, `opex-2027-03-19` (**high**) + `japan-cpi-2027-03-19` T−3, `jpx-market-closure-2027-03-22` + `russell-quarterly-ipo-review-effective-2027-03-22` **T+0**, `boj-minutes-2027-03-24` T+2, `sifma-bond-early-close-2027-03-25` T+3, `good-friday-market-closure-2027-03-26` + `japan-cpi-tokyo-flash-2027-03-26` T+4; a **second index family's flow lands on this same open**, which makes the print harder to read than the December sibling's quiet corridor. **STRUCTURAL ASYMMETRY COMPUTED FROM THIS REPO'S FOMC ENTRIES:** Mar/Sep legs implement **2 days** after an FOMC, Jun/Dec legs **9 days** — so `fomc-2027-03-17` at T−5 is normal for March, and the geometry explains nothing (**p=87.3%**). **Vol:** baseline, no prior; **VIX 15.72** (2026-09-08 daily bar; 2026-09-09 had no bar at fetch time). **Geopolitical:** nothing touching index methodology. **Event tape:** playbooks + sweep re-grepped incl. `rebalanc|index effect|reconstitut|witching|closing auction` → **zero hits**. **BLOCKED, NOT SUBSTITUTED:** spdji `methodology-sp-us-indices.pdf` **403** again (prefix stays `EST:`); operational note — `sec.gov` **403**s a browser UA and **200**s with a declared-identity one. **ONE DATED ADJACENT FILED:** `sp-rebalance-proforma-2027-03-05` (first Friday of the rebalance month, the convention both re-fetched March instances follow; the calendar already tracks the 2026-09-04 and 2026-12-04 siblings). **ONE DECLINED ON THE RECORD:** a capped pro-forma for 2027-03-12, because that date already carries `sp-rebalance-reference-close-2027-03-12`. Registered **FT-…-1** (the Mar 2027 release words 2027-03-22), **FT-…-2** (SPY 03-19 volume ≥ 1.0× its 60d median, base rate 19/22), **FT-…-3** (that release publishes **2027-03-05**, the first Friday — **7 of 7** instances). **ONE FT DELIBERATELY NOT REGISTERED:** a threshold test on leg 4's kill was built and discarded at a **13-of-22** base rate (IJR tracks SPY far more loosely than QQQ, so the December sibling's +0.20× step would fire ~41% of the time by chance) — the kill is recorded as not single-draw-adjudicable rather than shipped at that power. | — (stance set: **stand aside** on all four horizons, the only non-refusal being **treat 2027-03-19, not 2027-03-22, as the execution hazard, sized quarterly and now same-month-verified**; the refusal rests on a March-sourced date attached to an index-level null, two of this session's own statistics killed by controls it built, and no house playbook or instrument keyed to index flow — with one loose end named rather than promoted, the March effective-open return distribution at p=5.97% against its own calendar window) | 2026-10-09 (band `low:15+`, every 30d). Close-out by 2027-03-28 |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint notes any
row past ~1,200 chars): it is a note to the next session, not an essay, and a stance *change* earns its
sentence in the Stance section with the row as its receipt. The adjacency sweep (peer prints · macro
surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in every row; a dated
adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-sp-quarterly-rebalance-effective-2027-03-22.json`
(`status: "estimate"`) in the same PR — your own file, never another event's canonical one (#1717).
Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from
memory — after which this doc goes quiet.
