# S&P Global Flash US PMI (Sep 2026) — sp-global-flash-us-pmi-2026-09-23

**Kind:** macro-print · **Date:** 2026-09-23 (**estimate**, `EST:` — S&P Global's own PMI calendar listing *and* the embargo line of three consecutive flash press releases, all fetched direct 2026-09-09 HTTP 200; the `estimate` label is a **schema gap**, not date doubt — see leg 1) · **Impact:** medium
**Last assessed:** 2026-09-09
<!-- probe-ref: {"symbols":{},"vix":15.72,"daysBand":"medium:8+","adjacentIds":["boj-decision-2026-09-18","census-benchmark-revision-nsa-2026-09-28","dallas-fed-mfg-2026-09-28","durable-goods-2026-09-25","ecb-economic-bulletin-2026-09-24","industrial-production-2026-09-18","jgb-liquidity-enhancement-5-11y-2026-09-25","meta-connect-2026-09-23","missouri-map-tro-expiry-2026-09-22","missouri-uocava-ballot-mailing-2026-09-19","new-home-sales-2026-09-24","opex-2026-09-18","retail-benchmark-revision-2026-09-28","russell-quarterly-ipo-review-effective-2026-09-21","scoos-2026-09-24","sp-global-flash-eurozone-pmi-2026-09-23","sp-quarterly-rebalance-effective-2026-09-21","steel-imports-preliminary-2026-09-24","treasury-2y-frn-2026-09-23","treasury-2y-note-2026-09-22","treasury-5y-note-2026-09-23","treasury-7y-note-2026-09-24","treasury-buyback-20y30y-2026-09-24","trump-xi-summit-2026-09-24","umich-sentiment-final-2026-09-25","unga-81-general-debate-2026-09-22","unsc-iran-panel-mandate-expiry-2026-09-26"],"screenStreak":0,"blocked":[{"url":"https://www.pmi.spglobal.com/Public/Home/PressReleases","status":"404","at":"2026-09-09"}]} -->

## At a glance

**TL;DR.** **Watch this one at 09:45 ET — but do not trade it, and the two halves of that sentence
rest on two different measurements.** The [S&P Global Services final ledger](sp-global-services-pmi-2026-10-05.md)
argued that this survey's *final* release is quiet because the number already arrived on the flash,
and left the flash's own window explicitly **unmeasured**. Measured here first-hand for the first
time, on 5-minute bars across the **three** flash release days in sample (**2026-06-23**,
**2026-07-24**, **2026-08-21**): the **09:45–10:00 ET window** ran **above its own median in 11 of
14 instrument-days** and **at or above p90 in 5 of 14** against a **10%** base rate — the mirror
image of the same window on the two *final* release days, which ran **below** its own median in
**9 of 10**. **The flash is the loud half and the final is the quiet half, exactly as the
pre-announcement story predicts.** That is the case for watching. The case against trading it is
the second measurement: across those same three days the composite beat its prior every time
(**+0.7 / +1.7 / +1.5**) and the equity sign went **up, down, down** while yields went **down,
down** — **loud is not the same as readable**, and there is no reaction function here to size. The
date is `estimate` only because this calendar's source-prefix schema has no slot for a private PMI
compiler; it was read verbatim off the publisher's own calendar *and* off three of its own embargo
lines today. Nothing here is a trade.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-14) | **Stand aside** | High | `symbols: []`, no macro-keyed house playbook, and — the load-bearing reason — three release days produced three composite beats and three different tape reactions. A window that is loud but directionally unreadable is a thing to watch, never a thing to size. | **2026-09-23:** the 09:45–10:00 ET window resolving in the *same* cross-instrument direction the print's own surprise implies (a beat → SPY/QQQ/IWM up and `^TNX` up together, or a miss → the reverse) in **4 or more** of SPY/QQQ/TLT/IWM/`^TNX` — one clean reaction function is not a licence, but it reopens a question this row closes |
| This week | **Watch 09-16 FOMC, then mark 09-23 at 09:45 ET — this is the print the September survey actually delivers** | High | Nothing about this survey moves before 09-23. The regime it lands into is set at the **09-16 FOMC** (SEP + dot plot), and the flash's own collection window runs the **second half of the month**, so the September flash is the first US business survey whose panel answered *after* that decision. | **2026-09-23:** S&P Global failing to publish a September Flash US PMI, or publishing it at a slot other than 09:45 ET — every call in this document is keyed to that date and that slot, and all four horizons die with it |
| This month | **Treat the flash, not the final, as this survey's tradeable-window candidate — and record that the candidacy failed on direction, not on volume** | Medium | Measured: the flash window beat its **same day's** 09:30–09:45 opening window in **11 of 14** instrument-days against a measured **48%** base rate, and beat the following 10:00–10:15 window in **11 of 14** against **51%**. The final's window did neither (**3 of 10** and **2 of 10**). **Medium, not High: n=3 release days**, and one of the three (**08-21**, also monthly opex) was quiet. | **2026-09-23:** the 09:45–10:00 window ranking **below** its own median in **3 or more** of the five instruments — the loud finding goes 1-for-2 out of sample, the `medium` impact tier set in this PR reverts to `low`, and the n=3 pattern is re-measured rather than patched ([FT-sp-global-flash-us-pmi-2026-09-23-1](../forward-tests/sp-global-flash-us-pmi-2026-09-23.md)) |
| This quarter | **Keep the pair, and read them as one instrument: the flash is the number, the final is the receipt** | Medium | Flash→final revisions measured from S&P Global's own consecutive releases run **−0.2 / −0.1 / +1.0 / −0.3** on services (mean **0.40pt**), so the final is a small correction to a number the tape has held for ~12 days. Two entries, one survey, and only one of them has a live window. | **A September flash→final revision beyond ±1.0pt on 2026-10-05** — the "final is a receipt" framing stops holding, the four-month 0.40pt mean stops being the right prior, and both entries get re-argued from a longer series |

**Signals & conditions** — the buy/sell/hold triggers:

- **No buy and no sell signal exists off this event.** `symbols: []`, no macro-keyed playbook, and the date is `estimate`. Research is not action; an estimate widens caution and never licenses an entry.
- **This is the diary date for the whole survey** — 09-23 09:45 ET carries the panel; [10-05](sp-global-services-pmi-2026-10-05.md) carries a revision averaging **0.40pt**.
- **Expect a live 09:45–10:00 window and do not expect to read it.** Measured 11 of 14 instrument-days above the window's own median; measured zero directional consistency across three consecutive beats.
- **The window on 09-23 is clean of tracked competitors** — nothing this calendar carries lands between **09:30 and 10:30 ET** that day. The 5Y note auction is **13:00 ET**, the 2Y FRN **11:30 ET**, Meta Connect's keynote is afternoon.
- **The one named same-morning confound is European, and it is now on the calendar** — S&P Global's Flash Eurozone PMI prints **08:00 UTC / 04:00 ET** the same day, same compiler, same reference month (proposed in this PR, `estimate`). Named, not sized.
- **A sub-50 composite flash on 09-23** → 2026's **52.2–56.0** expansion range breaks and every base rate in this document stops applying.
- **A manufacturing/services split is the norm, not a signal** — August: services **56.8** (20-month high) against manufacturing output **51.9** (13-month low), from the same release.
- **Watch (dated):** CPI **09-11** · **FOMC 09-16** · triple witching **09-18** · UNGA leaders' week **09-22** · **this print 09:45 ET, 09-23** · **Trump–Xi summit 09-24** · PCE + funding deadline **09-30** · S&P Global US Manufacturing PMI + ISM mfg **10-01** · jobs **10-02** · **the 10-05 final** · CPI **10-14** · FOMC **10-28**.

## Initial research

### The question, plainly

The [S&P Global Services final ledger](sp-global-services-pmi-2026-10-05.md) discovered this event
on 2026-09-09, proposed it, and named it *"the informative half of a survey this calendar has now
started tracking at its uninformative end."* It also wrote down, in the proposal itself, exactly
what it had **not** done: *"NOT YET MEASURED: whether the flash's own 09:45–10:00 window is loud is
an open question its initial research should answer first-hand, and nothing here asserts it is."*
It then registered that gap as a kill switch on its own causal story — *"the 2026-09-23 flash's own
09:45–10:00 window is also dead quiet → then pre-announcement is not what makes the final quiet,
the whole 09:45 slot simply is."*

So: **(1)** is the date and the slot right, on a primary source rather than a derivation?
**(2)** Is the flash's own 09:45–10:00 window loud, quiet, or ordinary — the sibling's open
question, and the reason this session exists? **(3)** If it is loud, is it *readable* — does the
tape move in a direction the print implies, which is the only thing that separates "watch" from
"trade"?

**One-line verdict:** the date and the 09:45 ET slot hold on **two independent primaries**; the
flash window is **measurably loud** and the sibling's causal story **survives its own kill switch**;
and the window is **not readable** — three consecutive composite beats produced three different
tape reactions, which is why this document raises the impact tier to `medium` and still calls
stand-aside.

### Method

Macro-print mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — `symbols: []`, so no
symbol-keyed instrument applies; the instrument caches were busted anyway
(`rm -rf node_modules/.cache/earnings-cycle node_modules/.cache/intraday-edges`) because this
session re-fetches Yahoo bars through the same layer. Four strands.

**(a) The date and slot, from two publisher primaries.**
`pmi.spglobal.com/Public/Release/ReleaseDates?language=en` fetched direct (**HTTP 200, 23,858
bytes**) and parsed to text. Separately, the three most recent US flash **press releases** were
fetched as PDFs (**HTTP 200**, 130,868 / 129,853 / 132,394 bytes) and text-extracted in-session, so
the release *time* rests on the publisher's own embargo line rather than on a calendar row alone.

**(b) An intraday window study — the load-bearing measurement, and deliberately the sibling's
construction.** Yahoo **5-minute** bars for **SPY, QQQ, TLT, IWM, `^TNX`**, `range=60d` (delivered
2026-06-12 → 2026-09-08; **n=60** sessions, **50** for `^TNX`, whose series starts 06-29). Four
15-minute windows per session, each computed as *open of the bar starting A → close of the bar
starting B−5m*: **09:30–09:45** (opening control) · **09:45–10:00** (the release window) ·
**10:00–10:15** · **10:15–10:30** (post control). Each window's |move| on a release day is
percentile-ranked against **that same window's own distribution** across the sample. This is
byte-for-byte the construction the [final's ledger](sp-global-services-pmi-2026-10-05.md) used, so
the two sets of readings are directly comparable and the flash-vs-final contrast is not an artefact
of two different methods. Flash release days in sample: **2026-06-23**, **2026-07-24**,
**2026-08-21**. Final release days, re-run here rather than carried: **2026-08-05**, **2026-09-03**.

**(c) A survey series, primary-derived.** Each flash press release states the prior month's
**final** in parentheses beside the new flash, so the three PDFs pin both terms across four months
of composite, services and manufacturing readings.

**(d) Calendar-structure computation, from the repo.** Corridor density via the same ±5-day
`computeAdjacentIds` (`scripts/event-material-decide.mjs`) the deterministic screen uses; same-day
and same-window competitors read off the checked-in calendar directly.

Spot **VIX 15.72** is this session's own `^VIX` fetch (2026-09-08 close). The date is `estimate` and
that label rides every trading-adjacent line below.

### Conviction legs, tested

1. **The date is 2026-09-23 and the slot is 09:45 ET — SUPPORTED on two independent primaries, and
   the `estimate` label is a schema gap, not doubt.** The calendar row reads verbatim
   **`September 23 … 13:45 UTC S&P Global Flash US PMI`**; 13:45 UTC is 09:45 ET under EDT. That is
   the same evidence the proposal carried. What is new here is the **second, stronger primary**: the
   embargo line of the publisher's own last three flash releases, extracted from the PDFs this
   session fetched —

   | Release | Embargo line, verbatim | Collection window |
   |---|---|---|
   | June 2026 flash | *"News Release Embargoed until 0945 EDT (1345 UTC) 23 June 2026"* | 11–22 June 2026 |
   | July 2026 flash | *"…Embargoed until 0945 EDT (1345 UTC) 24 July 2026"* | 09–23 July 2026 |
   | August 2026 flash | *"…Embargoed until 0945 EDT (1345 UTC) 21 August 2026"* | 12–20 August 2026 |

   Three consecutive months at **0945 EDT**, stated by the publisher in the document itself. It
   stays `estimate` because `market-events-data.ts` defines **no** confirmed-source prefix covering
   a private PMI compiler (`CAL:` is *"automated aggregator cross-ref"* and this is the publisher's
   own primary), and this lane's hard limits permit a flip only on `IR:`/`BLS:`/`FED:`. This is the
   **third** lane to hit that gap; it is named as a standing schema defect, not re-argued.
   **One honest asymmetry:** the calendar page publishes a rule for the *finals* (*"Manufacturing
   PMI: first working day; Services PMI: third working day"*) and **none for the flash** — the three
   dates above are the 23rd, the 24th and the 21st, so the flash date cannot be derived and rests on
   the listing. That is a real limit, and it is why the *date* falsifier below is the cheapest one in
   this document.

2. **The flash's own 09:45–10:00 window is LOUD — SUPPORTED, and this is the session's main
   measurement and the answer to the question the sibling left open.**

   | Instrument | 2026-06-23 | pct | 2026-07-24 | pct | 2026-08-21 | pct |
   |---|---|---|---|---|---|---|
   | SPY | +0.309% | **p90** | −0.173% | p68 | −0.085% | p43 |
   | QQQ | +0.574% | **p88** | −0.575% | **p90** | −0.056% | p13 |
   | TLT | +0.075% | p53 | +0.192% | **p95** | +0.067% | p52 |
   | IWM | +0.547% | **p90** | −0.318% | **p75** | −0.107% | p28 |
   | `^TNX` | *no bars* | — | −0.426% | **p96** | −0.169% | p68 |

   **11 of 14** instrument-days sit **above** the window's own median; **7 of 14** at or above
   **p75** against a 25% base rate; **5 of 14** at or above **p90** against a **10%** base rate. Two
   controls, both computed on this sample rather than assumed: the flash window beat that **same
   day's** 09:30–09:45 opening window in **11 of 14**, against a measured base rate of **48%**
   (140/290 instrument-sessions); and it beat the following **10:00–10:15** window in **11 of 14**,
   against a measured **51%** (148/290).

3. **The final's window is QUIET on the same construction — SUPPORTED, independently re-run, and the
   contrast is the finding.** The sibling's readings reproduce exactly: on **2026-08-05** and
   **2026-09-03** the 09:45–10:00 window ran **SPY p13/p18 · QQQ p2/p8 · TLT p33/p0 · IWM p78/p25 ·
   `^TNX` p48/p10** — **9 of 10 below its own median**, beating the same day's opening window in
   only **3 of 10** and the following window in only **2 of 10**. Side by side, with one method and
   one sample:

   | Window, 09:45–10:00 ET | Above its own median | ≥ p90 | Beat same-day 09:30 window | Beat following 10:00 window |
   |---|---|---|---|---|
   | **Flash** days (n=3) | **11 / 14** | **5 / 14** | **11 / 14** | **11 / 14** |
   | **Final** days (n=2) | 1 / 10 | 0 / 10 | 3 / 10 | 2 / 10 |
   | *base rate* | *50%* | *10%* | *48%* | *51%* |

   **The sibling ledger's kill switch does not fire.** Its "This quarter" falsifier was *"a measured
   flash release whose own 09:45–10:00 window is also dead quiet — then the pre-announcement
   mechanic is not what makes 10-05 quiet, the whole 09:45 slot simply is."* The flash window is not
   dead quiet; it is the loudest reading either document has produced for that slot. The
   pre-announcement mechanism survives the test it wrote for itself. (Recorded here as evidence;
   **that ledger's forward test is not scored or touched by this session** — it is the sibling's row.)

4. **The window is LOUD but not READABLE — REFUTED as a tradeable edge, and this is why the call is
   still stand-aside.** Every one of the three flash days delivered a composite **beat** on the prior
   month, two of them multi-year highs, and the tape did something different each time:

   | Date | Flash composite (prior final) | Δ | Headline, verbatim | SPY | `^TNX` |
   |---|---|---|---|---|---|
   | 2026-06-23 | 52.2 (May 51.5) | **+0.7** | *"5-month high"* | **+0.31%** | *no bars* |
   | 2026-07-24 | 53.6 (June 51.9) | **+1.7** | *"8-month high"*, but *"selling prices rise at fastest rate for nearly four years"* | **−0.17%** | **−0.43%** |
   | 2026-08-21 | 56.0 (July 54.5) | **+1.5** | *"52-month high … price pressures cool"* | **−0.09%** | **−0.17%** |

   Three beats, equity signs **+ / − / −**, and on 07-24 a *growth* beat printed alongside **falling
   yields and falling equities** — the shape of a growth scare, not of the number that was released.
   A window that moves and cannot be predicted is a **watch**, never a size. This is the leg that
   keeps the impact tier honest: `medium` here means *this deserves a real look*, not *this is
   tradeable*.

5. **The impact tier is raised low → medium, on the measurement above — and it carries its own
   falsifier.** The proposal filed this event `low`, inheriting the final's tier before anyone had
   measured the flash. A window at or above p90 in **5 of 14** instrument-days against a 10% base
   rate is not a low-impact print. The precedent is already in this calendar: **chicago-pmi-2026-09-30**
   sits at `medium` on the **same 09:45 ET slot** with the same `symbols: []` shape. The tier change
   is written into `src/domain/market-events/sp-global-flash-us-pmi-2026-09-23.json` with the
   evidence and the reversion condition in its `notes`, and its practical effect at D-14 is nil —
   both `low:0+` and `medium:8+` reassess every **7** days.

6. **The 09-23 window is clean of tracked competitors, and its one named confound is European —
   SUPPORTED, computed, and half-closed in this PR.** **27** tracked events sit within ±5 days of
   09-23. Same-day members are `meta-connect-2026-09-23` (afternoon keynote),
   `treasury-2y-frn-2026-09-23` (11:30 ET) and `treasury-5y-note-2026-09-23` (13:00 ET) — **none in
   09:30–10:30 ET**. The corridor's weight sits either side: **FOMC 09-16** with the SEP and dot
   plot, **triple witching 09-18**, **UNGA leaders' week from 09-22**, and the **Trump–Xi summit
   09-24** the following day. What the calendar could *not* see is that S&P Global publishes its
   **Flash Eurozone PMI at 08:00 UTC / 04:00 ET the same morning** — same compiler, same reference
   month, hours before the US cash open, and the one dated same-day thing that could put European
   risk tone inside a US window this document calls clean. **Proposed in this PR** as
   `sp-global-flash-eurozone-pmi-2026-09-23`, `estimate`, off the same primary listing. Named, not
   sized: no bar work was done on it.

7. **The September flash is the first US business survey whose panel answered after the 09-16 FOMC —
   SUPPORTED from the releases' own collection windows, and it is a reason to read it, not to trade
   it.** The three PDFs state their collection windows verbatim (leg 1's table): **11–22 June**,
   **09–23 July**, **12–20 August** — the publisher's own methodology note says responses *"are
   collected in the second half of each month."* A September window of roughly the same shape opens
   before and closes after **09-16**, so this is the earliest read on how ~1,150 panelists
   (**~650 manufacturers and ~500 service providers**, per the release) describe conditions with the
   September decision and the dot plot in hand. That is genuine informational content. Leg 4 is why
   it still is not a trade.

### What the conditions support

Nothing directional, and the useful output is a **confirmation**, a **retirement** and a
**correction**. Concretely: **(a)** the sibling's pre-announcement story is **confirmed** against
its own kill switch — the flash window is loud and the final's is quiet, on one method and one
sample, so the pair should be read as *number then receipt*; **(b)** the open question *"is the
09:45 slot simply dead?"* is **retired** — it is not, and any future intraday work on a 09:45 ET
print should distinguish flash from final rather than treating the slot as a single object;
**(c)** the tier this event was filed at is **corrected** to `medium` with a stated reversion
condition; **(d)** the honest ceiling is *watch* — three release days, three beats, three different
reactions, and no reaction function to size. Three dated items: **09-16** (the FOMC that sets what
this print lands into and that the September panel answers after), **09-23** (this print, which
scores this ledger's forward test) and **10-05** (the final, which scores the sibling's). None of
that licenses an entry.

### Honest limits

**The loud finding rests on n=3 release days, and one of the three disagrees.** Sixty days of Yahoo
5-minute bars is the entire sample available at 15-minute resolution, and it contains exactly three
flash releases. **2026-08-21** was quiet on four of five instruments — and it is also the sample's
one flash day carrying a tracked competing event, `opex-2026-08-21` (monthly expiration), whose
own 09:30–09:45 opening window ran **QQQ p80**. That is offered as an observation, **not** as an
excuse: it is a post-hoc explanation for the one day that cuts against the finding, and this
document does not lean on it. Naming it and discounting it would be the same error the sibling
ledger measured its way out of. **The five instruments are correlated**, so the effective n behind
"11 of 14" is well under fourteen. **The percentile ranks use a 60-session window that includes the
release days themselves**, which biases mildly *toward* rejecting the null rather than toward the
finding — the direction of that error does not flatter this document. **Jackson Hole was ruled out
as a confound but on a secondary source** — the 2026 symposium is reported as **Aug 27–29**, a week
after the quiet flash day; that is press-reported, not read off kansascityfed.org. **Leg 4's
directional reading is qualitative.** Three days is not a reaction-function study; the claim made
is the weak one — *no consistent direction was observed* — not the strong one that none exists.
**No consensus term was collected.** Unlike the final's revision, a flash *does* carry a published
forecast, so a genuine surprise-versus-expectation test is available here and was **not run** —
the two consensus figures search returned (June services ~51.0, August manufacturing 53.9) are
secondary, unverified against a primary, and are deliberately not used in any leg. That is the
single largest piece of work this document leaves on the table. **Leg 6 is a statement about the
checked-in calendar, not about the world** — several corridor members, and the Eurozone proposal
filed here, are themselves `estimate`-dated, and a 10:00 ET release this calendar does not track
could sit next to any of the measured windows. **One fetch failed:** the press-release index path
the sibling ledger recorded, `pmi.spglobal.com/Public/Home/PressReleases`, returned **404** and is
logged in `probe-ref.blocked`; every figure in this document comes from a fetch that returned
**200**. Worth recording for the next session: the *flash* release PDFs were directly fetchable
today, where the sibling found the *final* services PDF returning 202-with-empty-body on eight
attempts.

## Stance & kill switches

**Stance (date `estimate`; read verbatim off S&P Global's own calendar listing *and* off three
consecutive embargo lines in the publisher's own press releases by this session's direct fetches,
and `estimate` only because this calendar's source-prefix schema has no slot for a private PMI
compiler).** Treat **2026-09-23 09:45 ET** as a **medium-impact print with a live 15-minute window
and no readable direction**. No position is opened, closed or sized off it, and no house playbook
targets it. Three claims, held separately. **Volume:** the 09:45–10:00 window is measurably loud —
above its own median in **11 of 14** instrument-days across three release days, at or above **p90**
in **5 of 14** against a 10% base rate, and beating both the same day's opening window and the
following window in **11 of 14** each against measured base rates of 48% and 51%. **Direction:**
nil, and this is the binding constraint — three consecutive composite beats (**+0.7 / +1.7 /
+1.5**) produced equity signs of **+ / − / −**, including a growth beat on 07-24 that printed with
**falling** yields and **falling** equities. **Relationship to its own sibling:** the
[final's ledger](sp-global-services-pmi-2026-10-05.md) wrote a kill switch reading *"the 09-23
flash's own window is also dead quiet"*; measured, it **is not**, so that ledger's pre-announcement
mechanism survives and the pair should be read as **number (09-23) then receipt (10-05)**. Base
case for the September flash (**estimate**-labelled, **Low** confidence, trend extrapolation only
at D-14): a composite in the **52–57** band consistent with 2026's 52.2–56.0 range, with the
services/manufacturing split that has run all summer (August: services **56.8** vs manufacturing
output **51.9**). Operationally: **diary 09-23; watch the window; trade nothing** — and read the
number for what the panel says about post-FOMC conditions, which is the one thing this release
uniquely carries.

**Kill switches:**

- **The 09:45–10:00 ET window on 2026-09-23 ranks below its own median in 3 or more of
  SPY/QQQ/TLT/IWM/`^TNX`** — the loud finding goes 1-for-2 out of sample, the `medium` impact tier
  set in this PR reverts to `low`, and leg 2 is re-measured on a longer window rather than patched.
  Registered as **FT-sp-global-flash-us-pmi-2026-09-23-1**.
- **The 09:45–10:00 window on 2026-09-23 resolves in the direction the print's own surprise implies
  in 4 or more of the five instruments** — leg 4's "loud but unreadable" claim takes its first
  contradiction, and a reaction-function study (with a primary consensus term, which this document
  did not collect) becomes worth running before the October flash.
- **S&P Global does not publish a September Flash US PMI on 2026-09-23, or publishes it at a slot
  other than 09:45 ET** — the flash date follows no rule the publisher states (23rd, 24th, 21st over
  three months, leg 1), so this is the cheapest falsifier in this document and it kills all four
  horizon calls at once.
- **A September flash→final revision beyond ±1.0pt on 2026-10-05** — the "final is a receipt"
  framing stops holding, the four-month 0.40pt mean stops being the right prior, and both entries in
  this pair get re-argued from a longer series.
- **A sub-50 composite flash** — 2026's **52.2–56.0** expansion range breaks and every base rate in
  this document, including the intraday ones, stops applying to a regime it was not measured in.
- **A tracked or untracked catalyst lands inside 09:30–10:30 ET on 2026-09-23** — leg 6's
  clean-window claim is a read of the checked-in calendar, not of the world; the measurement is
  still valid but its attribution to this print is not, and the day is carried rather than scored.
- **`market-events-data.ts` gains a confirmed-source prefix covering a private PMI compiler** — this
  entry and the Eurozone proposal filed with it should be promoted to `confirmed` on the listing and
  embargo lines already cited, because the date was never the doubt.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-09 | D-14 | Initial research banked (above); **canonical `src/domain/market-events/sp-global-flash-us-pmi-2026-09-23.json` written this PR**, reading the one proposal that existed (`…from-sp-global-services-pmi-2026-10-05.json`) as input per EVENT-RESEARCH.md. **DATE + SLOT — upgraded to two independent primaries.** The calendar row reads **`September 23 … 13:45 UTC S&P Global Flash US PMI`** (= 09:45 ET, EDT); new here is the publisher's own embargo line in three consecutive flash PDFs fetched direct today (HTTP 200): **`0945 EDT (1345 UTC) 23 June 2026`**, **`… 24 July 2026`**, **`… 21 August 2026`**. Stays `estimate` on a **schema gap** — no confirmed prefix covers a private PMI compiler; third lane to hit it. Honest asymmetry: the page states a rule for the *finals* only, so the flash date rests on the listing and cannot be derived (23rd/24th/21st). **SESSION'S MAIN MEASUREMENT — the flash window is LOUD, answering the question the proposing ledger explicitly left open.** Yahoo 5-minute bars, `range=60d` (2026-06-12..09-08; n=60 sessions, 50 for `^TNX`), the sibling's exact window construction so the two are comparable. Across the **three** flash days (**06-23 · 07-24 · 08-21**) the **09:45–10:00** window ran **SPY p90/p68/p43 · QQQ p88/p90/p13 · TLT p53/p95/p52 · IWM p90/p75/p28 · `^TNX` —/p96/p68** → **11 of 14 above its own median**, **7 of 14 ≥p75** (25% base), **5 of 14 ≥p90** (10% base); it beat the **same day's** 09:30 window in **11 of 14** (measured base **48%**, 140/290) and the following 10:00 window in **11 of 14** (**51%**, 148/290). Final days re-run, not carried: **08-05 / 09-03** gave **1 of 10** above median, **3 of 10** and **2 of 10** on the same controls. **The sibling's kill switch does NOT fire** — its falsifier was *"the 09-23 flash's own window is also dead quiet"*; it is the loudest reading either document has produced for that slot, so the pre-announcement mechanism survives. Its forward test is **not scored or touched here** — the sibling owns that row. **BUT THE WINDOW IS NOT READABLE, and that is the binding constraint.** All three days delivered composite beats — **52.2 (May 51.5, +0.7) · 53.6 (Jun 51.9, +1.7) · 56.0 (Jul 54.5, +1.5)**, all from the primary PDFs — and the equity sign went **+ / − / −**; on 07-24 an 8-month-high growth print landed with **^TNX −0.43%** and **QQQ −0.58%**, the shape of a growth scare. Loud ≠ tradeable. **IMPACT RAISED low → medium** on that measurement, with a stated reversion condition in the JSON's `notes`; precedent is `chicago-pmi-2026-09-30`, `medium` on the same 09:45 slot. Practical effect at D-14 is nil — both bands reassess every 7d. **Panel/collection detail worth carrying:** the PDFs state collection windows **11–22 Jun / 09–23 Jul / 12–20 Aug** over **~650 manufacturers + 500 service providers**, so the September flash is the first US business survey whose panel answered **after the 09-16 FOMC**. Adjacency sweep — **peers:** n/a, `symbols: []`. **Macro surprises:** payrolls 09-04 **+162k vs +55k**, September hike odds ~**58%** into the 09-16 FOMC — carried from the [jobs close-out](jobs-2026-09-04.md), not re-derived. **Volatility regime:** spot VIX **15.72** (09-08 close, own `^VIX` fetch); no prior row to diff, so this row establishes the baseline. **Geopolitical:** **UNGA leaders' week opens 09-22** and the **Trump–Xi summit lands 09-24** (tracked `high`), i.e. the corridor's real risk sits the day *after* this print, not on it. **Event tape:** a flash, unlike a revision, *does* carry a published consensus — search returned June services ~51.0 and August manufacturing 53.9, both **secondary and unused**; collecting a primary consensus term and running a surprise-vs-expectation test is the largest piece of work this document leaves open. **Corridor:** **27** tracked events within ±5 days; same-day members are Meta Connect (afternoon), the 2Y FRN (11:30 ET) and the 5Y note (13:00 ET) — **none in 09:30–10:30 ET**. **One adjacency PROPOSED in this PR**, off the same primary listing: **`sp-global-flash-eurozone-pmi-2026-09-23`** (08:00 UTC / 04:00 ET, same compiler, same reference month) — the one dated same-morning confound that could put European risk tone inside a window this row calls clean; named, not sized. **Confound checked and cleared:** Jackson Hole 2026 is **Aug 27–29** (secondary), a week after the quiet 08-21 flash; that day's only tracked competitor is **`opex-2026-08-21`**, recorded as a post-hoc observation this document does **not** lean on. **Blocked, recorded not worked around:** `pmi.spglobal.com/Public/Home/PressReleases` returned **404**; every figure here comes from a 200. **Registered FT-sp-global-flash-us-pmi-2026-09-23-1** (one-sided against the loud finding, scored 09-24). | — (stance set) | 2026-09-16 (medium, 8+d band: every 7d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-sp-global-flash-us-pmi-2026-09-23.json`
(`status: "estimate"`) in the same PR — your own file, never another event's canonical one (#1717).
Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from
memory — after which this doc goes quiet.
