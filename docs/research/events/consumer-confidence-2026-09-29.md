# Conference Board Consumer Confidence (Sep 2026) — consumer-confidence-2026-09-29

**Kind:** macro-print · **Date:** 2026-09-29 (confirmed, CB: conference-board.org/topics/consumer-confidence — its own page states verbatim "The next release is Tuesday, September 29th at 10 AM ET", fetched 2026-08-29) · **Impact:** medium
**Last assessed:** 2026-08-29
<!-- probe-ref: {"symbols":{},"vix":14.51,"daysBand":"medium:31+","adjacentIds":["chicago-pmi-2026-09-30","government-funding-deadline-2026-09-30","ism-manufacturing-2026-10-01","jobs-2026-10-02","jolts-2026-09-29","mu-2026-09-29-print","treasury-7y-note-2026-09-24","trump-xi-summit-2026-09-24"],"screenStreak":0} -->

## At a glance

**TL;DR.** August's print split in half and September is where that gets resolved: **Present Situation
121.2 (up 6.8, its first gain in four months) against Expectations 68.2 (down 5.8)** — a **~53-point
gap** between how consumers describe today and how they describe next year. The predecessor's own
kill switch fired on the Expectations break below 70, and the doc that fired it has gone quiet, so
this print inherits it. Two things make September's survey different from August's rather than just
later. **First, the window.** August's ran **Aug 3–16** and closed twelve days *before* Warsh's
Jackson Hole keynote — so its 5.8% inflation-expectations reading contains none of the hawkish
repricing, and September's window is the first that can contain both that **and** the 09-16 FOMC.
**Second, the energy leg has flipped sign.** August's survey caught Brent near **$94**; it has since
fallen to about **$88** on an Iran–Oman framework and Gulf exports recovering to 15–16 mb/d — the
predecessor's "energy de-escalation" kill switch is now trending toward firing, not away. Date is
**confirmed** off the Conference Board's own page. This print reliably moves the tape less than
CPI/jobs/FOMC and August's release proved it again (S&P +0.3% the same session). Nothing here is a
trade.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-31) | Stand aside | High | `symbols: []`, 31 days out, and the September survey has not even opened — its window will run roughly the first half of September. | Nothing dated today; no consensus exists and, per the sibling's finding, none is structurally publishable in advance |
| This week | Watch the **energy tape**, not the survey | Medium | Brent fell ~$94 → ~$88 between 08-21 and 08-28 on an Iran–Oman framework; that path, running straight through the September survey window, is the live input to the inflation-expectations subcomponent. | Brent breaking back above ~$94 before mid-September, which re-arms the escalation read the August window carried |
| This month | Watch the **gap**, and do not trade the print | High | The ~53-point Present-minus-Expectations spread is the standing signal; whether it converges or widens is the one thing this release resolves. | The **2026-09-29** print showing both indices moving the same direction — which retires the divergence framing this doc is built on |
| This quarter | Treat the **October 27** print as the one that matters more | Medium | If funding lapses on 09-30, the October payrolls and CPI are deleted and this private survey becomes one of the few forward-looking consumer reads that survives — landing the day before a no-SEP FOMC. | A CR signed before **2026-09-30**, which restores the federal data and drops the CB print back to second-tier |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never a trade on this print.** `symbols: []`, no house playbook is macro-keyed, and August's
  release moved the tape ~0.3% in the direction of unrelated news.
- **Expectations below 68.2** → the forward-looking leg is still deteriorating; sharpens the
  recession-odds read feeding the 10-28 FOMC and tightens caution on AMZN/AAPL discretionary exposure.
- **Present Situation giving back its +6.8** → the divergence resolves *downward*, and the one
  genuinely encouraging thing in August's print (the labor differential at +7.5%) was noise.
- **Inflation expectations falling back from ~5.8%** → the cleanest read that the energy
  de-escalation is reaching households; the leg most likely to move rate-desk positioning.
- **Do not spend sessions hunting a consensus.** The sibling established it is withheld under
  Conference Board publication restrictions — a structural gap, not a research failure.
- **Watch (dated):** **FOMC 09-16** (likely inside the survey window) · 7Y auction + Trump–Xi
  **09-24** · JOLTS + MU print + **this release 09-29** · Chicago PMI + **funding deadline 09-30**
  (estimate) · ISM **10-01** (estimate) · **jobs 10-02** · **CPI 10-14** · CB October print
  **10-27** (estimate, proposed in this PR) · **FOMC 10-28** (no SEP).

## Initial research

### The question, plainly

What should the September Conference Board Consumer Confidence print be read for, given that its
predecessor split into a rising Present Situation and a collapsing Expectations Index; is the
2026-09-29 date right; what is different about the September survey window; and what — if anything —
should a paper book holding NVDA MRVL AVGO CRWV MSFT GOOG META AAPL AMZN do about it?

**One-line verdict:** the headline is the least interesting number in this release — the ~53-point
gap between present conditions and expectations is the signal, September's survey window is the first
that can contain both the hawkish Fed repricing and the 09-16 FOMC, the energy leg the predecessor
flagged as the live question has since flipped toward de-escalation, and none of it is tradeable.

### Method

Macro-print mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — `symbols: []`, so no
symbol-keyed instrument applies, `earnings-cycle.mjs` / `intraday-edges.mjs` were not run, and the
cache-busting rule has no target. **Two primaries were fetched directly today**, which is the
material improvement over the predecessor: the Conference Board's own consumer-confidence page for
the release date, and the August release itself via PRNewswire for the full subcomponent table, the
survey window and the cut-off date. Prior-print figures and the fired kill switch are inherited from
the scored close-out in [`consumer-confidence-2026-08-25`](consumer-confidence-2026-08-25.md) and
cross-checked against that primary rather than restated on trust — which caught two revision
discrepancies (leg 3). Energy and Hormuz status are press-sourced (CNBC / Al Jazeera / OilPrice via
search, 2026-08-21 → 08-28). Fed-path context is carried from [`jackson-hole`](jackson-hole-2026-08-28.md);
the shutdown branch from [`government-funding-deadline-2026-09-30`](government-funding-deadline-2026-09-30.md).
Volatility is the repo's own `event-material-scan` probe (VIX **14.51**). Every figure is dated
in-line.

### Conviction legs, tested

1. **The date is right and it is now primary-verified — SUPPORTED, and it upgrades the calendar
   entry.** `conference-board.org/topics/consumer-confidence/` was fetched today and states verbatim:
   **"The next release is Tuesday, September 29th at 10 AM ET."** That is the explicit date line the
   [`predecessor doc`](consumer-confidence-2026-08-25.md) recorded as its own biggest sourcing limit
   ("No primary-source calendar page with the explicit August 25 line item was directly fetchable —
   it sits behind Data Central"); it is fetchable today, and it resolves the calendar entry's own
   admission that 09-29 was "not primary-verified against conference-board.org's own schedule." The
   entry is flipped `estimate` → **`confirmed`** with the `CB:` prefix in this PR. **One caution
   recorded on the record:** an earlier extraction of the August PRNewswire release reported a next
   release of "September 30" — a Wednesday, which contradicts the last-Tuesday rule. Re-fetched with
   a verbatim-only prompt, that release **states no next-release date at all**; the "September 30"
   was extraction arithmetic, not text, and is discarded rather than reconciled.

2. **The August survey window closed before the news that matters most — SUPPORTED, primary-sourced,
   and it is the leg that makes September a genuinely different read.** The August release states its
   survey period as **August 3–16, 2026**, cut-off **August 16**. Warsh's Jackson Hole keynote was
   **2026-08-28** — twelve days after that window closed. So August's inflation-expectations reading
   contains **none** of the hawkish repricing that took September hike odds from ~35% to 46–59%.
   Recent cut-off dates have run **June 23 · July 22 · August 16** — mid-to-late month, and varying by
   a full week. **The honest conclusion is a conditional, not a claim:** a September cut-off anywhere
   in that observed range falls on or after **09-16**, so this is the first CB survey that *can*
   contain the FOMC outcome — but how much post-decision reaction it captures depends on a cut-off
   that has moved a week between months and is not published in advance.

3. **The August print's composition, re-derived from the primary — SUPPORTED, with two inherited
   figures corrected.** The release gives: headline **89.4** (−0.8) against a July revised to
   **90.2**; **Present Situation 121.2, up 6.8 from a revised 114.4**; **Expectations 68.2, down 5.8
   from a revised 74.0**; jobs "plentiful" **27.0%** (from 24.4%) minus "hard to get" **19.5%** (from
   21.7%) for a differential of **+7.5%**, up 4.8pp; 12-month inflation expectations "slightly more
   elevated"; the share calling a recession within twelve months "very likely" **ticked up** while
   overall perceived recession probability stayed low. Dana Peterson: *"Consumer confidence moderated
   slightly in August for a second consecutive month… Expectations for household incomes moderated but
   remained optimistic overall."* **The corrections:** the predecessor's close-out reads Expectations
   "down 5.8 from 74.7" and Present Situation up from an unstated base — the release's own revised
   priors are **74.0** and **114.4**. The direction and magnitudes are unchanged; only the bases move,
   and any September surprise framing must net against the **revised** priors, exactly as that doc's
   own honest-limits section warned. That doc is **not edited** — rows are append-only — and the
   correction lives here.

4. **The gap, not the headline, is the signal — SUPPORTED, and it is what this print exists to
   resolve.** 121.2 versus 68.2 is a **~53-point** spread between how consumers describe current
   conditions and how they describe the next twelve months. The Expectations Index has sat at or
   below the Conference Board's own flagged **80.0** recession-signal threshold **since February
   2025** and in August broke clear of it rather than hugging it. The divergence is the textbook
   late-cycle shape: current conditions fine, forward view deteriorating. **What it is not** is a
   timing signal — a threshold that has been breached for eighteen straight months without a
   recession is a poor trigger, and this doc does not treat it as one. It is regime context, and the
   useful question for 09-29 is narrow and answerable: **does the gap converge or widen?**

5. **The energy leg has flipped sign since the predecessor wrote — SUPPORTED, and it inverts a live
   watch item.** The predecessor's standing question was whether a renewed Hormuz shock would push
   the inflation-expectations subcomponent higher, and its D-1 row had Brent at **$93.09** in a
   two-week escalation. Since: Brent **$92.06** on 08-24 (−2.5%), **$89.44** on 08-25 (a one-week
   low, as the market shrugged off a new Iran sanctions package), and **~$88** on 08-28. Persian Gulf
   exports have recovered to **15–16 mb/d** against a March low of 5–6 mb/d and a pre-conflict 22–24
   mb/d, and Iran and Oman have agreed a revenue-sharing framework for the strait — while Tehran is
   explicit that this does not mean an immediate reopening. Traders are reported as treating Iran as a
   sanctions confrontation rather than an imminent physical-supply threat. **The September survey
   window runs through this**, so the predecessor's "energy de-escalation" kill switch is now trending
   toward firing. **Caveat:** ~$88 Brent with the strait still constrained is a de-escalation in
   *price*, not a resolution, and one reversal restores the old setup.

6. **This print moves markets less than CPI/jobs/FOMC — SUPPORTED, and August was another
   observation.** The predecessor's leg 5 argued this from cross-indicator research; its own close-out
   then scored it live. On 2026-08-25 the print came in at a seven-month low **and missed consensus**,
   and the tape closed **S&P +0.3% (7,675.54), Nasdaq +0.7%, Dow +0.3%** with the gains attributed to
   falling yields and easing oil. No AMZN- or AAPL-specific reaction tied to the print was findable.
   That is now two consecutive misses (July, August) with muted reactions, against one 2026
   counterexample (the March **UMich** sentiment collapse, a different survey). The base rate holds.

7. **The corridor is far denser than August's, and this print is the least important thing in it —
   SUPPORTED.** August 25th's neighbours were PCE/GDP/NVDA. September 29th's are: **JOLTS** and
   **MU's print** the same day, **Chicago PMI** and the **federal funding deadline** the next,
   **ISM** on 10-01, **payrolls** on 10-02 — with the **Trump–Xi summit** and a 7Y auction five days
   prior. In a corridor containing a possible government shutdown and a payrolls print, a second-tier
   consumer survey is not the thing that moves anything, and this doc says so plainly rather than
   inflating its own event.

8. **The shutdown branch makes the *October* print matter more than this one — SUPPORTED, and it is
   the forward-looking finding.** The Conference Board is a **private** publisher; it survives a
   lapse in federal appropriations, as ISM does and BLS does not. Per the
   [`funding-deadline`](government-funding-deadline-2026-09-30.md) research, a lapse beginning
   **2026-10-01** deletes **jobs 10-02** and **CPI 10-14** permanently. This 09-29 print lands
   *before* the deadline either way and is therefore unaffected — but the **October print, last
   Tuesday of the month = 2026-10-27**, would land inside the blackout and **the day before an FOMC
   that carries no SEP**. In that branch a private consumer survey becomes one of the few
   forward-looking reads still being published. That October date is not on the calendar and is
   proposed in this PR.

9. **Tracked-name sensitivity — unchanged and thin — SUPPORTED, inherited.** `symbols: []`. Only
   **AAPL** (discretionary device demand) and **AMZN** (e-commerce volumes) carry direct
   consumer-facing exposure; the other seven feel this only through the shared rate-path /
   recession-odds channel. August's release specifically noted anticipated discretionary spending
   "pared back," which is the AMZN/AAPL-relevant line — and the same session produced no measurable
   move in either name. The exposure is real as regime context and absent as a same-day catalyst.

### What the conditions support

Nothing directional, and with less urgency than even the predecessor's framing: leg 6 now has two
scored observations behind it, so this print does not warrant the "known-date variance" treatment
CPI and FOMC get. What the conditions support is a **reading order**: (a) read the **gap** first, the
headline last — the headline hid a 12.6-point opposite move in the two subcomponents in August; (b)
read **inflation expectations** against the *energy* path, which has reversed, rather than against
the July "prewar rate" framing that is now two windows stale; and (c) carry leg 8 forward now, so
that if funding lapses, the October print is already understood as a promoted read rather than a
routine one. There is also a **process** contribution: the predecessor spent three consecutive ledger
rows re-hunting a consensus that is withheld under Conference Board publication restrictions. That is
structural. This doc records it once and future pulses should not spend sessions on it.

### Honest limits

**No September consensus exists and structurally will not**, so every forward statement here is trend
extrapolation from a two-month sample, not a measured surprise gap — and the sample is unusual
(August's two subcomponents moved in opposite directions, so "the trend" is genuinely ambiguous). The
September **cut-off date is not published in advance** and has moved a full week across the last three
months, which is exactly why leg 2 is written as a conditional; if the cut-off lands before 09-16 the
FOMC-overlap claim fails outright. Leg 3's corrections rest on the PRNewswire distribution of the
release rather than a Conference Board PDF, and the revised priors it cites cannot be cross-checked
against the original July release without re-fetching it, which was not done. Energy figures (leg 5)
are press-sourced across three outlets and are the fastest-moving facts here — a month is a long time
in that tape. Leg 8 inherits the shutdown probabilities from a sibling that explicitly declines to put
a number on them. Finally, the date flip in leg 1 is a judgement call worth naming: the lane forbids
promoting a date **without** a primary source, and one was fetched today with the date stated verbatim
— but the `treasury-3y-note-2026-09-08` entry reads that limit more strictly and stayed `estimate`
despite primary sourcing. If the stricter reading is the intended one, this flip is a one-line revert.

## Stance & kill switches

**Stance (date confirmed, primary-fetched 2026-08-29).** Treat 2026-09-29 10:00 ET as a
**medium-impact second-tier print: real regime information, not a trading event.** No position
opened, closed or sized off it; no AMZN/AAPL discretionary-adjacent entry keyed to the release. Base
case (**Low** confidence — no consensus exists or will, and the two-month trend is internally
contradictory): the headline stays in the high-80s and the **gap is the thing that moves**, with the
honest expectation being convergence from the *Present Situation* side (its +6.8 was a four-month
outlier) rather than a rebound in Expectations. The doc's inherited job is the fired kill switch: the
predecessor's Expectations-sub-70 trigger fired at 68.2 and its own doc then went quiet, so **this
ledger now carries the recession-odds watch** feeding the 09-16 and 10-28 FOMC reads. The energy leg
that was the live upside risk to inflation expectations has reversed and is now the most likely source
of a *benign* surprise.

**Kill switches:**

- **The two subcomponents move the same direction on 2026-09-29** — the divergence framing this whole
  doc is built on retires, and the print reverts to an ordinary headline read.
- **Expectations back above 80** — the recession-signal threshold breached since February 2025 clears;
  the inherited watch closes and the late-cycle framing dies.
- **Expectations below ~62** (another 6-point leg down) — the deterioration is accelerating rather
  than grinding, and this stops being regime context; escalate ahead of schedule.
- **Brent back above ~$94 before mid-September** — leg 5 inverts again, the September window catches a
  re-escalation, and the inflation-expectations subcomponent becomes the upside risk it was in August.
- **A published September consensus appears** — would contradict the structural-withholding finding;
  re-run the surprise framing against a real number and correct the process note in this doc.
- **A CR is signed before 2026-09-30** — leg 8 collapses; the October print stays routine rather than
  becoming a promoted read inside a federal-data blackout.
- **The September cut-off is published and falls before 09-16** — leg 2's FOMC-overlap conditional
  fails, and this print carries no more Fed information than August's did.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-08-29 | D-31 | Initial research banked (above). **Date:** flipped `estimate` → **`confirmed`** (`CB:`) — conference-board.org's own consumer-confidence page was fetched today and states verbatim *"The next release is Tuesday, September 29th at 10 AM ET"*, which is the explicit primary line the [`predecessor`](consumer-confidence-2026-08-25.md) recorded as unfetchable (behind Data Central). Recorded caution: a first extraction of the August PRNewswire release reported a next release of "September 30" (a Wednesday, contradicting the last-Tuesday rule); re-fetched verbatim-only, that release **states no next-release date** — extraction arithmetic, discarded. **Predecessor re-derived from the primary rather than trusted:** headline **89.4** (−0.8) vs July revised **90.2**; **Present Situation 121.2**, +6.8 from a revised **114.4**; **Expectations 68.2**, −5.8 from a revised **74.0**; jobs-plentiful **27.0%** minus hard-to-get **19.5%** = **+7.5%** differential (+4.8pp); inflation expectations "slightly more elevated"; share calling a 12-month recession "very likely" ticked up. **Two inherited figures corrected:** the close-out's Expectations base of 74.7 and its unstated Present-Situation base are 74.0 and 114.4 in the release's own revised table — direction/magnitude unchanged, but a September surprise must net against the revised priors. That doc is not edited (rows append-only); the correction lives here. **The material window finding (primary):** August's survey ran **Aug 3–16**, cut-off **08-16** — twelve days *before* Warsh's 08-28 keynote, so August's inflation-expectations reading contains none of the 35% → 46–59% hawkish repricing. Recent cut-offs: **Jun 23 · Jul 22 · Aug 16** — mid-to-late month, varying a full week; any cut-off in that range falls on or after **09-16**, making September the first CB survey that *can* contain the FOMC outcome. Written as a conditional: the cut-off is not published in advance. Adjacency sweep — **peers:** n/a, `symbols: []`; MU prints the same day (09-29) but carries no consumer channel. **Macro surprises:** Warsh 08-28 (carried from the [`jackson-hole`](jackson-hole-2026-08-28.md) close-out, not re-derived) — relevant here only because of the window timing above. **Volatility regime:** VIX **14.51** (`event-material-scan` probe) — baseline set, nothing to diff against yet; noted that this is *below* the 15.13–15.84 range the predecessor's rows logged in mid-August, i.e. calmer, not more stressed, into a denser corridor. **Geopolitical — the leg that flipped:** Brent **$93.09** (08-24 predecessor row) → **$92.06** 08-24 → **$89.44** 08-25 (one-week low; market shrugged off a new Iran sanctions package) → **~$88** 08-28; Gulf exports recovered to **15–16 mb/d** vs a March low of 5–6 and pre-conflict 22–24; Iran–Oman revenue-sharing framework agreed, Tehran explicit that it is not a reopening. The predecessor's "energy de-escalation" kill switch is now trending **toward** firing — the inverse of every row it wrote. **Event tape:** no September consensus, and per the predecessor's D-1 finding none is publishable in advance (fxstreet lists consensus/previous as "n/a" citing Conference Board publication restrictions) — recorded once as **structural**, so future pulses do not re-spend sessions on it as the predecessor did three times. Reaction base rate reinforced: the 08-25 print hit a seven-month low, missed consensus, and the tape closed S&P **+0.3%** on unrelated drivers. **New dated adjacency found → proposed in this PR:** the CB's **October print, 2026-10-27** (last Tuesday), is not on the calendar; it matters disproportionately because in the funding-lapse branch it lands inside a federal-data blackout the day before a **no-SEP FOMC**, as one of the few forward-looking consumer reads still published; added as `consumer-confidence-2026-10-27`, `status: estimate` (`EST:`). **Inherited watch:** the predecessor's Expectations-sub-70 kill switch fired at 68.2 and that doc has gone quiet — the recession-odds watch transfers to this ledger. | — (stance set) | 2026-09-19 (medium, ≥31d band: every 21d) |

**Rules.** Rows append only — editing a past row is falsification. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed to `market-events.ts` as an `estimate` in
the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first),
never from memory — after which this doc goes quiet.
