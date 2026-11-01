# Conference Board Consumer Confidence (Oct 2026) — consumer-confidence-2026-10-27

**Kind:** macro-print · **Date:** 2026-10-27 (confirmed, CB: conference-board.org/topics/consumer-confidence — its own page states verbatim "The next release is Tuesday, October 27th at 10 AM ET.", fetched direct 2026-10-18; was estimate, cadence-derived, until then) · **Impact:** medium
**Last assessed:** 2026-08-29
<!-- probe-ref: {"symbols":{},"vix":14.51,"daysBand":"medium:31+","adjacentIds":["aapl-2026-10-29-print","amzn-2026-10-29-print","fomc-2026-10-28","gdp-q3-2026-advance-2026-10-29","goog-2026-10-28-print","meta-2026-10-28-print","msft-2026-10-27-print","pce-2026-10-29"],"screenStreak":0} -->

## At a glance

**TL;DR.** **The date is now primary-confirmed, and the print arrives into a worse backdrop than
it was filed under.** The Conference Board's own page states verbatim *"The next release is
Tuesday, October 27th at 10 AM ET."* (fetched direct 2026-10-18), closing the one open source gap.
The **09-29 print fell to 81.9 from 88.6** (consensus ~89.2, search-relayed): Present Situation
**109.3 (−7.9)**, Expectations **63.6 (−5.9, third straight decline)**, survey window Sep 1–23.
UMich's October prelim was **46.3** vs 47.8 expected. The Fed corridor flipped back the other way:
the **10-28 FOMC is now hold-modal (~87%)** after a hot CPI, per
[`fomc-2026-10-28`](fomc-2026-10-28.md), while equities sold off (**S&P −1.09%, VIX 19.99** on
10-16). None of it is a trade: `symbols: []`, no house playbook is macro-keyed, and the standing
instruction for Oct 27–30 is still **flat into it**.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-9) | Stand aside | High | `symbols: []`; no macro-keyed playbook; no October consensus exists or is publishable in advance. | A primary Conference Board notice moving the 10-27 release before 10-27 |
| This week | Watch **UMich's final (10-23)** and **Dallas Fed (10-26)**; no action | Medium | The only two consumer-adjacent reads before the print; the UMich prelim (46.3) already fell below consensus. | UMich final revising 46.3 above ~50 (read-through weakens) |
| This month | **Expectations stays below 68.2** on 10-27; headline lands under 90 | Low | Gasoline-driven price complaints hit new highs in September, Brent is **$109.86** (10-16), and the survey window likely overlaps the 10-16 selloff; no consensus to calibrate against. | The **10-27** release printing Expectations above 68.2 |
| This quarter | **Flat into Oct 27–30** — unchanged discipline | High | Four-session corridor of the FOMC, GDP, PCE, ECI and mega-cap prints; a second-tier survey is the weakest reason to hold a position through it. | Hike odds for 10-28 back above 40% before the meeting, or a corridor print date moving off Oct 27–30 |

**Signals & conditions** — the buy/sell/hold triggers:

- **Two watch triggers fired on the 09-29 print; one stayed shut.** Expectations **63.6 < 68.2** and
  Present Situation **gave back 7.9** (more than August's +6.8) — both fired. Expectations
  **< ~62** (escalate early) did not: it sits 1.6 points above. Details in the 2026-10-18 row.
- **Never a trade on this print.** `symbols: []`, no house playbook is macro-keyed, and the 08-25
  release missed at a seven-month low while the S&P closed **+0.3%** on unrelated drivers.
- **The blackout branch is dead — kill switch fired.** CR signed **2026-09-02** (PL 119-103, funds
  through 12-11), 28 days before the 09-30 cliff. The labor-differential proxy, the
  first-panel-inside-a-shutdown framing and the political-salience-in-a-blackout angle all retire
  with it — see the Stance update below.
- **What replaces it: this print now reads into a live, hike-priced FOMC, not a resolved one.**
  October-meeting odds climbed 54.2% (09-23) → 61.6% (09-25) → 65% (09-27), per
  `fomc-2026-10-28`'s own same-day pulse. S2/E1 still forbids sizing off a sentiment survey ahead of
  that decision — this raises the stakes of the window, not the license to act in it.
- **Expectations below 68.2** → the forward-looking leg is still deteriorating into the midterms;
  tightens caution on AMZN/AAPL discretionary exposure, both printing on **10-29**.
- **Present Situation giving back August's +6.8** → the divergence resolves *downward*, which is the
  more consequential read one week before the **11-03** midterms.
- **Do not spend sessions hunting a consensus.** Withheld under Conference Board publication
  restrictions — structural, established by the sibling, not a research failure.
- **Watch (dated):** CB print **09-29** · jobs **10-02** · CPI **10-14** · **MSFT print 10-27**
  (estimate) · **this release 10-27** (estimate) · **FOMC 10-28** (confirmed, hike-modal ~65%) +
  GOOG/META prints · **Q3 advance GDP + Sep PCE 10-29** (confirmed) + AMZN/AAPL prints · **ECI
  10-30** (confirmed) · **midterms 11-03** (estimate).

## Initial research

### The question, plainly

What is the October Conference Board Consumer Confidence print actually for, given that its own
calendar entry was created on the argument that it "matters disproportionately in one branch"; is
that argument true when checked against the 2025 shutdown rather than asserted; is 2026-10-27 the
right date; and what — if anything — should a paper book holding NVDA MRVL AVGO CRWV MSFT GOOG META
AAPL AMZN do about a survey that publishes on the opening morning of a two-day FOMC?

**One-line verdict:** the inherited claim survives contact with the 2025 precedent but comes back
*narrower and better sourced* — the Consumer Confidence Survey genuinely publishes through a lapse
while the Board's federally-fed indices do not, so a shutdown promotes this print; but it is not the
only surviving consumer read, its measured tape impact is nil, and it sits inside a 72-hour window
whose risk is entirely earnings and Fed, not survey.

### Method

Macro-print mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — `symbols: []`, so no
symbol-keyed instrument applies, `earnings-cycle.mjs` / `intraday-edges.mjs` were not run and the
cache-busting rule has no target. **Three primaries fetched directly today:**
`conference-board.org/topics/consumer-confidence` (the release-cadence line and the latest index
values), `conference-board.org/topics/us-leading-indicators` (to test whether the 2025 shutdown
banner is real and which indices it named), and **`bea.gov/news/schedule`** — which produced the two
new confirmed calendar entries in this PR. The 2025 shutdown precedent is press-sourced via search
(Forbes 2025-10-28, CNBC 2025-11-25, Conference Board release language); the Forbes article itself
returns **HTTP 403** to a direct fetch, so its figures are carried at search-snippet fidelity and
labelled as such in leg 3. Political context is one dated secondary (Newsweek, 2026-08-25/26).
Market readings are live Yahoo daily closes for **2026-08-27**: VIX **14.51**, Brent (BZ=F)
**$89.70**, S&P 500 **7,730.99**. The September sibling
([`consumer-confidence-2026-09-29`](consumer-confidence-2026-09-29.md)), the funding-deadline doc
([`government-funding-deadline-2026-09-30`](government-funding-deadline-2026-09-30.md)) and the FOMC
doc ([`fomc-2026-10-28`](fomc-2026-10-28.md)) are read as inputs and cited, never silently restated.
Every figure is dated in-line.

### Conviction legs, tested

1. **The date is right by arithmetic but stays `estimate` — SUPPORTED, and deliberately not
   upgraded.** `conference-board.org/topics/consumer-confidence` was fetched today and states
   verbatim: **"The Conference Board publishes the Consumer Confidence Index® at 10 a.m. ET on the
   last Tuesday of every month."** October 2026's last Tuesday is **10-27** (10-31 is a Saturday;
   confirmed by date arithmetic, not by eye). But the page's explicit next-release line names
   **September 29** only — there is no fetched primary line for the October date, and the
   last-Tuesday rule is a *policy statement*, not a schedule entry. The sibling flipped 09-29 to
   `confirmed` because the page named that date verbatim; the same discipline says this one stays
   **`estimate`**, and the calendar entry's `EST:` source already says so honestly. This is the
   distinction the lane's no-self-confirm limit exists to protect — a rule plus arithmetic is not a
   primary source, however confident the arithmetic.

2. **The Conference Board's *survey* publishes through a shutdown; its *federally-fed indices* do
   not — SUPPORTED, and this is the leg that rescues the inherited claim by narrowing it.** The
   sibling's leg 8 asserted "the Conference Board is a private publisher; it survives a lapse." The
   2025 lapse (**Oct 1 – Nov 12, 2025**) tests it precisely, and the answer splits. The **Consumer
   Confidence Index published on schedule throughout** — the 2025-10-28 release landed mid-shutdown
   and the 2025-11-25 release landed after it. But the Board simultaneously carried a notice that
   *"all further releases for The Conference Board Employment Trends Index™ (ETI), The Conference
   Board-Lightcast Help Wanted OnLine® Index (HWOL Index), The Conference Board Leading Economic
   Index® of the US (US LEI) and The Conference Board Global Leading Economic Index® (Global LEI)
   data may be delayed."* The mechanism is clean: the CCI is **directly collected** from a household
   panel, while the LEI is a **composite of federal series** — private *publisher* is not the same
   thing as private *inputs*. That banner is gone from the LEI page today (fetched 2026-08-29; latest
   LEI **+0.2% in July 2026 to 99.5**, updated 2026-08-20), which is itself the evidence it was a
   shutdown-specific notice. **Conclusion:** the inherited claim holds *for this print specifically*,
   for a better-understood reason than the one it was filed with.

3. **A shutdown is visible IN the survey, not just around it — SUPPORTED, at snippet fidelity.**
   The 2025-10-28 print fell to **94.6** from **95.6**, its lowest since April, against a consensus
   of **94.2**, and the Board named the **government shutdown a "key concern"** in the release. More
   useful for October 2026: the Board reported that **responses collected after the shutdown ended
   were more positive than those collected during the impasse** — a within-sample effect, which is
   exactly what makes the survey *window* the thing to read rather than the headline. **Sourcing
   caveat, on the record:** the Forbes article carrying these figures returns HTTP 403 to a direct
   fetch, so leg 3 rests on search snippets of it plus CNBC's 2025-11-25 follow-up, not on a primary
   Conference Board release. Any October 2026 comparison to 2025 must re-verify these numbers first.

4. **October 2026's survey would be the first panel conducted *entirely* inside a lapse — SUPPORTED
   as a conditional.** Recent cut-off dates run **Jun 23 · Jul 22 · Aug 16** (sibling leg 2, primary
   sourced), i.e. mid-to-late month and varying by a full week. A lapse beginning **10-01** therefore
   brackets the whole plausible October window — unlike 2025's October print, whose panel opened
   before the Oct 1 lapse and caught only part of it. That is the sharpest thing this doc can say:
   in the lapse branch, October 2026's is a **clean** shutdown reading where 2025's was a mixed one.
   **The conditional matters both ways** — no lapse, no effect, and the cut-off is not published in
   advance, so even the lapse branch cannot be sized in advance.

5. **The Board is not the *only* surviving consumer read — MIXED, and it corrects the inherited
   framing.** The sibling wrote that in a blackout the CB print becomes "one of the few
   forward-looking consumer reads that survives." True but softer than it sounds: **University of
   Michigan sentiment is also private**, prints twice a month (preliminary and final), and survives a
   lapse identically — and it fell to **51 from 55.2** in August (recorded in this repo's own
   calendar notes at `market-events-data.ts`). ADP is private too. This calendar **deliberately
   omits** UMich as low-impact — `market-events-data.ts` says so verbatim: *"second-order surveys
   (Michigan sentiment, durable goods) and weekly jobless claims are deliberately omitted as
   low-impact"* — which is a defensible curation choice but does not make UMich stop existing in a
   blackout. **The honest statement is "one of several private consumer reads that survive," not
   "one of the few."** Recorded here rather than by editing the sibling, whose rows are append-only.

6. **The corridor is this quarter's densest, and this print is its quietest member — SUPPORTED.**
   Within 72 hours of 10-27: **MSFT** prints 10-27 (estimate), the **FOMC statement** lands 10-28
   14:00 ET (confirmed, **no SEP**) with **GOOG** and **META** the same day, **AMZN** and **AAPL**
   print 10-29 (estimate), and — established today from bea.gov and added to the calendar in this PR
   — **Q3 advance GDP** and **September PCE** both release 10-29 08:30 ET (confirmed). The
   [`fomc-2026-10-28`](fomc-2026-10-28.md) doc already names Oct 27–29 a single compound-variance
   window whose answer is S2/E1 — flat each print by its own D-1. This survey adds nothing to that
   risk and takes nothing from it. **The one structural note worth carrying:** this print publishes
   **10:00 ET on the opening day of the two-day meeting**, so it reaches the committee's table; PCE
   and GDP, publishing 10-29, **do not** — the Fed decides without them either way, lapse or no.

7. **The base rate says this print does not move the tape — SUPPORTED, inherited, twice scored.**
   The 2026-08-25 release hit a seven-month low **and missed consensus**; the tape closed **S&P
   +0.3% (7,675.54), Nasdaq +0.7%, Dow +0.3%** on falling yields and easing oil, with no
   AMZN/AAPL-specific reaction findable. That is two consecutive misses with muted reactions (July,
   August) against one 2026 counterexample in a *different* survey (the March UMich collapse). **The
   blackout branch is the only mechanism that would change this**, and it changes attention, not the
   historical elasticity — it should be treated as a hypothesis to be scored on 10-27, not a
   forecast.

8. **The political-salience angle is real but must not be over-read — MIXED.** 10-27 is the **last
   Conference Board consumer print before the 11-03 midterms**, seven days out, and its October panel
   runs through the campaign's closing weeks. The dated context is unfavourable for the incumbent
   party: as of 2026-08-25/26, Trump's approval reads **36/57** (YouGov/Economist, fielded Aug
   21–24), **33/65** (Reuters/Ipsos), **40/59** (Echelon Insights, Aug 13–17) and **43/54** (Morning
   Consult, Aug 14–17), and *"economic concerns have hovered over the midterms."* **What this doc
   refuses to do** is convert that into a seat forecast: a search surfaced an aggregator claim that
   *"consumer confidence below 80 has historically correlated with significant incumbent-party
   losses"* alongside a figure of **"57 in spring 2026"** that contradicts this calendar's own
   primary-sourced series (89.4 August, 90.2 July). That figure is **discarded as unverified
   aggregator output**, and with it the correlation claim it was bundled with. The salience is
   recorded; the election model is not built.

9. **Tracked-name sensitivity — thin, but less thin than September's — SUPPORTED.** `symbols: []`,
   and only **AAPL** (discretionary device demand) and **AMZN** (e-commerce volumes) carry direct
   consumer exposure; the other seven feel this only through the shared rate-path channel. What is
   genuinely different from the September print: **both of those names report on 10-29**, 48 hours
   after this survey. So the survey's discretionary-spending line is, for the first time in this
   series, a **published prior on two prints in the same window** — August's noted anticipated
   discretionary spending *"pared back."* **This is a reading aid, not a signal.** Sizing off a
   sentiment survey ahead of an earnings print is exactly what the E1/S2 discipline forbids, and
   nothing here changes the instruction to be flat into 10-29.

### What the conditions support

A **branch, a reading order, and a refusal.** The branch: watch the House CR vote in early September
and re-file this doc's importance the moment it resolves — everything distinctive here is downstream
of it, and that resolution is knowable ~4 weeks before the event. The reading order (inherited,
still right): the **gap** first, **inflation expectations** against the energy path second (Brent
**$89.70** on 08-27, still in the de-escalation the sibling documented), the **headline** last. Two
things this doc adds: in the lapse branch, read the **labor differential** as the closest surviving
proxy for the deleted 10-02 payrolls — that is the subcomponent the market will reach for when BLS
is dark; and read the **discretionary-spending line** as a prior on AMZN/AAPL's 10-29 prints without
trading it. The refusal is the load-bearing part: **the Oct 27–29 window is to be flat into**, per
[`fomc-2026-10-28`](fomc-2026-10-28.md), and a second-tier survey landing inside it is the weakest
imaginable reason to be positioned there.

### Honest limits

**Almost every distinctive claim here is conditional on an unresolved vote**, and the funding-deadline
sibling's own base case is that the CR passes — so the modal outcome is that this doc's central leg
collapses and 10-27 is routine. Leg 3's 2025 figures are **search-snippet fidelity** (Forbes 403s),
not primary, and must be re-verified before any 2026-vs-2025 comparison is drawn. Leg 4 is a
conditional on a cut-off date that is **not published in advance** and has moved a full week across
three months. No October consensus exists and structurally will not (Conference Board publication
restrictions), so there is no measurable surprise gap to trade against — every forward statement is
trend extrapolation from a three-month sample whose two subcomponents moved in opposite directions in
August. The MSFT/GOOG/META/AMZN/AAPL print dates in the corridor are all **`estimate`** (8-K cadence),
so the compound-window framing is itself estimate-grade. And one judgement call worth naming: this PR
files **two new `confirmed` entries** (Q3 advance GDP, September PCE) off a primary bea.gov fetch,
using the `BEA:` prefix the calendar's own source-prefix table sanctions — but the lane's adjacency
rule reads "always `status: estimate`," and the `midterm-elections-2026-11-03` entry took the stricter
reading. If the stricter reading is intended, that is a two-line revert; the dates and the fetch date
are recorded either way.

## Stance & kill switches

**Stance (date estimate, cadence-derived; not primary-verified for October).** Treat 2026-10-27 10:00
ET as a **conditionally-promoted second-tier print**: routine in the CR-signed branch, and in the
lapse branch a genuinely useful read — the first CB panel run entirely inside a shutdown, published
on the opening morning of a no-SEP FOMC, when the 10-02 payrolls, the 10-14 CPI and the 10-29
GDP/PCE have all been deleted. **In neither branch is it a trade.** No position is opened, closed or
sized off it, and the standing instruction for the window it sits in is the FOMC doc's: **flat into
Oct 27–29**, each tracked print by its own D-1. Base case for the print itself (**Low** confidence —
no consensus exists or will): the headline stays in the high-80s and the **gap** does the moving,
with convergence more likely from the *Present Situation* side. This ledger inherits the sibling's
recession-odds watch (Expectations sub-70, below the Board's own 80.0 threshold since February 2025)
and adds the blackout-branch labor-differential read.

**Kill switches:**

- **A CR is signed before 2026-09-30** — the blackout branch dies, legs 2/3/4 become historical
  trivia, and this print reverts to routine. *The single most likely kill, per the funding sibling's
  own base case.*
- **The Conference Board announces a delay or schedule change for the October release** — leg 2's
  "the survey publishes through a lapse" fails on contact with 2026 rather than 2025, and the whole
  promoted-read framing goes with it.
- **A primary Conference Board line naming 2026-10-27 appears** — flip the calendar entry
  `estimate` → `confirmed` with the `CB:` prefix, exactly as the sibling did for 09-29.
- **The October survey cut-off is published and falls before 10-01** — leg 4's "entirely inside a
  lapse" conditional fails outright.
- **Expectations back above 80** — the recession-signal threshold breached since February 2025
  clears; the inherited watch closes and the late-cycle framing dies.
- **Expectations below ~62** — deterioration is accelerating rather than grinding; escalate ahead
  of schedule rather than waiting for the next banded pulse.
- **The 09-29 print moves both subcomponents the same direction** — the divergence framing this
  doc inherits retires, and October becomes an ordinary headline read.
- **Any IR-confirmed print date moves off Oct 27–29** — the compound-window framing in leg 6
  decompresses, and the "quietest thing in the loudest window" line stops being true.
- **This print visibly moves the tape on 10-27 (S&P ≥0.5% attributable to it)** — leg 7's base rate
  breaks, and the blackout-attention hypothesis scores as SUPPORTED rather than untested.

**Stance update — 2026-09-27 (D-30): the first kill switch fired; the blackout branch is dead.**
H.R. 6500 was signed **2026-09-02** as **Public Law 119-103** (`government-funding-deadline-2026-09-30`,
its own 09-05 row), funding agencies through **2026-12-11** — 28 days clear of the 09-30 cliff this
doc's kill switch named. **Scored against the initial legs:** leg 2 (survey-survives-a-lapse) and leg 3
(shutdown visible in-survey) retire as untested this cycle — there is no lapse to test them against.
Leg 4 (first-panel-entirely-inside-a-lapse) cannot occur. Leg 8's political-salience-in-a-blackout
framing loses its blackout. **What survives unchanged:** leg 5 (the Board is one of several surviving
consumer reads, not "one of the few"), leg 6's corridor-density finding (still the densest 72-hour
stretch this calendar tracks, per `fomc-2026-10-28`), leg 7's base rate (this print does not move the
tape), and leg 9 (thin AAPL/AMZN sensitivity, both printing 10-29). **What's new since initial
research and not in the original legs:** the FOMC leg of the corridor re-priced from an
already-resolved hike (hold-modal read at initial research) to a **live, hike-favored decision
(~65%, Polymarket + centralbank.watch, both fetched direct this week)** — the corridor's risk
composition shifted, not its dates. Action is unchanged and always was **none** — `symbols: []`, no
position, no hedge, no sizing change. The stance that carries forward: this print is now routine
information ahead of a decision that is no longer routine.

**Stance update — 2026-10-18 (D-9): the date is confirmed and the divergence framing retires; action is
unchanged.** The Conference Board's own page now names 10-27 (flipped `estimate` → `confirmed`, `CB:`),
the primary line kill switch 3 asked for. Kill switch 7 also fired: the 09-29 print moved **both**
subcomponents the same direction (Present Situation −7.9, Expectations −5.9), so the divergence framing
this doc inherited from August is retired — October is an ordinary headline read. Action is still none
(`symbols: []`, no position, no hedge); the FOMC leg reverted from hike-modal to hold-modal, which
changes the corridor's risk mix, not its dates or the flat-into-it instruction.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-08-29 | D-59 | Initial research banked (above). **Date stays `estimate`, deliberately:** conference-board.org was fetched today and states verbatim *"The Conference Board publishes the Consumer Confidence Index® at 10 a.m. ET on the last Tuesday of every month"*; 10-27 is that Tuesday (10-31 is a Saturday, checked by arithmetic) — but the page's explicit next-release line names **09-29 only**, so a rule-plus-arithmetic derivation is not the primary line the sibling had when it flipped 09-29 to `confirmed`. **The inherited claim was tested against 2025 and came back narrower:** through the **Oct 1 – Nov 12 2025** lapse the **Consumer Confidence Index published on schedule** (10-28-2025 and 11-25-2025 releases both landed) while the Board carried a notice that *"all further releases for The Conference Board Employment Trends Index™ (ETI), The Conference Board-Lightcast Help Wanted OnLine® Index (HWOL Index), The Conference Board Leading Economic Index® of the US (US LEI) and The Conference Board Global Leading Economic Index® (Global LEI) data may be delayed"* — the CCI is directly collected, the LEI is a composite of federal series; private *publisher* ≠ private *inputs*. That banner is absent from the LEI page today (fetched 2026-08-29; LEI **+0.2% in July 2026 to 99.5**, updated 08-20), evidence it was shutdown-specific. **2025 in-survey effect:** the 10-28-2025 print fell **95.6 → 94.6** (lowest since April) vs consensus **94.2** with the shutdown named a "key concern," and the Board reported **responses collected after the shutdown ended were more positive than those collected during it** — a within-sample effect, so the *window* is the thing to read. Sourcing caveat recorded: the Forbes article carrying those figures **403s** on direct fetch; snippet fidelity only, re-verify before any 2026-vs-2025 comparison. **The sharpest new finding:** with cut-offs running **Jun 23 · Jul 22 · Aug 16**, a lapse beginning 10-01 brackets the entire plausible October window — October 2026's would be the **first CB panel conducted entirely inside a shutdown**, where 2025's October panel opened before the lapse and caught only part of it. **Inherited framing corrected:** the sibling's "one of the few forward-looking consumer reads that survives" overstates it — **UMich is private too**, prints twice monthly, survives identically, and fell to **51 from 55.2** in August; ADP likewise. This calendar omits UMich by explicit choice (`market-events-data.ts`: *"second-order surveys (Michigan sentiment, durable goods) and weekly jobless claims are deliberately omitted as low-impact"*), which does not make it stop existing in a blackout. Honest wording is "one of several." Sibling not edited (rows append-only). Adjacency sweep — **peers:** n/a, `symbols: []`. **Macro surprises:** none new since the sibling's row; Warsh 08-28 (forward guidance abolished, Sep hike odds 35.5% → 59.5%, October pinned ~50%) carried from [`fomc-2026-10-28`](fomc-2026-10-28.md), not re-derived. **Volatility regime:** VIX **14.51** (Yahoo daily close, 2026-08-27) — baseline set, nothing to diff against yet; unchanged from the sibling's reading and at the 2026 low. **Geopolitical:** Brent (BZ=F) **$89.70** on 08-27, S&P 500 **7,730.99** — the de-escalation the sibling documented (~$94 → ~$88 on the Iran–Oman framework and Gulf exports back to 15–16 mb/d) is intact, not reversed. **Event tape:** no October consensus and none publishable in advance (Conference Board publication restrictions — structural, established by the sibling, not re-spent here). **Political salience recorded, not modelled:** 10-27 is the last CB print before the **11-03** midterms; approval as of 08-25/26 reads 36/57 YouGov-Economist (Aug 21–24), 33/65 Reuters-Ipsos, 40/59 Echelon (Aug 13–17), 43/54 Morning Consult (Aug 14–17). An aggregator claim pairing "confidence below 80 → incumbent-party losses" with a figure of **"57 in spring 2026"** contradicts this calendar's own primary series (89.4 Aug / 90.2 Jul) and is **discarded as unverified**, along with the correlation it was bundled with. **New dated adjacencies found → added in this PR, `confirmed` off a primary bea.gov/news/schedule fetch today (`BEA:`, the prefix the calendar's own table sanctions):** **`gdp-q3-2026-advance-2026-10-29`** and **`pce-2026-10-29`**, both 08:30 ET — quoted verbatim from the schedule as *"October 29"* / *"GDP (Advance Estimate), 3rd Quarter 2026"* and *"Personal Income and Outlays, September 2026"*. Both are federal and die in the lapse branch alongside jobs 10-02 and CPI 10-14; both publish the morning **after** the 10-28 statement, so the committee decides without them. Judgement call flagged in Honest limits: the lane's adjacency rule says "always estimate," and `midterm-elections-2026-11-03` took that stricter reading — a two-line revert if intended. **Corridor as it now stands:** MSFT 10-27 (est) · **this print 10-27** (est) · FOMC 10-28 (confirmed, no SEP) + GOOG/META (est) · GDP + PCE 10-29 (confirmed) + AMZN/AAPL (est) · midterms 11-03 (est) — the densest 72 hours this calendar tracks, and per [`fomc-2026-10-28`](fomc-2026-10-28.md) the answer is S2/E1: flat into it. | — (stance set) | 2026-09-19 (medium, ≥31d band: every 21d) |
| 2026-09-27 | D-30 | **The load-bearing kill switch fired — read that first.** H.R. 6500 was signed **2026-09-02** as **Public Law 119-103** (own source: `government-funding-deadline-2026-09-30`'s 09-05 row, itself sourced to clerk.house.gov roll call 286, whitehouse.gov's signing statement, and govinfo's `BILLS-119hr6500eas`), funding agencies through **2026-12-11** — well clear of the 09-30 cliff. **This retires the entire blackout premise this doc was filed on**: no first-panel-inside-a-lapse read, no labor-differential proxy, no blackout-flavored political-salience angle; jobs 10-02 and CPI 10-14 print normally. Recorded here rather than by editing the initial legs, which stay as history (Stance section carries the full scoring). **Macro surprises — the corridor's other leg moved instead.** The Fed hiked **25bp to 3.75–4.00%** on **09-16** (unanimous 12–0, first hike in three years; September SEP median **4.1%**, up from June's 3.8%). With September resolved, `fomc-2026-10-28`'s own 09-27 pulse finds the first market read on the **October meeting's own conditional**: Polymarket **65% hike / 34% hold** on a **$14.9M** book (fetched direct today, 2026-09-27) and centralbank.watch/CME **61.6%/38.4%** (fetched direct 2026-09-25), climbing from a secondary-sourced **54.2%** just four days earlier (phemex, 09-23) — base case moves from hold-modal to **hike-modal**. Carried from the FOMC doc, not re-derived. **Volatility regime:** VIX **14.87** (Yahoo daily close, 2026-09-25 — the last trading day before this Sunday pulse) vs **14.51** at initial research (08-27): **+0.36**, well inside the 3-point materiality threshold: no regime shift. **Geopolitical:** Brent round-tripped through a **$107.63** cycle peak (09-10) and an Iran-strike spike to **~$108** (09-15) before easing; the `unsc-iran-panel-mandate-expiry-2026-09-26` close-out (09-22 read) puts Hormuz throughput at a **six-month high** with the renewal vote failed **11–2–2** and no new escalation — de-escalating, not reversing, and not attributable to this print. **Cadence band transition:** `medium:31+` → **`medium:8+`** (interval 21d → 7d) as days-out crossed 31 — itself a materiality trigger, consistent with this being the first full pulse since initial research. **Adjacency sweep — structural:** re-verified via `node scripts/event-scan.mjs --on-date=2026-10-27` (12 entries, all already tracked, nothing new) and cross-referenced against `fomc-2026-10-28`'s own same-day corridor sweep (48 ids, zero adds since 09-20). **No new dated adjacency to propose** — every id this sweep touched is already canonical. **Event tape:** no October consensus and none publishable in advance (Conference Board publication restrictions, structural, unchanged). Probe-ref refreshed to today's readings (screenStreak reset to 0 — a full session is never itself a screen). | **YES — the blackout branch dies; the FOMC leg it sits beside gets more dangerous, not less.** See the Stance update above (receipt: this row). Kill switch 1 fired (CR signed 09-02, PL 119-103, funds through 12-11); every leg conditional on a lapse retires. What's new instead: the 10-28 FOMC repriced hold-modal → hike-modal (~65%), so the corridor's risk composition shifted without its dates moving. Action unchanged and always none — `symbols: []`, no position, no hedge, no sizing change. | 2026-10-04 (medium, 8–20d band: every 7d) |
| 2026-10-04 | D-23 | **Deterministic screen (no Claude session).** Readings — VIX 15.3 (+0.4pt since last), band unchanged (medium:8+), 47 adjacent event(s) tracked, new in corridor since last pulse: `jgb-liquidity-enhancement-5-11y-2026-10-22`, `msft-def14a-2026-10-22`, `treasury-5y-tips-2026-10-22`, `treasury-coupon-announcement-2026-10-22` (recorded, not assessed). Nothing tracked crossed its threshold. | — (screen; no assessment made) | 2026-10-11 |
| 2026-10-11 | D-16 | **Deterministic screen (no Claude session).** Readings — VIX 14.8 (-0.5pt since last), band unchanged (medium:8+), 49 adjacent event(s) tracked, new in corridor since last pulse: `boe-dmp-2026-10-30`, `umich-sentiment-final-2026-10-23` (recorded, not assessed). Nothing tracked crossed its threshold. | — (screen; no assessment made) | 2026-10-18 |
| 2026-10-18 | D-9 | **Full session — `vix-regime-change` (VIX 14.84 → 19.99, +5.15) made it material; the date is now confirmed.** **Primary source (the headline):** conference-board.org/topics/consumer-confidence fetched direct today (plain curl, desktop user-agent, HTTP 200, 333,636 bytes) states verbatim *"The next release is Tuesday, October 27th at 10 AM ET."* — kill switch 3 fired; calendar entry flipped `estimate` → `confirmed` with a `CB:` source (this event's own file only). **September print (09-29), same page plus advisorperspectives, search-relayed:** headline **81.9** vs 88.6 (−6.7; consensus ~89.2), Present Situation **109.3** (−7.9; current business conditions negative for the first time since Sep 2024), Expectations **63.6** (−5.9, third straight decline, below 80 since Feb 2025), 12-month inflation expectations **6.1% average / 5.1% median**, survey window **Sep 1–23**. Kill switch 7 fired (both subcomponents down together, divergence framing retires); Expectations < 68.2 and Present Situation giving back 7.9 fired; Expectations < ~62 did not (1.6 above). The 6.1% average is above the 5.8% line registered by the sibling's own forward test — scoring it is that event's close-out, not this row. **Peers:** none, `symbols: []`. **Macro surprises:** September CPI (10-14) headline +0.6% m/m / 3.7% y/y, core +0.3% (hot), PPI 10-15 hot (carried from [`fomc-2026-10-28`](fomc-2026-10-28.md)); UMich October prelim **46.3** vs 47.8 expected, current conditions 44.7 (−12.2%), expectations 47.3 (+2.2%), 1-yr inflation 4.7% (search-relayed). **FOMC odds, carried not re-derived:** Polymarket hold 87 / hike 14 (10-18 06:01 UTC), December 9 hike 76–79%; the hike-modal ~65% this doc cited on 09-27 has reversed. A search also surfaced a 69% October-hike average and a CME 24.9% figure that do not reconcile with each other or the FOMC ledger's direct reads — not used. **Volatility regime / tape (Yahoo daily, 10-16):** VIX **19.99** (+5.15 vs 14.84 on 10-11), S&P **7,659.44** (−1.09% d/d, −1.9% since 10-12), Nasdaq-100 **29,187.55** (−2.5% d/d), 10Y **5.10%**, WTI **$99.02**, Brent **$109.86** (+3.7% d/d). **Geopolitical:** oil is the common thread in both CPI and the September survey's price complaints; nothing new dated. **Event tape:** no October consensus (Conference Board publication restrictions, structural); October survey cut-off unpublished — September's ended on the 23rd, so October's likely closes ~10-20 to 10-22 and would include the 10-16 selloff days (inference, not sourced). **Adjacency sweep:** `computeAdjacentIds` returns 48 ids within 5 days, strong set unchanged (FOMC 10-28, GDP + PCE 10-29, ECI 10-30); `--on-date` for 10-26 through 10-30 shows every dated item already tracked. Nothing to propose; nothing beyond the horizon. | **No action change; two framing changes.** Date confirmed; divergence framing retired (kill switch 7). Stand-aside and flat-into-Oct 27–30 hold. See the 2026-10-18 Stance update (receipt: this row). No forward test registered — the call restates the sibling's FT-1 / FT-2 and no new score-by hypothesis is distinct from them. | 2026-10-20 (D-7 enters the medium 0+ band, every 2d) |
| 2026-10-20 | D-7 | **Full session — band `medium:8+` → `medium:0+` (every 2d) and strong-adjacent set grew (MSFT/GOOG/AMZN prints), so material; nothing changes the call.** **Date re-read:** conference-board.org/topics/consumer-confidence fetched direct today (HTTP 200, 333,645 B, after a 301) still states verbatim *"The next release is Tuesday, October 27th at 10 AM ET."*; no cut-off line published, no schedule change. **Tape (Yahoo daily, 10-16 → 10-19):** S&P 500 **7,659.44 → 7,690.73 (+0.41%)**, Nasdaq-100 **29,187.55 → 29,529.34 (+1.17%)**, Nasdaq Comp **26,140 → 26,431**, **VIX 19.99 → 18.44 (−1.55)**, 10Y ^TNX **5.10 → 5.14%**, Brent **109.86 → 109.55** (10-20 intraday print 110.09). A search summary quoting a 10-19 *close* of S&P 7,515 / Nasdaq 25,873 contradicts the Yahoo bars and is not used. **Macro:** no new print since the 10-18 row; hot CPI/PPI stand. **FOMC odds:** carried from [`fomc-2026-10-28`](fomc-2026-10-28.md) 10-18 (hold ~87 / hike ~14); a direct Polymarket pull today returned a stale June market, so not refreshed. **Peers / calendar:** none tracked (`symbols: []`). Sibling ledgers now put **Meta Q3 on 10-21 AMC** (IR, 10-12) and **MSFT on 10-28 AMC** (IR, 10-13) — our derived print entries still read 10-28 and 10-27; earnings entries are not mine to edit, so the corridor is only *tighter* than the calendar says. `--on-date` for 10-26/27/28 lists only entries already tracked; nothing to propose, nothing beyond the horizon. **Event tape:** no consensus (Conference Board restrictions, structural); the survey window likely closes ~10-20 to 10-22 (inference), so it spans the 10-14/10-16 selloffs. UMich final (10-23) covers 09-22 → 10-19 and is the last consumer read before this print. | — (stance holds; no assessment change) | 2026-10-22 (medium, 0+d band: every 2d) |
| 2026-10-26 | D-1 | **Full session — `new-adjacent-event:spcx-lockup-release-2026-10-22` tripped the screen; nothing changes the call.** **Date re-read:** conference-board.org/topics/consumer-confidence fetched direct today (HTTP 200, 333,502 B) still states verbatim *"The next release is Tuesday, October 27th at 10 AM ET."*; no cut-off line, no schedule change. **UMich final (10-23, search-relayed — CNN/Advisor Perspectives 403/451 on direct fetch):** **48.0** vs 48.1 in September and vs the **46.3** prelim (+1.7 revision, so the [UMich final's](umich-sentiment-final-2026-10-23.md) own revision test (\|Δ\| ≥ 1.0) is its to score); 56% cite high prices, 40%+ gas unprompted — second-lowest on a record back to 1978; the read-through to this print stays negative-but-flat. **Tape (Yahoo daily, direct; 10-26 is the latest intraday read, not a close):** S&P 500 **7,659.44 (10-16) → 7,623.68 (10-23) → 7,670.69**, Nasdaq-100 **29,187.55 → 28,957.53 → 29,162.10**, **VIX 19.99 → 19.45 → 18.22** (probe 18.22; −1.77 vs 19.99 at 10-16, −0.22 vs 18.44 at the 10-20 row), 10Y ^TNX **5.10 → 4.99 → 4.96%**, Brent **109.86 → 116.72 (10-23) → 109.97**. **FOMC odds, carried not re-derived:** Polymarket hold 94 / hike 6 (10-22, [`fomc-2026-10-28`](fomc-2026-10-28.md)); a search relay of 84–87% hold does not reconcile and is not used. **Macro:** no new CPI/jobs print since 10-20; the Dallas Fed survey (10-26) is its own ledger's. **Peers:** none, `symbols: []`. **Geopolitical:** nothing dated beyond the Brent spike-and-reversal (not attributed). **Event tape:** no October consensus (Conference Board restrictions, structural). The survey cut-off is unpublished; by September's pattern it closed ~10-20 to 10-22, spanning the 10-14/10-16 selloffs and the 10-22 tech drop (inference). The new adjacent is a lockup release that already passed (10-22), so it adds no forward risk. **Adjacency sweep:** `--on-date` for 10-27 lists 12 entries and 10-28 starts with FOMC/GOOG, all already tracked; nothing to propose, nothing beyond the horizon. No forward test registered — the sibling's FT-1/FT-2 already cover the series. | — (stance holds; no assessment change) | 2026-10-28 (close-out follows the print) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed to `market-events.ts` as an `estimate` in
the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first),
never from memory — after which this doc goes quiet.

## Outcome

**Close-out (2026-10-30, D+3).** Macro-print mode carries no `earnings-cycle` / `intraday-edges`
instrument (`symbols: []` by design) — the instrument cache was busted per the lane's contract
(`rm -rf node_modules/.cache/earnings-cycle node_modules/.cache/intraday-edges`) but has no target
here, so the release and the tape are re-fetched fresh rather than re-run. Primary:
conference-board.org/topics/consumer-confidence fetched direct 2026-10-30 (HTTP 200, 331,262 B),
headed "US Consumer Confidence Increased in October," *Updated: Tuesday, October 27, 2026*. The page
now states *"The next release is Tuesday, November 24th at 10 AM ET."*

**What printed — the opposite of the base case, on every number the call sheet named.** Headline
**91.7**, **+7.5** from September, which is itself revised **up** to **84.2** (first printed 81.9).
**Present Situation 120.4** (+8.6). **Expectations 72.6** (+6.9), *"only partially reversing three
consecutive monthly declines"* and still below the Board's 80.0 recession-signal line (below it
since February 2025). Net business conditions **+3.6%** (+4.8pp, "good" 21.4% vs "bad" 17.8%); jobs
plentiful **26.7%** vs hard-to-get **21.4%** = **+5.3pp** differential (+2.4pp); net expectations for
business conditions **−3.0%** (+5.7pp), labor market **−11.1%** (+1.8pp), household income **+6.7%**
(+3.5pp) — all three Expectations components improved. 12-month inflation expectations
**5.8% average**, down from 6.1% (the median is not stated in the release text read today).
Survey window **Oct 1–21** (cut-off **Oct 21**), so it did span the 10-14/10-16 selloffs the ledger
flagged and still rose. The Board's explanation: the gain tracked *"retail gasoline prices easing
from September to October"*; write-ins on war and conflict eased for a second straight month; planned
spending on services and durables fell. Street consensus, search-relayed from two secondary
aggregators only (the Board's page carries none): **~81.0**, a **~10.7-point beat** — unverified, so
the size of the miss is soft though its sign is not. The Board's own words, *"confidence revived to
June levels,"* mark the level; it still calls the long-run trend down.

**Scoring the standing calls (all from the numbers above).**

- **"This month" call — headline under 90, Expectations below 68.2: WRONG on both legs.** 91.7 is
  1.7 above 90 and 72.6 is 4.4 above 68.2. Its dated falsifier (*the 10-27 release printing
  Expectations above 68.2*) fired exactly as written. The 10-18 row's reasoning (gasoline complaints
  at highs, Brent $109.86, survey window overlapping the selloff) extrapolated the September trend;
  the survey instead tracked retail gasoline easing even while Brent kept rising into 10-23
  (**$116.72**). The call was Low confidence by its own label, and it was the wrong side of a mean
  reversion in a series that had just printed a 12-year-low.
- **Kill switches.** *Expectations above 80* — did **not** fire (72.6). *Expectations below ~62* —
  did not fire (10.6 above). *Any print date moves off Oct 27–29* — did not fire. *This print visibly
  moves the tape (S&P ≥0.5% attributable)* — **unscoreable**: S&P rose **+0.60%** on 10-27 but the
  same session carried durable goods, new home sales, Case-Shiller, the 5Y auction and the MSFT
  print's estimated date, and no source isolates the 10:00 ET bar. Recorded as confounded, not as
  support for or against leg 7's base rate.
- **"Stand aside" / "flat into Oct 27–30": nothing to score — no position, no trade, no sizing
  change existed to be right or wrong.** `symbols: []`. Whether it was *correct* to be flat is
  the FOMC / GDP / PCE / mega-cap ledgers' to adjudicate, not this survey's.
- **Revision pattern — a standing risk reverses sign.** The September ledger recorded August
  revised **down** (89.4 → 88.6). September is now revised **up** (81.9 → 84.2). Two revisions, two
  directions: a first-print comparison and a revised-series comparison can differ by 2+ points
  either way, so score against the *as-published* figure the ledger registered, and name the
  revision beside it.
- **Cross-reads.** UMich final (10-23) was **48.0** against a 46.3 prelim; the Conference Board
  survey window (Oct 1–21) ended two days before it, and the two indices moved in opposite
  directions from their September levels (UMich 48.1 → 48.0, flat; CB 84.2 → 91.7). The read-through
  this ledger called "negative-but-flat" held for UMich and failed for the Board.

**Forward tests.** None registered by this ledger — the 10-18 and 10-26 rows said the sibling's FT-1
and FT-2 already cover the series — so this event has no fragment and nothing to score. The
sibling's FT-2 (12-month inflation expectations above ~5.8%) scored on the 09-29 print; October's
5.8% is the figure that line was anchored on, now back to it. `npm run research:claims -- --event
consumer-confidence-2026-10-27` was run: no conviction reads this event's rows.

**Market reaction (Yahoo daily closes, direct, 2026-10-30 — the 10-30 bar is an intraday read and
is not used).** 10-26 → 10-27: S&P 500 **7,676.77 → 7,722.60 (+0.60%)**, Nasdaq-100 **29,273.40 →
29,651.44 (+1.29%)**, VIX **18.39 → 17.52**, 10Y ^TNX **4.99% → 4.99%**, Brent **$115.81 →
$113.88**. The rates market did not move on a 10-point beat, which is the cleanest single read in
the set: a yield-flat day does not read a stronger consumer as hawkish news for the 10-28 FOMC. By
10-29: S&P **7,720.39**, VIX **17.20**, 10Y **4.99%**. Attribution to this print is **not**
claimed.

**What to carry forward.** (1) The series is mean-reverting on a one-month horizon after an
extreme print; a trend-extrapolating Low-confidence call should name the reversion case in its
falsifier column, not only the continuation case. (2) Check the poll-sourced calendars for a
consensus *before* writing "none exists" — the sibling's correction applied here again: this ledger
repeated "no consensus, structural" in every row and only the web search at close-out found ~81.0.
(3) The 11-24 edition is tracked as `consumer-confidence-2026-11-24`; its ledger inherits September's
and October's revisions as the baseline. **Loop stage a person still had to do:** none in this
close-out. The consensus-hunting miss in (2) is a *sense* gap the next initial research can close.

**Last assessed:** 2026-09-27
<!-- probe-ref: {"symbols":{},"vix":14.87,"daysBand":"medium:8+","adjacentIds":["aapl-2026-10-29-print","aapl-iphone-duo-launch-2026-10-23","advance-economic-indicators-2026-10-28","amzn-2026-10-29-print","boj-decision-2026-10-30","case-shiller-hpi-2026-10-27","chicago-pmi-2026-10-30","construction-spending-2026-11-02","dallas-fed-mfg-2026-10-26","dallas-fed-trimmed-mean-2026-10-29","dallas-fed-tssos-2026-10-27","durable-goods-2026-10-27","ecb-bank-lending-survey-2026-10-27","ecb-decision-2026-10-29","ecb-monetary-developments-2026-10-27","ecb-spf-q4-2026-10-30","eci-q3-2026-10-30","fhfa-hpi-2026-10-27","fomc-2026-10-28","g20-foreign-ministers-atlanta-2026-10-30","gdp-q3-2026-advance-2026-10-29","goog-2026-10-28-print","housing-vacancies-q3-2026-10-28","ism-manufacturing-2026-11-02","japan-cpi-2026-10-23","jgb-2y-auction-2026-10-29","jgb-climate-transition-5y-auction-2026-11-02","jgb-liquidity-enhancement-11-39y-2026-10-27","meta-2026-10-28-print","msft-2026-10-27-print","mwts-benchmark-revision-2026-10-26","nar-metro-home-prices-2026-10-29","new-home-sales-2026-10-27","opec-plus-meeting-2026-11-01","pce-2026-10-29","russell-style-month-end-capping-effective-2026-10-30","sloos-2026-11-02","treasury-2y-frn-2026-10-28","treasury-2y-note-2026-10-26","treasury-5y-note-2026-10-27","treasury-7y-note-2026-10-29","treasury-borrowing-estimates-2026-11-02","treasury-buyback-20y30y-2026-10-27","uk-autumn-budget-2026-10-28","uk-blue-book-2026-10-30","uk-consumer-confidence-2026-10-23","uk-pink-book-2026-10-30","uk-retail-sales-2026-10-23"],"adjacentStrongIds":["fomc-2026-10-28","gdp-q3-2026-advance-2026-10-29","pce-2026-10-29","eci-q3-2026-10-30"],"screenStreak":0} -->

**Last assessed:** 2026-10-04
<!-- probe-ref: {"symbols":{},"vix":15.31,"daysBand":"medium:8+","adjacentIds":["aapl-2026-10-29-print","aapl-iphone-duo-launch-2026-10-23","advance-economic-indicators-2026-10-28","amzn-2026-10-29-print","boj-decision-2026-10-30","case-shiller-hpi-2026-10-27","chicago-pmi-2026-10-30","dallas-fed-mfg-2026-10-26","dallas-fed-trimmed-mean-2026-10-29","dallas-fed-tssos-2026-10-27","durable-goods-2026-10-27","ecb-bank-lending-survey-2026-10-27","ecb-decision-2026-10-29","ecb-monetary-developments-2026-10-27","ecb-spf-q4-2026-10-30","eci-q3-2026-10-30","fhfa-hpi-2026-10-27","fomc-2026-10-28","g20-foreign-ministers-atlanta-2026-10-30","gdp-q3-2026-advance-2026-10-29","goog-2026-10-28-print","housing-vacancies-q3-2026-10-28","japan-cpi-2026-10-23","jgb-2y-auction-2026-10-29","jgb-liquidity-enhancement-11-39y-2026-10-27","jgb-liquidity-enhancement-5-11y-2026-10-22","meta-2026-10-28-print","msft-2026-10-27-print","msft-def14a-2026-10-22","mwts-benchmark-revision-2026-10-26","nar-metro-home-prices-2026-10-29","new-home-sales-2026-10-27","opec-plus-meeting-2026-11-01","pce-2026-10-29","russell-style-month-end-capping-effective-2026-10-30","treasury-2y-frn-2026-10-28","treasury-2y-note-2026-10-26","treasury-5y-note-2026-10-27","treasury-5y-tips-2026-10-22","treasury-7y-note-2026-10-29","treasury-buyback-20y30y-2026-10-27","treasury-coupon-announcement-2026-10-22","uk-autumn-budget-2026-10-28","uk-blue-book-2026-10-30","uk-consumer-confidence-2026-10-23","uk-pink-book-2026-10-30","uk-retail-sales-2026-10-23"],"adjacentStrongIds":["eci-q3-2026-10-30","fomc-2026-10-28","gdp-q3-2026-advance-2026-10-29","pce-2026-10-29"],"screenStreak":1} -->

**Last assessed:** 2026-10-11
<!-- probe-ref: {"symbols":{},"vix":14.84,"daysBand":"medium:8+","adjacentIds":["aapl-2026-10-29-print","aapl-iphone-duo-launch-2026-10-23","advance-economic-indicators-2026-10-28","amzn-2026-10-29-print","boe-dmp-2026-10-30","boj-decision-2026-10-30","case-shiller-hpi-2026-10-27","chicago-pmi-2026-10-30","dallas-fed-mfg-2026-10-26","dallas-fed-trimmed-mean-2026-10-29","dallas-fed-tssos-2026-10-27","durable-goods-2026-10-27","ecb-bank-lending-survey-2026-10-27","ecb-decision-2026-10-29","ecb-monetary-developments-2026-10-27","ecb-spf-q4-2026-10-30","eci-q3-2026-10-30","fhfa-hpi-2026-10-27","fomc-2026-10-28","g20-foreign-ministers-atlanta-2026-10-30","gdp-q3-2026-advance-2026-10-29","goog-2026-10-28-print","housing-vacancies-q3-2026-10-28","japan-cpi-2026-10-23","jgb-2y-auction-2026-10-29","jgb-liquidity-enhancement-11-39y-2026-10-27","jgb-liquidity-enhancement-5-11y-2026-10-22","meta-2026-10-28-print","msft-2026-10-27-print","msft-def14a-2026-10-22","mwts-benchmark-revision-2026-10-26","nar-metro-home-prices-2026-10-29","new-home-sales-2026-10-27","opec-plus-meeting-2026-11-01","pce-2026-10-29","russell-style-month-end-capping-effective-2026-10-30","treasury-2y-frn-2026-10-28","treasury-2y-note-2026-10-26","treasury-5y-note-2026-10-27","treasury-5y-tips-2026-10-22","treasury-7y-note-2026-10-29","treasury-buyback-20y30y-2026-10-27","treasury-coupon-announcement-2026-10-22","uk-autumn-budget-2026-10-28","uk-blue-book-2026-10-30","uk-consumer-confidence-2026-10-23","uk-pink-book-2026-10-30","uk-retail-sales-2026-10-23","umich-sentiment-final-2026-10-23"],"adjacentStrongIds":["eci-q3-2026-10-30","fomc-2026-10-28","gdp-q3-2026-advance-2026-10-29","pce-2026-10-29"],"screenStreak":2} -->

**Last assessed:** 2026-10-18
<!-- probe-ref: {"symbols":{},"vix":19.99,"daysBand":"medium:8+","adjacentIds":["aapl-iphone-duo-launch-2026-10-23","advance-economic-indicators-2026-10-28","boe-dmp-2026-10-30","boj-decision-2026-10-30","case-shiller-hpi-2026-10-27","chicago-pmi-2026-10-30","dallas-fed-mfg-2026-10-26","dallas-fed-trimmed-mean-2026-10-29","dallas-fed-tssos-2026-10-27","dhi-q4-fy2026-2026-10-29","durable-goods-2026-10-27","ecb-bank-lending-survey-2026-10-27","ecb-decision-2026-10-29","ecb-monetary-developments-2026-10-27","ecb-spf-q4-2026-10-30","eci-q3-2026-10-30","fhfa-hpi-2026-10-27","fomc-2026-10-28","g20-foreign-ministers-atlanta-2026-10-30","gdp-q3-2026-advance-2026-10-29","housing-vacancies-q3-2026-10-28","japan-cpi-2026-10-23","japan-cpi-tokyo-flash-2026-10-30","jgb-2y-auction-2026-10-29","jgb-liquidity-enhancement-11-39y-2026-10-27","jgb-liquidity-enhancement-5-11y-2026-10-22","msft-def14a-2026-10-22","mwts-benchmark-revision-2026-10-26","nar-metro-home-prices-2026-10-29","new-home-sales-2026-10-27","opec-plus-meeting-2026-11-01","pce-2026-10-29","russell-style-month-end-capping-effective-2026-10-30","tic-shca-annual-final-2026-10-30","treasury-2y-frn-2026-10-28","treasury-2y-note-2026-10-26","treasury-5y-note-2026-10-27","treasury-5y-tips-2026-10-22","treasury-7y-note-2026-10-29","treasury-buyback-20y30y-2026-10-27","treasury-coupon-announcement-2026-10-22","uk-ashe-earnings-2026-10-22","uk-autumn-budget-2026-10-28","uk-blue-book-2026-10-30","uk-consumer-confidence-2026-10-23","uk-gilt-auction-short-2026-10-27","uk-pink-book-2026-10-30","uk-retail-sales-2026-10-23","umich-sentiment-final-2026-10-23"],"adjacentStrongIds":["eci-q3-2026-10-30","fomc-2026-10-28","gdp-q3-2026-advance-2026-10-29","pce-2026-10-29"],"screenStreak":0} -->

**Last assessed:** 2026-10-20
<!-- probe-ref: {"symbols":{},"vix":18.44,"daysBand":"medium:0+","adjacentIds":["aapl-iphone-duo-launch-2026-10-23","advance-economic-indicators-2026-10-28","amzn-2026-10-29-print","boe-dmp-2026-10-30","boj-decision-2026-10-30","case-shiller-hpi-2026-10-27","chicago-pmi-2026-10-30","dallas-fed-mfg-2026-10-26","dallas-fed-trimmed-mean-2026-10-29","dallas-fed-tssos-2026-10-27","dhi-q4-fy2026-2026-10-29","durable-goods-2026-10-27","ecb-bank-lending-survey-2026-10-27","ecb-decision-2026-10-29","ecb-monetary-developments-2026-10-27","ecb-spf-q4-2026-10-30","eci-q3-2026-10-30","fhfa-hpi-2026-10-27","fomc-2026-10-28","g20-foreign-ministers-atlanta-2026-10-30","gdp-q3-2026-advance-2026-10-29","goog-2026-10-28-print","housing-vacancies-q3-2026-10-28","japan-cpi-2026-10-23","japan-cpi-tokyo-flash-2026-10-30","jgb-2y-auction-2026-10-29","jgb-liquidity-enhancement-11-39y-2026-10-27","jgb-liquidity-enhancement-5-11y-2026-10-22","msft-2026-10-27-print","msft-def14a-2026-10-22","mwts-benchmark-revision-2026-10-26","nar-metro-home-prices-2026-10-29","new-home-sales-2026-10-27","opec-plus-meeting-2026-11-01","pce-2026-10-29","russell-style-month-end-capping-effective-2026-10-30","tic-shca-annual-final-2026-10-30","treasury-2y-frn-2026-10-28","treasury-2y-note-2026-10-26","treasury-5y-note-2026-10-27","treasury-5y-tips-2026-10-22","treasury-7y-note-2026-10-29","treasury-buyback-20y30y-2026-10-27","treasury-coupon-announcement-2026-10-22","uk-ashe-earnings-2026-10-22","uk-autumn-budget-2026-10-28","uk-blue-book-2026-10-30","uk-consumer-confidence-2026-10-23","uk-gilt-auction-short-2026-10-27","uk-pink-book-2026-10-30","uk-retail-sales-2026-10-23","umich-sentiment-final-2026-10-23"],"adjacentStrongIds":["amzn-2026-10-29-print","eci-q3-2026-10-30","fomc-2026-10-28","gdp-q3-2026-advance-2026-10-29","goog-2026-10-28-print","msft-2026-10-27-print","pce-2026-10-29"],"screenStreak":0} -->

**Last assessed:** 2026-10-26
<!-- probe-ref: {"symbols":{},"vix":18.22,"daysBand":"medium:0+","adjacentIds":["aapl-iphone-duo-launch-2026-10-23","advance-economic-indicators-2026-10-28","amzn-2026-10-29-print","boe-dmp-2026-10-30","boj-decision-2026-10-30","case-shiller-hpi-2026-10-27","chicago-pmi-2026-10-30","dallas-fed-mfg-2026-10-26","dallas-fed-trimmed-mean-2026-10-29","dallas-fed-tssos-2026-10-27","dhi-q4-fy2026-2026-10-29","durable-goods-2026-10-27","ecb-bank-lending-survey-2026-10-27","ecb-decision-2026-10-29","ecb-monetary-developments-2026-10-27","ecb-spf-q4-2026-10-30","eci-q3-2026-10-30","fhfa-hpi-2026-10-27","fomc-2026-10-28","g20-foreign-ministers-atlanta-2026-10-30","gdp-q3-2026-advance-2026-10-29","goog-2026-10-28-print","housing-vacancies-q3-2026-10-28","intc-fq3-2026-results-2026-10-29","japan-cpi-2026-10-23","japan-cpi-tokyo-flash-2026-10-30","jgb-2y-auction-2026-10-29","jgb-liquidity-enhancement-11-39y-2026-10-27","jgb-liquidity-enhancement-5-11y-2026-10-22","msft-2026-10-27-print","mwts-benchmark-revision-2026-10-26","nar-metro-home-prices-2026-10-29","new-home-sales-2026-10-27","opec-plus-meeting-2026-11-01","pce-2026-10-29","russell-style-month-end-capping-effective-2026-10-30","spcx-lockup-release-2026-10-22","tic-shca-annual-final-2026-10-30","treasury-2y-frn-2026-10-28","treasury-2y-note-2026-10-26","treasury-5y-note-2026-10-27","treasury-5y-tips-2026-10-22","treasury-7y-note-2026-10-29","treasury-buyback-20y30y-2026-10-27","treasury-coupon-announcement-2026-10-22","uk-ashe-earnings-2026-10-22","uk-autumn-budget-2026-10-28","uk-blue-book-2026-10-30","uk-consumer-confidence-2026-10-23","uk-gilt-auction-short-2026-10-27","uk-pink-book-2026-10-30","uk-retail-sales-2026-10-23","umich-sentiment-final-2026-10-23"],"adjacentStrongIds":["amzn-2026-10-29-print","eci-q3-2026-10-30","fomc-2026-10-28","gdp-q3-2026-advance-2026-10-29","goog-2026-10-28-print","msft-2026-10-27-print","pce-2026-10-29","spcx-lockup-release-2026-10-22"],"screenStreak":0} -->

**Last assessed:** 2026-10-30
<!-- probe-ref: {"symbols":{},"vix":17.2,"daysBand":"medium:0+","adjacentIds":["aapl-iphone-duo-launch-2026-10-23","advance-economic-indicators-2026-10-28","amzn-2026-10-29-print","boe-dmp-2026-10-30","boj-decision-2026-10-30","case-shiller-hpi-2026-10-27","chicago-pmi-2026-10-30","dallas-fed-mfg-2026-10-26","dallas-fed-trimmed-mean-2026-10-29","dallas-fed-tssos-2026-10-27","dhi-q4-fy2026-2026-10-29","durable-goods-2026-10-27","ecb-bank-lending-survey-2026-10-27","ecb-decision-2026-10-29","ecb-monetary-developments-2026-10-27","ecb-spf-q4-2026-10-30","eci-q3-2026-10-30","fhfa-hpi-2026-10-27","fomc-2026-10-28","g20-foreign-ministers-atlanta-2026-10-30","gdp-q3-2026-advance-2026-10-29","goog-2026-10-28-print","housing-vacancies-q3-2026-10-28","intc-fq3-2026-results-2026-10-29","japan-cpi-2026-10-23","japan-cpi-tokyo-flash-2026-10-30","jgb-2y-auction-2026-10-29","jgb-liquidity-enhancement-11-39y-2026-10-27","jgb-liquidity-enhancement-5-11y-2026-10-22","msft-2026-10-27-print","mwts-benchmark-revision-2026-10-26","nar-metro-home-prices-2026-10-29","new-home-sales-2026-10-27","pce-2026-10-29","russell-style-month-end-capping-effective-2026-10-30","spcx-lockup-release-2026-10-22","tic-shca-annual-final-2026-10-30","treasury-2y-frn-2026-10-28","treasury-2y-note-2026-10-26","treasury-5y-note-2026-10-27","treasury-5y-tips-2026-10-22","treasury-7y-note-2026-10-29","treasury-buyback-20y30y-2026-10-27","treasury-coupon-announcement-2026-10-22","uk-ashe-earnings-2026-10-22","uk-autumn-budget-2026-10-28","uk-blue-book-2026-10-30","uk-consumer-confidence-2026-10-23","uk-gilt-auction-short-2026-10-27","uk-pink-book-2026-10-30","uk-retail-sales-2026-10-23","umich-sentiment-final-2026-10-23"],"adjacentStrongIds":["amzn-2026-10-29-print","eci-q3-2026-10-30","fomc-2026-10-28","gdp-q3-2026-advance-2026-10-29","goog-2026-10-28-print","msft-2026-10-27-print","pce-2026-10-29","spcx-lockup-release-2026-10-22"],"screenStreak":0} -->
