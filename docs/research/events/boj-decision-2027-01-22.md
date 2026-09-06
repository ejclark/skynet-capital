# Bank of Japan MPM decision + Outlook Report (MPM Jan 21-22, 2027) — boj-decision-2027-01-22

**Kind:** macro-print · **Date:** 2027-01-22 (estimate, NEWS: boj.or.jp "Monetary Policy Meetings" schedule page (en/mopo/mpmsche_minu/), raw HTML re-fetched HTTP 200, 41,959 bytes and column-parsed independently by this session on 2026-09-05 — the 2027 table's first row parses as `["Jan. 21 (Thurs.), 22 (Fri.)", "Jan. 22 (Fri.)", "Feb. 1 (Mon.)", "Mar. 24 (Wed.)"]` against the header "Date of MPM | Outlook Report (The Bank's View) | Summary of Opinions | MPM Minutes", so the dated Outlook column confirms this IS an Outlook Report meeting; filed estimate because the confirmed-prefix taxonomy has `FED:` and no slot for any other central bank, and this lane may not self-confirm an event it discovered in-sweep) · **Impact:** medium
**Last assessed:** 2026-09-05
<!-- probe-ref: {"symbols":{},"vix":14.32,"daysBand":"medium:31+","adjacentIds":["fomc-2027-01-27","japan-cpi-2027-01-22"],"screenStreak":0} -->

## At a glance

**TL;DR.** **Stand aside — and stop calling this "the next BoJ meeting."** Three sibling ledgers
([09-18](boj-decision-2026-09-18.md), [10-30](boj-decision-2026-10-30.md),
[12-18](boj-decision-2026-12-18.md)) treat the BoJ as a rate question with no channel to a US AI
book. This venue is different in three ways nobody has recorded, all primary and dated. **(1)
Japan's December national CPI *and* the 2026 yearly average release on 2027-01-22 itself** — the
Statistics Bureau's own release schedule, parsed cell-by-cell today; this is the only BoJ date on
this calendar that shares its day with Japan's CPI, while the next meeting (Mar 17-18) sits **one
day before** the February print. **(2) A food consumption-tax cut from 8% to 1% takes effect
2027-04-01** — the first day of FY2027, the fiscal year this Outlook Report must project — a
mechanical CPI drag this lane sizes at roughly **1.0-1.4pp**, against a BoJ footnote convention
that strips "the effects of consumption tax **hikes**" and was written for hikes, not cuts.
**(3) The BoJ's own July 2026 Outlook names AI-related demand and semiconductor prices as a driver
of Japanese CPI** — so the channel between this calendar's names and this event exists and runs the
*opposite* direction from the one all three siblings dismissed. Separately, this session **re-ran
the siblings' FX study on an independent primary series** (the Fed's H.10 noon-ET fixing, FRED
`DEXJPUS`) and found the volatility estimate replicates almost exactly (60-session sd **0.511%** vs
their **0.514%**) while **two of four decision-day readings flip sign** — the registered ±2.0%
tests name no series, and that is a defect in them. Date is **estimate**; it widens caution and
licenses nothing.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — nothing here is ours to hold | High | `symbols: []`, no house playbook is rates- or FX-keyed, and at D-139 there is no position this event could be sized into | A tracked name (NVDA/AVGO/MRVL/CRWV) moving **>2%** on any session **2026-09-05 → 2027-01-21** that the tape attributes to a BoJ headline — the "no price channel" premise would be wrong and this doc is rebuilt |
| This week | **Stand aside; the live BoJ question this week is 09-18, not 01-22** | High | Three prior decisions stand in front of this one, and Ueda said on **2026-09-02** that officials will decide **09-17/18** "with upside price risks in mind" — nothing in the 09-07 → 09-11 tape is 01-22-keyed | Any BoJ communication before **2026-09-11** naming **January 2027** specifically as a venue, or the BoJ moving the Jan 21-22 MPM — the whole scaffold below is re-derived early |
| This month | **Watch the Diet, not the BoJ** — the food-tax bill is what makes January's Outlook hard | Medium | The 8%→1% cut is LDP-approved but **pending parliamentary approval** as of **2026-08-07**; the autumn Diet session decides whether the January Outlook has to project it at all | The food-tax cut being **withdrawn, deferred past April 2027, or passed in materially different form**, observed by **2026-10-31** — leg 2 and FT-1 both die, and January reverts to an ordinary Outlook meeting |
| This quarter | **Do not price January as the consensus's hike venue — the consensus points at Q2** | Medium | Reuters (**2026-07-23**) found **70% of 52** economists expect ≥1.50% **in Q2 2027**, and this session's own parse of the BoJ's 2027 table shows Q2 has exactly two venues (**Apr 27-28**, **Jun 10-11**). January is neither | The BoJ raising the policy rate at the **2027-01-22** decision. Registered as **FT-boj-decision-2027-01-22-3**, score by 2027-01-23 |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit or hedge is keyed to the 2027-01-22 decision or to the 01-22 US session.
- **The finding that matters most (attribution)** — **Japan's December-2026 national CPI and the
  2026 yearly average release on 2027-01-22**, hours before the decision, per
  [stat.go.jp's own release schedule](https://www.stat.go.jp/english/data/cpi/1582.html) parsed
  today. Any read of that Tokyo session must split two Japanese events before crediting the BoJ.
  Filed as [`japan-cpi-2027-01-22`](japan-cpi-2027-01-22.md) (estimate) in this PR.
- **The finding that matters most (policy)** — the **8%→1% food consumption-tax cut effective
  2027-04-01** is the first day of **FY2027**, the year this Outlook must project. The BoJ's
  standing footnote strips *"the effects of consumption tax **hikes**"*. January is where the bank
  either extends that wording to a cut or books a ~1pp drag. Filed as
  [`japan-food-tax-cut-2027-04-01`](japan-food-tax-cut-2027-04-01.md) (estimate) in this PR.
- **The channel the siblings had backwards** — the BoJ's **July 2026 Outlook**, verbatim: CPI will
  be *"clearly above 2 percent from the second half of fiscal 2026, affected by the rise in the
  prices of **semiconductors and other items, reflecting the increase in AI-related demand**"*, and
  it lists *"developments in AI-related demand"* among the three named risks. Our names are an
  input to this event's reaction function. **That is not tradable from our side** — it does not
  create a BoJ→equity channel — but "no channel" was the wrong sentence.
- **The number no sibling carries** — Japan's realised headline CPI was **+1.9% y/y in July 2026**
  (Statistics Bureau front-page indicator, read today). Three ledgers cite PPI at 7.2% and the
  bank's *forecast* of "clearly above 2%"; none cites a realised CPI print, and the realised print
  is below target.
- **The venue structure, parsed from the primary table today** — 2027 MPMs: **Jan 21-22 (Outlook)**
  · Mar 17-18 · **Apr 27-28 (Outlook)** · Jun 10-11 · **Jul 21-22 (Outlook)** · Sep 21-22 ·
  **Oct 28-29 (Outlook)** · Dec 16-17. The 70%-by-Q2-2027 consensus has **two** venues (Apr 28,
  Jun 11); January is the meeting *before* the window, not inside it.
- **The FX test is series-dependent, and that is this ledger's methodological finding** — on the
  Fed's H.10 noon-ET fixing the 2026 decision-day moves are **-0.50% / -0.81% / +0.15% / +0.12% /
  -0.19%**, against the [12-18 ledger](boj-decision-2026-12-18.md)'s Yahoo readings of **+0.03% /
  +0.57% / +0.12% / +0.12%**: two of four **flip sign**, one by **1.38pp**. The 60-session sd
  replicates (**0.511%** vs **0.514%**). Register a series, or the test is under-specified.
- **The bracket test has real power; the decision-day test does not** — on the Fed series, **3 of 5**
  2026 decisions had a D-1→D+2 session clear ±2.0% (**-2.34%** 01-26, **-2.23%** 04-30, **-2.68%**
  07-30) while **no decision day itself exceeded 0.81%**. This independently vindicates the 12-18
  ledger's FT-3 design and corrects its premise — on this series the July decision **did** clear it.
- **The empty corridor is a limit, not a finding** — only **one** tracked event sits within ±5 days
  ([`fomc-2027-01-27`](fomc-2027-01-27.md), estimate, high) plus the CPI proposed here, versus 10 /
  14 / 28 for the three 2026 BoJ dates. That is because this calendar thins out past 2026, **not**
  because January 2027 is quiet. Do not read it as clean attribution.
- **Watch (dated)** — BoJ Masu speech **2026-09-10** · BoJ decision **2026-09-18** (est) · Takaichi
  Cabinet reshuffle **mid-to-late Sept 2026** (Katayama reported likely to stay at MOF, ~2026-09-05)
  · autumn Diet session, food-tax bill · BoJ decision + Outlook **2026-10-30** (est) · BoJ decision
  **2026-12-18** (est) · Japan Dec CPI **2027-01-22** (est, proposed here) · **this decision
  2027-01-22** (est) · this meeting's SoO **2027-02-01**, Minutes **2027-03-24** · **FOMC
  2027-01-27** (est) · next MPM **2027-03-18** (est, proposed here) · tax cut effective
  **2027-04-01** (est, proposed here) · first post-cut Outlook **2027-04-28** (est, proposed here).

## Initial research

### The question, plainly

Three sibling ledgers have already answered the standing BoJ questions for this book: the yen carry
channel is not live enough to matter ([09-18](boj-decision-2026-09-18.md)), an initial research on
an event whose distribution an earlier event sets is a conditional scaffold plus the fork-independent
facts ([10-30](boj-decision-2026-10-30.md)), and December's hold-modal read was overtaken by two
dated 2026-09-02 sources ([12-18](boj-decision-2026-12-18.md)). None is re-litigated here.

This entry has its own question, and it is deliberately not another consensus re-derivation at
D-139, where a survey read would be worth almost nothing: **what does the January Outlook meeting
carry that no sibling could, and does the sibling series' central measurement survive an
independent series?**

**One-line verdict: three January-specific structures the siblings do not have — a same-day CPI
print, a fiscal shock landing on the projected fiscal year, and the BoJ's own AI-to-CPI channel —
and no, the decision-day FX measurement does not survive; two of four readings flip sign on a
second primary series.** The stance is unchanged (stand aside, no position). What changes is what
the next pulse has to work with.

**Method:** sourced web research per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md).
Primaries fetched and parsed directly today (2026-09-05), each by machine rather than through a
summarizer: the **BoJ MPM schedule** page (HTTP 200, 41,959 bytes, both year tables parsed
cell-by-cell); the **Statistics Bureau CPI release schedule** (HTTP 200, 2,823 bytes, its single
table parsed row-by-row); the **BoJ's July 2026 Outlook highlights** (HTTP 200, 41,550 bytes); the
Statistics Bureau's **CPI 2025-base revision** page and English homepage. **Price work is this
session's own and deliberately uses a different series from the siblings':** USD/JPY from the
Federal Reserve's H.10 noon-ET fixing (FRED `DEXJPUS`, 13,951 bars 1971-01-04 → 2026-08-28) and
VIX from CBOE via FRED (`VIXCLS`, through 2026-09-03), both fetched as CSV and computed locally —
no instrument scripts, because `symbols: []`, there is no issuer, and
`earnings-cycle.mjs`/`intraday-edges.mjs` have no macro mode. Adjacency computed mechanically
against the live calendar using `event-material-decide.mjs`'s own ±5-day window.

### Conviction legs, tested

1. **Japan's December national CPI releases on 2027-01-22, the same day as this decision —
   SUPPORTED, primary, and it is the single most useful fact in this document.** The Statistics
   Bureau's ["Schedule of Release"](https://www.stat.go.jp/english/data/cpi/1582.html) has one
   table; parsed cell-by-cell, the relevant row is exactly
   `["December", "January 22, 2027", "January, 2027", "January 29, 2027", "2026 yearly average of Japan"]`
   against the header `Japan: Survey month | Date of release || Ku-area of Tokyo (preliminary):
   Survey month | Date of release || Remarks`. So **the December-2026 national CPI and the 2026
   yearly average both release on 2027-01-22**, and the Tokyo January flash follows 2027-01-29.
   The national CPI's standing release time is 08:30 JST and the MPM decision publishes at the
   meeting's conclusion around midday JST, so the print is public hours before the announcement.
   Two consequences. **For attribution:** the 01-22 Tokyo session carries two Japanese events, and
   nothing in it may be credited to the BoJ until the CPI is ruled out — the mirror image of the
   12-18 ledger's triple-witching rule, except the confound here is Japanese rather than American.
   **For the meeting's information set:** the next MPM (2027-03-17/18) meets the day *before* the
   February CPI releases on 2027-03-19 (same table, row 16), so on CPI **January is the
   best-informed 2027 venue and March the worst**. Filed as
   [`japan-cpi-2027-01-22`](japan-cpi-2027-01-22.md), estimate, in this PR.

2. **A food consumption-tax cut lands on the first day of the fiscal year this Outlook must project
   — SUPPORTED on the policy, ESTIMATED on the magnitude, and it is the hardest thing about
   January.** News On Japan, **2026-08-07**, verbatim: *"The ruling Liberal Democratic Party has
   approved Takaichi's plan to reduce the consumption tax on food from 8% to 1% for two years from
   April 2027, pending parliamentary approval. The government also plans payments that would
   effectively cover the remaining 1%, making food tax-free for households during the period."*
   Corroborated by vatcalc.com and Japan Today, which add it is *"to be replaced in 2029 by a new
   refundable tax credit system"*. **FY2027 runs 2027-04-01 to 2028-03-31 — the cut covers all of
   it.** Cutting the reduced rate 8%→1% lowers affected retail prices by about 7/108 ≈ **6.5%**;
   Japan's reduced rate applies to food and non-alcoholic beverages excluding dining out, plus
   newspapers, so the affected basket share is materially narrower than the ~26% "food" aggregate.
   Against a plausible **16-22%** affected weight that is a one-off drag of roughly **1.0-1.4
   percentage points** on year-on-year CPI from April 2027, unwinding April 2029. **That
   arithmetic is this lane's own and the weight is not sourced** — an order-of-magnitude bound, not
   a figure. The residual-1% payments are a transfer, not a price, and do not enter the index at
   all. Fiscal side, press-cited: a revenue shortfall of about **¥4.4-5tn a year** (~¥10tn over two
   years) with the administration promising **no deficit-financing bonds** — the funding-credibility
   question that has been pushing JGB long yields. Filed as
   [`japan-food-tax-cut-2027-04-01`](japan-food-tax-cut-2027-04-01.md), estimate, in this PR.
   **Pending Diet passage** is the whole caution: this is announced policy, not law.

3. **The BoJ's projection footnote is written for tax *hikes*, and April 2027 is a *cut* — MIXED,
   and it is the specific fork the January Outlook resolves.** The BoJ's Outlook Reports carry a
   standing note that the CPI figures are *"for all items less fresh food, excluding the effects of
   consumption tax hikes"* — the convention it used for 2014 and 2019. A cut is not literally
   covered by that wording. So January's Policy Board members face a choice with a visible tell:
   extend the convention (the FY2027 median stays near where the October 2026 Outlook leaves it,
   with a new or amended footnote) or book the drag (the headline FY2027 median falls by something
   like a point). The July 2026 Outlook's **FY2027 core-CPI median was +2.4%**, revised **up** from
   +2.3% in April, with FY2028 at **+2.0%** — so a booked drag would put FY2027 visibly *below*
   FY2028, an inversion that would be hard to miss. Standard central-bank practice, and the BoJ's
   own precedent, both point at extending the convention; that is the registered prediction
   (**FT-boj-decision-2027-01-22-1**) rather than an assertion, precisely because the wording gap
   is real and the fork is genuinely open. **Honest weakness: the "hikes" wording is cited from a
   search-surfaced reading of the Outlook Reports' footnote convention, not from a footnote this
   session extracted verbatim** — the Outlook PDFs resisted local text extraction (see limits).

4. **The BoJ names AI-related demand as a driver of Japanese CPI — SUPPORTED, primary, and it
   inverts the siblings' "no channel" leg.** From the Bank's own
   [July 2026 Outlook highlights](https://www.boj.or.jp/en/mopo/outlook/highlight/ten202607.htm),
   fetched today, verbatim: *"The year-on-year rate of increase in the CPI is likely to be clearly
   above 2 percent from the second half of fiscal 2026, affected by the rise in the prices of
   **semiconductors and other items, reflecting the increase in AI-related demand**, and the
   depreciation of the yen, in addition to the rise in crude oil prices."* And among the three
   named risks: *"it is necessary to pay attention to the situation in the Middle East as well as
   **developments in AI-related demand** and foreign exchange rates."* Also verbatim: *"There is a
   risk that underlying CPI inflation will deviate upward to a level above the 2 percent price
   stability target."* All three sibling ledgers close with a leg saying no tracked symbol carries a
   channel this calendar instruments. That remains true **in the direction they tested it** — a BoJ
   move does not reach NVDA/AVGO/MRVL/CRWV except through second-order yen funding and term premium
   the FOMC ledgers already own. But the causality the *bank itself* asserts runs the other way:
   **AI demand → semiconductor prices → Japanese CPI → BoJ reaction function.** That is not
   tradable from our side and creates no play. It does mean the next pulse should read a strong AI
   capex cycle as *hawkish for the BoJ*, which no sibling would have surfaced.

5. **Realised Japanese CPI is below target, and no sibling ledger carries a single realised print —
   MIXED, and it cuts against the hawkish frame.** The Statistics Bureau's English homepage
   "Latest indicators" panel, read today, gives **Consumer Price Index +1.9%, July 2026, change
   over the year** (alongside unemployment 2.4% and household consumption expenditures **-3.6%**,
   both July 2026). Three ledgers build the hawkish case on PPI at **7.2%** and the bank's
   *forecast* of "clearly above 2%"; the realised headline is **1.9%** and consumption is
   contracting. **Caveat, stated because it matters:** that front-page figure is the all-items
   index, and the BoJ targets all-items-less-fresh-food; this session could not isolate core
   (the detailed release page 404s — see limits), so the *level* is honest but the *comparison to
   the 2% target* is approximate. It is still the first realised Japanese price datapoint in four
   BoJ ledgers, and it points the opposite way from the pipeline story.

6. **Japan's CPI rebased on 2026-08-21, mid-cycle — SUPPORTED, primary, and it is a quiet
   methodological break under everything above.** From the same release-schedule table, row 9's
   Remarks cell reads `Revision to 2025-Base Consumer Price Index` against the July-2026 national
   release on **2026-08-21**. The
   [2025-base revision page](https://www.stat.go.jp/english/data/cpi/2025plan.html) states the
   weights come from 2025 household expenditure, the item count moves to **589** (19 added, 11
   removed, 2 integrated into 1), and — the operative sentence — *"the rates of change are not
   recalculated with the linked index but the published values for every base period are used
   unmodified."* So the y/y series the board judges is spliced across a weight change, not
   recomputed. The 2020-base CPI is also published in parallel **through December 2026**, which
   means the January 2027 meeting is the **first MPM with only the new base available**. This does
   not change any call; it is a caution the next pulse should carry when comparing a January print
   to a 2025 one.

7. **The consensus points at Q2 2027, and Q2 has exactly two venues — neither is January.
   SUPPORTED, survey + this session's own primary parse.** Reuters' poll (FXStreet syndication,
   **2026-07-23**): *"70% of economists anticipate the BoJ to hike rates to at least 1.50% in Q2 of
   2027, while 51% of respondents see 1.50% as the terminal rate."* Independent reads put the
   FY-end-2027 median at 1.5% and one board-adjacent forecaster's terminal at 1.5-1.75%. This
   session parsed the full 2027 MPM table for the first time: **Jan 21-22 (Outlook) · Mar 17-18 ·
   Apr 27-28 (Outlook) · Jun 10-11 · Jul 21-22 (Outlook) · Sep 21-22 · Oct 28-29 (Outlook) · Dec
   16-17**. Q2 2027 therefore contains **Apr 27-28 and Jun 10-11 and nothing else.** January sits
   *before* the window the consensus names. This is the structural inverse of the
   [12-18 ledger](boj-decision-2026-12-18.md)'s finding that December is *"the consensus's deadline,
   not its date"*: **January is the venue the consensus skips**, and the honest base case is a hold
   with the Outlook Report doing the work. Registered as **FT-boj-decision-2027-01-22-3**.

8. **The decision-day FX measurement does not survive an independent series — MIXED, and it is the
   methodological finding of this ledger.** The [12-18 ledger](boj-decision-2026-12-18.md) measured
   2026's decision days on Yahoo's `JPY=X` and flagged, as an honest limit, that Yahoo stamps those
   bars at the 23:00 UTC Tokyo roll. This session re-ran the identical study on the **Federal
   Reserve's H.10 noon-ET fixing** (FRED `DEXJPUS`), a series with a *different, US-session*
   timestamp — so the two should agree on anything real:

   | 2026 decision (JST) | 12-18 ledger, Yahoo `JPY=X` | This session, Fed H.10 `DEXJPUS` |
   |---|---|---|
   | 01-23 | **+0.03%** | **-0.50%** |
   | 03-19 | **+0.57%** | **-0.81%** |
   | 04-28 | +0.12% | +0.15% |
   | 06-16 | +0.12% | +0.12% |
   | 07-31 | (reported as the -1.91% / -1.62% pair) | -0.19% |

   **Two of four flip sign; one differs by 1.38pp.** Meanwhile the *volatility* estimate replicates
   almost exactly — trailing 60-session daily sd **0.511%** here vs **0.514%** there — as does the
   tail count: ≥2.0% days on the Fed series are **3/166 in 2026 (1.8%)**, 2/250 in 2025 (0.8%),
   5/251 in 2024 (2.0%). So the siblings' *distributional* claim is solid and independently
   confirmed; their *day-level* readings are an artefact of one series' timestamp. **The registered
   ±2.0% tests (FT-boj-decision-2026-09-18-1, -10-30-1, -12-18-1) name no series and no fixing
   time.** Nothing about them is edited — that would be falsification — but the next scoring
   session must name the series it scores on, and this ledger registers its own FX test with the
   series, the fixing convention and the source URL stated (**FT-boj-decision-2027-01-22-2**).

9. **The bracket test has real power and the decision-day test has almost none — SUPPORTED, and it
   independently vindicates the 12-18 ledger's FT-3.** On the Fed series, taking each 2026
   decision's D-1 → D+2 window and its largest single close-to-close move:

   | Decision | Largest session in D-1 → D+2 | Clears ±2.0%? |
   |---|---|---|
   | 01-23 | **-2.34%** (01-26, D+1) | yes |
   | 03-19 | -0.81% (03-19, D) | no |
   | 04-28 | **-2.23%** (04-30, D+2) | yes |
   | 06-16 | +0.72% (06-18, D+2) | no |
   | 07-31 | **-2.68%** (07-30, D-1) | yes |

   **3 of 5 brackets clear ±2.0%; no decision day itself exceeds 0.81%.** The 12-18 ledger built
   FT-3 on exactly this intuition — that 2026's ±2% days came at D+1 and D+2 after *holds*, never on
   the day — and this is that pattern reproduced on an independent series, with the 01-26 and 04-30
   dates matching to the session. **One correction:** that ledger's premise that *"the largest yen
   event of 2026 would not have tripped the switch"* is series-dependent. On the Fed's fixing the
   July decision produced a single **-2.68%** session on **2026-07-30**, which clears ±2.0%
   outright, where Yahoo split it into -1.91% and -1.62%. Note the practical consequence: a bracket
   test around 2027-01-22 is a **genuine coin-flip**, not a near-certain pass — which is what makes
   it worth registering.

10. **The politics have moved toward the bank, not against it — MIXED, and it partly overtakes the
    12-18 ledger's Takaichi leg.** That ledger's leg 10 rests on Bloomberg's **2026-07-23** survey
    finding **59% of 52** economists call the Takaichi government *"a deterrence for the board to
    proceed along the path toward policy normalization"*, and weights January's kind of horizon
    down for it. Three dated items since cut the other way. **2026-08-13**, Bloomberg headline:
    *"Japan's Government Is Said to Support Faster BOJ Rate Hike"*, with the reported government
    view that the next move comes in September or October. **2026-09-02**, Governor Ueda after the
    G20 in Asheville, at a joint briefing with Finance Minister **Satsuki Katayama** (Japan Times,
    fetched in full today), verbatim: *"From the perspective of conducting policy with a
    risk-management approach as the underlying inflation rate approaches 2%, we have come to
    believe that we need to pay greater attention than before to upside risks in our policy
    conduct"* — and the same piece reports he *"hinted that a rate hike is likely when the board
    convenes"* on **Sept. 17-18**. **~2026-09-05**, Japan Times: *"Takaichi seen retaining foreign
    and finance ministers in Cabinet reshuffle"*, i.e. the mid-to-late-September reshuffle looks
    like continuity at MOF rather than a personnel shock. **Honest weakness: the Bloomberg 08-13
    item is a headline plus a syndicated summary — bloomberg.com returned 403 to a browser-UA curl
    and the body was not read.** The counterweight is not gone: the government's ¥370tn investment
    roadmap, the food-tax revenue hole and the no-deficit-bond pledge all still argue against
    higher funding costs. But "the PM's government is a deterrent" is a July read, and there is an
    August wire pointing the other way.

11. **The adjacency corridor is nearly empty, and that is a limit rather than a finding —
    SUPPORTED, from this calendar's own entries.** `event-material-decide.mjs`'s ±5-day window
    returns exactly **one** tracked event: [`fomc-2027-01-27`](fomc-2027-01-27.md) (estimate,
    high, no SEP), five days later. Against 10 for 12-18, 14 for 09-18 and 28 for 10-30. It would
    be easy and wrong to call this the cleanest attribution setting of the four BoJ dates. **The
    corridor is empty because the calendar thins out past 2026, not because January 2027 is
    quiet** — the January print calendar (US CPI, the December jobs report, Q4 GDP advance, January
    opex) simply has no entries yet at D-139. The one genuine corridor fact is leg 1's: the
    confound that *will* be there is Japanese, not American, and it shares the exact date. This PR
    adds the CPI; the rest is for the pulses.

12. **No tracked symbol carries a yen channel this calendar instruments — SUPPORTED, inherited,
    and now stated with the direction named.** `symbols: []`. The house playbooks (S1/S2/E1/S3/S4 +
    G1, [`trade-playbooks.md`](../../plans/trade-playbooks.md)) are equity- and earnings-keyed; none
    is rates-, FX- or funding-keyed. Yen funding and global term premium are second-order and
    already owned by the FOMC ledgers. Leg 4 does not change this conclusion — it changes its
    *phrasing*: the channel exists, it points from our names toward this event, and it is not
    something a US equity book can trade in either direction.

### What plays the conditions support (date estimate)

**None.** No entry, exit, hedge or size is keyed to 2027-01-22. Four rules:

- **Read-only.** This entry's marginal value is the same-day CPI, the tax-cut/Outlook fork, the
  inverted AI channel, and the FX series-dependence measurement — not a view.
- **Do not re-derive the consensus at D-139.** A July 2026 survey read on a January 2027 meeting is
  the stale instrument the [12-18 ledger](boj-decision-2026-12-18.md) warned about, one horizon
  further out. Leg 7's venue structure is the durable part; the percentages are not.
- **Search order when it lands** — (1) the **FY2027 CPI median in the Outlook Report** and whether a
  footnote strips the food-tax cut (FT-1); (2) the **vote split**; (3) whether the statement adopts
  *pace* language or restates *"timing and pace"*; (4) the yen, **on a named series** (FT-2).
- **The attribution rule.** Any read of the 2027-01-22 Tokyo session that has not first ruled out
  **Japan's own December CPI and 2026 yearly average, released the same morning**, is not entitled
  to attribute it to the BoJ. On the US side, the **2027-01-27 FOMC** sits five days later and the
  corridor is otherwise unpopulated *on this calendar only* — do not mistake that for quiet.

### Honest limits

**The BoJ Outlook PDFs resisted local extraction.** `gor2607a.pdf` and `gor2604a.pdf` were fetched
(HTTP 200, 206KB / 236KB) and their Flate streams inflated, but the recovered text was largely
unusable, so the **FY2026/27/28 projection medians and the consumption-tax footnote in leg 3 are
press- and search-cited, not read verbatim off the Bank's own table**. The July 2026 *highlights*
page (HTML) **was** read verbatim and everything quoted from it in leg 4 is primary. The next
session wanting the numbers should target the highlights page's projection table or the
`Policy Board Members' Forecasts` link rather than the PDF. **No market-implied path exists in any
of the four BoJ ledgers**, and this session sharpened the diagnosis rather than closing it:
`rateprobability.com/boj` returns **403 with a Cloudflare "Just a moment..." JS-challenge body**
(5,653 bytes, `challenges.cloudflare.com` in its CSP) — so it is an interactive bot challenge, not
a rate limit or an IP block, and a headless browser is the tool that would pass it, not another
curl. **One sibling limit is refuted:** the [12-18 ledger](boj-decision-2026-12-18.md) records
`stat.go.jp` as *"an access wall, not missing pages"* and tells the next session not to spend time
there. It is reachable — the English homepage, the CPI index, the release schedule and the
2025-base page all returned HTTP 200 to a plain browser-UA curl today, and legs 1, 5 and 6 are
built entirely on them. Only the deeper monthly-release page (`/english/data/cpi/1581.html`) 404s,
which is why leg 5's figure is the front-page all-items indicator rather than core. **Yahoo Finance
returned HTTP 429 to every chart request from this runner**, on both `query1` and `query2`, which
is why this session used FRED — a substitution that turned out to be the ledger's best accident,
since it produced legs 8 and 9. Note the cost: **`DEXJPUS` publishes with a lag and its last bar is
2026-08-28**, so the -2.05% session of 2026-09-03 that the 12-18 ledger measured on Yahoo could not
be cross-checked here, and the VIX reading is 2026-09-03's. **Bloomberg refuses browser-UA curl
(403)**, so leg 10's 08-13 item is a headline plus a syndicated summary. **Leg 2's CPI-drag
arithmetic is this lane's own with an unsourced basket weight** — a bound, not a figure. And most
importantly: **this is a D-139 initial research on an event three prior decisions stand in front
of, on a policy that is not yet law.** Every rate-path statement here is conditional on the 09-18,
10-30 and 12-18 outcomes, and it says so rather than dressing a fork as a call.

## Stance & kill switches

**Stance (date `estimate`):** **stand aside completely.** No position, no play, no size, in any
branch. What this ledger takes are five analytical positions, none of them positional.

First, **January is the venue the consensus skips, and the honest base case is a hold with the
Outlook doing the work.** Reuters' 2026-07-23 poll puts **70% of 52** economists on ≥1.50% **in Q2
2027**, and this session's own parse of the BoJ's 2027 table shows Q2 contains exactly **Apr 27-28
and Jun 10-11**. January precedes the window. Stated at **Medium**, not higher, because the
[12-18 ledger](boj-decision-2026-12-18.md)'s nimble-pace finding is live and a bank that has
abandoned a fixed cadence can move at any venue.

Second, **the January Outlook has a hard problem the siblings never faced, and it has a visible
tell.** The 8%→1% food consumption-tax cut takes effect **2027-04-01**, the first day of FY2027 —
the fiscal year this Outlook Report projects. The Bank's standing footnote strips *"the effects of
consumption tax **hikes**"*, wording written for 2014 and 2019. Either the convention is extended
to a cut and the FY2027 median stays roughly where October leaves it, or the drag is booked and
FY2027 prints visibly below FY2028 (+2.0% in the July Outlook). That is a binary a reader can check
in one line of a table, and it is registered rather than asserted.

Third, **the day itself is contested, and by a Japanese event.** Japan's December national CPI and
the **2026 yearly average** release on **2027-01-22**, hours before the decision — the only BoJ date
on this calendar sharing its day with Japan's CPI, per the Statistics Bureau's own schedule parsed
today. Nothing in that Tokyo session may be credited to the BoJ until the print is ruled out. As a
structural bonus, the same table shows **March 17-18 meets one day before the February CPI**, so
January is the best-informed 2027 venue on prices and March the worst.

Fourth, **the AI channel points at us, not from the BoJ to us.** The Bank's own July 2026 Outlook
names *"the rise in the prices of semiconductors and other items, reflecting the increase in
AI-related demand"* as a CPI driver and *"developments in AI-related demand"* as a named risk. The
siblings' "no price channel" conclusion survives in the direction they tested it; the sentence does
not. A strong AI capex cycle is, on the Bank's own account, **hawkish for the BoJ** — which is a
reading frame for the next pulse, not a trade.

Fifth, **the registered FX tests are under-specified, and this session can prove it rather than
argue it.** Re-run on the Fed's H.10 noon-ET fixing, 2026's decision-day moves are **-0.50% /
-0.81% / +0.15% / +0.12% / -0.19%** against the 12-18 ledger's Yahoo readings of **+0.03% / +0.57%
/ +0.12% / +0.12%** — two of four flip sign, one by 1.38pp — while the 60-session sd replicates at
**0.511%** vs **0.514%**. The distributional finding is solid; the day-level readings are a
timestamp artefact. Nothing registered is edited. This venue registers a **series-specified**
bracket test instead, and records that any future scoring of the ±2.0% family must name its series.

And it books three factual corrections to the siblings, all dated: `stat.go.jp` is **reachable**
(the 12-18 ledger's "access wall" note is wrong, and legs 1/5/6 depend on it); the July 2026 yen
event **did** clear ±2.0% on the Fed's fixing (**-2.68%**, 2026-07-30), where Yahoo split it into a
sub-threshold pair; and Japan's realised headline CPI was **+1.9% y/y in July 2026** with household
consumption at **-3.6%**, the first realised Japanese price datapoint in four BoJ ledgers, pointing
the opposite way from the PPI pipeline story. Estimates widen caution and license nothing.

**Kill switches:**

- **Date kill:** the BoJ moving the Jan 21-22 MPM, or the Statistics Bureau moving the 2027-01-22
  CPI release off that date. Breaks the header, voids leg 1 and all three registered tests.
  Re-check every pulse — the CPI schedule page's own last-update stamp is **2026-01-23**, so its
  far-forward rows are the more movable half.
- **Fiscal kill (the one that rewrites leg 2, leg 3 and FT-1):** the food consumption-tax cut being
  **withdrawn, deferred past 2027-04-01, or passed in materially different form** in the autumn
  Diet session. January reverts to an ordinary Outlook meeting and FT-1 voids. Score by
  **2026-10-31**, re-check every pulse.
- **Outlook-footnote kill (registered):** the **January 2027 Outlook Report's FY2027 core-CPI
  median falling ≥0.5pp below the October 2026 Outlook's FY2027 median with no footnote or
  "excluding" line naming the consumption-tax cut** — i.e. the Bank books the drag into its
  headline projection rather than extending its hikes-only convention. Registered as
  **FT-boj-decision-2027-01-22-1**, score by **2027-01-23**.
- **Carry kill (registered, series-specified):** **any single close-to-close move beyond ±2.0% in
  the 2027-01-20 → 2027-01-26 window** of the Federal Reserve H.10 noon-ET USD/JPY fixing (FRED
  series `DEXJPUS`). Registered as **FT-boj-decision-2027-01-22-2**, score by **2027-01-27**.
  Deliberately the bracket form, not the decision-day form: leg 9 measured that 3 of 5 2026
  brackets clear this threshold while no decision day exceeded 0.81%, so this is a coin-flip test
  rather than a near-certain pass.
- **Venue kill (registered):** the BoJ **raising the policy rate at the 2027-01-22 decision**.
  Registered as **FT-boj-decision-2027-01-22-3**, score by **2027-01-23**. Distinct from
  FT-boj-decision-2026-12-18-2, which tests a 1.25% *level* at the *December* venue and scores
  2026-12-19; this tests a *move* at *this* venue regardless of level.
- **Channel-direction kill:** the BoJ dropping semiconductors / AI-related demand from its named
  CPI drivers and risks in the **October 2026** Outlook Report. Leg 4 would be a July artefact
  rather than a standing feature of the reaction function. Score by **2026-11-07**.
- **Political kill:** the Takaichi government publicly pressing the BoJ *against* a move (reversing
  the 08-13 read), or a Cabinet reshuffle that replaces Finance Minister Katayama. Either direction
  re-weights the This-quarter call. Re-check every pulse; the reshuffle is mid-to-late September
  2026.
- **Channel kill:** a tracked name (NVDA/AVGO/MRVL/CRWV) moving **>2%** on any session **2026-09-05
  → 2027-01-21** that the tape attributes to a BoJ headline. Leg 12's "no price channel" claim
  would be false. Re-check every pulse.

Three forward tests registered in
[`forward-tests/boj-decision-2027-01-22.md`](../forward-tests/boj-decision-2027-01-22.md) — **-1**
(the Outlook's treatment of the tax cut), **-2** (the series-specified bracket FX null) and **-3**
(no hike at this venue). Four dated adjacent events proposed as `estimate` in the same PR:
[`japan-cpi-2027-01-22`](japan-cpi-2027-01-22.md),
[`japan-food-tax-cut-2027-04-01`](japan-food-tax-cut-2027-04-01.md),
[`boj-decision-2027-03-18`](boj-decision-2027-03-18.md) and
[`boj-decision-2027-04-28`](boj-decision-2027-04-28.md).

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-05 | D-139 | Initial research banked (above). **Three January-specific structures no sibling ledger has, all primary and parsed today.** (1) **Japan's December-2026 national CPI AND the 2026 yearly average release on 2027-01-22 itself** — stat.go.jp/english/data/cpi/1582.html, single table parsed cell-by-cell, row reads `["December","January 22, 2027","January, 2027","January 29, 2027","2026 yearly average of Japan"]`; 08:30 JST vs a midday-JST decision, so the board has it public before announcing, and the **01-22 Tokyo session carries two Japanese events**. Same table: **Mar 17-18 meets one day BEFORE the Feb CPI (2027-03-19)**, so January is the best-informed 2027 venue on prices and March the worst. (2) **Food consumption tax 8%→1% effective 2027-04-01**, the first day of **FY2027** — the year this Outlook projects; LDP-approved, **pending Diet passage** as of **2026-08-07** (News On Japan; corroborated vatcalc/Japan Today, "replaced in 2029 by a refundable tax credit"). Own arithmetic, weight unsourced: ~6.5% price cut on a 16-22% basket share ⇒ **~1.0-1.4pp** mechanical y/y CPI drag Apr-2027→Apr-2029. The BoJ's standing footnote strips *"the effects of consumption tax **hikes**"* — written for hikes, not cuts, so **January is where the bank shows its hand**; July-2026 Outlook FY2027 core median **+2.4%** (up from +2.3% in April), FY2028 **+2.0%**, so a booked drag would invert them visibly. (3) **The BoJ names our sector as a CPI driver** — July-2026 Outlook highlights, verbatim primary: CPI *"clearly above 2 percent from the second half of fiscal 2026, affected by the rise in the prices of **semiconductors and other items, reflecting the increase in AI-related demand**"*, with *"developments in AI-related demand"* a named risk. The channel exists and runs **our names → Japanese CPI → BoJ**, the opposite of the direction all three siblings dismissed; not tradable, but a strong AI capex cycle is hawkish for the BoJ. **Methodological finding — the registered ±2.0% FX tests are under-specified.** Re-ran the 12-18 ledger's study on an INDEPENDENT primary series, the Fed H.10 noon-ET fixing (FRED `DEXJPUS`, 13,951 bars): 2026 decision days **-0.50% / -0.81% / +0.15% / +0.12% / -0.19%** vs its Yahoo **+0.03% / +0.57% / +0.12% / +0.12%** — **two of four flip sign, one by 1.38pp** — while the 60-session sd replicates (**0.511%** vs 0.514%) and the tail counts hold (≥2.0%: 3/166 in 2026, 2/250 in 2025, 5/251 in 2024). Distribution solid, day-level readings a timestamp artefact; nothing registered is edited, and this venue registers a series-specified test instead. **Bracket power confirmed, one premise corrected:** D-1→D+2 max moves were **-2.34%** (01-26), -0.81%, **-2.23%** (04-30), +0.72%, **-2.68%** (07-30) — **3 of 5 clear ±2.0% while no decision day exceeded 0.81%**, vindicating FT-boj-decision-2026-12-18-3's design; but on this series the **July 2026 event DID clear ±2.0% in a single session**, where Yahoo split it into -1.91%/-1.62%. **Venue structure, first full parse of the BoJ's 2027 table:** Jan 21-22 (Outlook) · Mar 17-18 · Apr 27-28 (Outlook) · Jun 10-11 · Jul 21-22 (Outlook) · Sep 21-22 · Oct 28-29 (Outlook) · Dec 16-17 — so Reuters' **70% of 52** for ≥1.50% **in Q2 2027** (07-23) has exactly **two** venues, **Apr 28 and Jun 11**, and **January precedes the window**. Adjacency sweep: **peers** — none, `symbols: []`. **Macro** — realised **Japan CPI +1.9% y/y (July 2026)**, unemployment 2.4%, household consumption **-3.6%** (Statistics Bureau front page, read today) — the first realised Japanese print in four BoJ ledgers, and it is below target, cutting against the PPI-pipeline story (caveat: all-items, core not isolable, the detailed page 404s). Japan's CPI **rebased 2020→2025 base on 2026-08-21** with rates of change spliced not recomputed, 2020-base parallel publication ends **December 2026** — January 2027 is the first MPM on the new base only. **Volatility** — VIX **14.32** (2026-09-03, CBOE via FRED). **Geopolitical** — Bloomberg **2026-08-13**: *"Japan's Government Is Said to Support Faster BOJ Rate Hike"* (headline + syndication only; bloomberg.com 403s), which **partly overtakes the 12-18 ledger's 59%-Takaichi-as-deterrent leg**; Ueda **2026-09-02** after the G20, with FinMin **Katayama**: *"we need to pay greater attention than before to upside risks in our policy conduct"*, hinting at a 09-17/18 hike; Japan Times ~**2026-09-05**: *"Takaichi seen retaining foreign and finance ministers"* — reshuffle looks like MOF continuity. **Event tape** — **the corridor is nearly empty and that is a LIMIT, not a finding**: one tracked event within ±5 days (`fomc-2027-01-27`, est, high) vs 10/14/28 for the 2026 BoJ dates, because this calendar thins past 2026, not because January is quiet. **Four dated adjacencies proposed as `estimate`:** `japan-cpi-2027-01-22` (same day), `japan-food-tax-cut-2027-04-01`, `boj-decision-2027-03-18` (next venue, worst-informed on CPI / best on shunto) and `boj-decision-2027-04-28` (Outlook, first meeting after the cut). **Corrections to sibling limits:** `stat.go.jp` is **reachable** — the 12-18 ledger's "access wall" note is wrong and legs 1/5/6 rest on it; `rateprobability.com` is a **Cloudflare JS challenge**, not a plain 403, so a headless browser is the tool, not another curl. **Own weaknesses:** BoJ Outlook PDFs resisted local extraction, so the projection medians and the tax footnote are press-/search-cited not read verbatim; Yahoo 429'd this runner entirely (hence FRED, which is why legs 8-9 exist); `DEXJPUS` lags, last bar **2026-08-28**, so the 12-18 ledger's 09-03 -2.05% could not be cross-checked; the CPI-drag weight is unsourced; and this is D-139 with three decisions in front. | — (stance set: stand aside, no position, no play; **January is the venue the consensus skips** — Q2 2027 has two venues and this is not one — at **Medium**, because the nimble-pace finding means a fixed cadence can no longer be assumed; four commitments — check the **FY2027 median and its footnote** first when the Outlook lands, rule out **Japan's own same-day CPI** before crediting the BoJ with anything in the 01-22 session, read a strong AI capex cycle as **hawkish for the BoJ** rather than as no-channel, and **name the series** in any future scoring of the ±2.0% FX family) | 2026-09-26 (medium, 31+d band: every 21d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new `src/domain/market-events/<id>.json`
(`status: "estimate"`) in the same PR. Close-out fills `## Outcome` below from re-run instrument
data (cache busted first), never from memory — after which this doc goes quiet.
