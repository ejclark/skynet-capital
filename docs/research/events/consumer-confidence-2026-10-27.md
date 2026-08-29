# Conference Board Consumer Confidence (Oct 2026) — consumer-confidence-2026-10-27

**Kind:** macro-print · **Date:** 2026-10-27 (estimate, EST: conference-board.org/topics/consumer-confidence states verbatim "The Conference Board publishes the Consumer Confidence Index® at 10 a.m. ET on the last Tuesday of every month" — fetched 2026-08-29, where it names 09-29 explicitly but not October; 2026-10-27 is that Tuesday, 10-31 being a Saturday) · **Impact:** medium
**Last assessed:** 2026-08-29
<!-- probe-ref: {"symbols":{},"vix":14.51,"daysBand":"medium:31+","adjacentIds":["aapl-2026-10-29-print","amzn-2026-10-29-print","fomc-2026-10-28","gdp-q3-2026-advance-2026-10-29","goog-2026-10-28-print","meta-2026-10-28-print","msft-2026-10-27-print","pce-2026-10-29"],"screenStreak":0} -->

## At a glance

**TL;DR.** This print's importance is **entirely conditional on one vote that hasn't happened yet** —
the House taking up the Senate's CR in early September. If a CR is signed, 10-27 is an ordinary
second-tier survey landing in a week nobody will be watching it. If funding lapses on 10-01, the
October survey is the **first Conference Board panel conducted entirely inside a shutdown**, it
publishes at **10:00 ET on the opening day of the two-day FOMC**, and it becomes the last consumer
datapoint to reach a committee that will have **no dots, no forward guidance, no October payrolls
and no October CPI**. The 2025 lapse is the precedent and it is precise: the CCI **published on
schedule** through the Oct 1 – Nov 12 shutdown (10-28-2025 print, 94.6, lowest since April, with the
shutdown named a "key concern") while the Conference Board's *other* indices — LEI, ETI, HWOL — were
delayed, because those ingest federal series and the survey does not. Two honest deflations: the
Board is **not uniquely surviving** (UMich is private too and prints twice in October), and this
release's measured base rate is that it does not move the tape — August missed at a seven-month low
and the S&P closed +0.3%. The date is **estimate**, cadence-derived, not a fetched primary line.
Nothing here is a trade, and the Oct 27–29 window is one to be **flat into**, not to express a view in.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-59) | Stand aside | High | `symbols: []`, 59 days out, the October survey panel has not opened, and the branch that makes this print matter is undecided. | Nothing dated today; no consensus exists and, per the sibling's finding, none is structurally publishable in advance |
| This week | Watch the **House CR floor vote**, not this event | High | The House returned **08-31** to take up the Senate CR; that single vote decides whether 10-27 is a promoted read inside a data blackout or a routine survey. | A CR signed before **2026-09-30**, which collapses the blackout branch and drops this print back to second-tier for good |
| This month | Let the **09-29 sibling** carry the month; nothing here | High | The September print resolves the ~53-point Present-minus-Expectations gap first; October is the follow-on read, and D-59 has no action in it. | The **2026-09-29** print moving both subcomponents the same direction, which retires the divergence framing this doc inherits |
| This quarter | **Flat into Oct 27–29** — treat this print as information, never a catalyst | High | The FOMC statement, five estimated mega-cap prints, and (added in this PR) Q3 advance GDP + September PCE all land in a 72-hour window; a second-tier survey is the quietest thing in the loudest window of the quarter. | IR-confirmed print dates moving off Oct 27–29, or the **2026-10-28** FOMC arriving with a full data set — either of which decompresses the window |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never a trade on this print.** `symbols: []`, no house playbook is macro-keyed, and the 08-25
  release missed at a seven-month low while the S&P closed **+0.3%** on unrelated drivers.
- **No CR by 2026-09-30** → this print is promoted: read its **labor differential** as the closest
  surviving proxy for the deleted 10-02 payrolls, and expect the market to over-weight it accordingly.
- **A CR signed before 2026-09-30** → demote this doc to routine; the whole blackout leg collapses.
- **Expectations below 68.2** → the forward-looking leg is still deteriorating into the midterms and
  the 10-28 FOMC; tightens caution on AMZN/AAPL discretionary exposure, both printing on **10-29**.
- **Present Situation giving back August's +6.8** → the divergence resolves *downward*, which is the
  more consequential read one week before the **11-03** midterms.
- **Do not spend sessions hunting a consensus.** Withheld under Conference Board publication
  restrictions — structural, established by the sibling, not a research failure.
- **Watch (dated):** House CR vote **first week of Sep** (unscheduled) · **FOMC 09-16** · CB print
  **09-29** · funding deadline **09-30** (estimate) · ISM **10-01** (estimate) · **jobs 10-02** ·
  **CPI 10-14** · **MSFT print 10-27** (estimate) · **this release 10-27** (estimate) ·
  **FOMC 10-28** (no SEP) + GOOG/META prints · **Q3 advance GDP + Sep PCE 10-29** (confirmed, added
  in this PR) + AMZN/AAPL prints · **midterms 11-03** (estimate).

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

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-08-29 | D-59 | Initial research banked (above). **Date stays `estimate`, deliberately:** conference-board.org was fetched today and states verbatim *"The Conference Board publishes the Consumer Confidence Index® at 10 a.m. ET on the last Tuesday of every month"*; 10-27 is that Tuesday (10-31 is a Saturday, checked by arithmetic) — but the page's explicit next-release line names **09-29 only**, so a rule-plus-arithmetic derivation is not the primary line the sibling had when it flipped 09-29 to `confirmed`. **The inherited claim was tested against 2025 and came back narrower:** through the **Oct 1 – Nov 12 2025** lapse the **Consumer Confidence Index published on schedule** (10-28-2025 and 11-25-2025 releases both landed) while the Board carried a notice that *"all further releases for The Conference Board Employment Trends Index™ (ETI), The Conference Board-Lightcast Help Wanted OnLine® Index (HWOL Index), The Conference Board Leading Economic Index® of the US (US LEI) and The Conference Board Global Leading Economic Index® (Global LEI) data may be delayed"* — the CCI is directly collected, the LEI is a composite of federal series; private *publisher* ≠ private *inputs*. That banner is absent from the LEI page today (fetched 2026-08-29; LEI **+0.2% in July 2026 to 99.5**, updated 08-20), evidence it was shutdown-specific. **2025 in-survey effect:** the 10-28-2025 print fell **95.6 → 94.6** (lowest since April) vs consensus **94.2** with the shutdown named a "key concern," and the Board reported **responses collected after the shutdown ended were more positive than those collected during it** — a within-sample effect, so the *window* is the thing to read. Sourcing caveat recorded: the Forbes article carrying those figures **403s** on direct fetch; snippet fidelity only, re-verify before any 2026-vs-2025 comparison. **The sharpest new finding:** with cut-offs running **Jun 23 · Jul 22 · Aug 16**, a lapse beginning 10-01 brackets the entire plausible October window — October 2026's would be the **first CB panel conducted entirely inside a shutdown**, where 2025's October panel opened before the lapse and caught only part of it. **Inherited framing corrected:** the sibling's "one of the few forward-looking consumer reads that survives" overstates it — **UMich is private too**, prints twice monthly, survives identically, and fell to **51 from 55.2** in August; ADP likewise. This calendar omits UMich by explicit choice (`market-events-data.ts`: *"second-order surveys (Michigan sentiment, durable goods) and weekly jobless claims are deliberately omitted as low-impact"*), which does not make it stop existing in a blackout. Honest wording is "one of several." Sibling not edited (rows append-only). Adjacency sweep — **peers:** n/a, `symbols: []`. **Macro surprises:** none new since the sibling's row; Warsh 08-28 (forward guidance abolished, Sep hike odds 35.5% → 59.5%, October pinned ~50%) carried from [`fomc-2026-10-28`](fomc-2026-10-28.md), not re-derived. **Volatility regime:** VIX **14.51** (Yahoo daily close, 2026-08-27) — baseline set, nothing to diff against yet; unchanged from the sibling's reading and at the 2026 low. **Geopolitical:** Brent (BZ=F) **$89.70** on 08-27, S&P 500 **7,730.99** — the de-escalation the sibling documented (~$94 → ~$88 on the Iran–Oman framework and Gulf exports back to 15–16 mb/d) is intact, not reversed. **Event tape:** no October consensus and none publishable in advance (Conference Board publication restrictions — structural, established by the sibling, not re-spent here). **Political salience recorded, not modelled:** 10-27 is the last CB print before the **11-03** midterms; approval as of 08-25/26 reads 36/57 YouGov-Economist (Aug 21–24), 33/65 Reuters-Ipsos, 40/59 Echelon (Aug 13–17), 43/54 Morning Consult (Aug 14–17). An aggregator claim pairing "confidence below 80 → incumbent-party losses" with a figure of **"57 in spring 2026"** contradicts this calendar's own primary series (89.4 Aug / 90.2 Jul) and is **discarded as unverified**, along with the correlation it was bundled with. **New dated adjacencies found → added in this PR, `confirmed` off a primary bea.gov/news/schedule fetch today (`BEA:`, the prefix the calendar's own table sanctions):** **`gdp-q3-2026-advance-2026-10-29`** and **`pce-2026-10-29`**, both 08:30 ET — quoted verbatim from the schedule as *"October 29"* / *"GDP (Advance Estimate), 3rd Quarter 2026"* and *"Personal Income and Outlays, September 2026"*. Both are federal and die in the lapse branch alongside jobs 10-02 and CPI 10-14; both publish the morning **after** the 10-28 statement, so the committee decides without them. Judgement call flagged in Honest limits: the lane's adjacency rule says "always estimate," and `midterm-elections-2026-11-03` took that stricter reading — a two-line revert if intended. **Corridor as it now stands:** MSFT 10-27 (est) · **this print 10-27** (est) · FOMC 10-28 (confirmed, no SEP) + GOOG/META (est) · GDP + PCE 10-29 (confirmed) + AMZN/AAPL (est) · midterms 11-03 (est) — the densest 72 hours this calendar tracks, and per [`fomc-2026-10-28`](fomc-2026-10-28.md) the answer is S2/E1: flat into it. | — (stance set) | 2026-09-19 (medium, ≥31d band: every 21d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed to `market-events.ts` as an `estimate` in
the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first),
never from memory — after which this doc goes quiet.
