# Conference Board Consumer Confidence (Dec 2026), last-Tuesday slot — consumer-confidence-2026-12-29

**Kind:** macro-print · **Date:** 2026-12-29 (estimate, EST: the publisher's stated "last Tuesday of every month" rule applied forward to December 2026 — a slot the Conference Board has not used since 2019 and publicly moved off in 2020) · **Impact:** low
**Last assessed:** 2026-09-06
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"low:15+","adjacentIds":["advance-economic-indicators-2026-12-28","boj-summary-of-opinions-2026-12-28","china-retaliation-suspension-expiry-2026-12-31","christmas-eve-half-day-2026-12-24","fhfa-hpi-2026-12-29","fomc-minutes-2026-12-30","georgia-psc-data-center-cost-shift-2026-12-31","japan-cpi-tokyo-flash-2026-12-25","jpx-market-closure-2026-12-31","nerc-computational-load-standards-2026-12-31","sifma-bond-early-close-2026-12-31","sifma-japan-early-close-2026-12-28","sifma-uk-bond-market-closure-2026-12-28"],"screenStreak":0,"blocked":[]} -->

## At a glance

**TL;DR.** **This id is a slot the publisher itself abandoned, and there is a wire quote saying so
about this exact date.** It was proposed by the `fhfa-hpi-2026-12-29` sweep by applying the
Conference Board's stated rule — *"at 10 a.m. ET on the last Tuesday of every month"* — forward to
December 2026. In December 2020 the Board issued an advisory reading, verbatim: *"The Conference
Board's December Consumer Confidence Index® release date **has moved from December 29th** at 10 AM
ET to tomorrow, December 22nd, at 10 AM ET."* **December 29 is the slot the Board scheduled and then
vacated**, and **six consecutive editions since (2020→2025) have all landed before Christmas**. The
real December 2026 print is already on the calendar as
[`consumer-confidence-2026-12-22`](consumer-confidence-2026-12-22.md), window **12-21→12-23**. What
this session adds beyond that sibling is the **date of the regime break and its receipt**: widening
the sample back to 2016 shows the pre-2020 December print landed **on or after Christmas four years
running** — 2016-12-27 **and 2019-12-31 were exact last Tuesdays** — so this id is not absurd, it is
**six years stale**. Second finding, a correction to a live sibling claim:
[`fhfa-hpi-2026-12-29`](fhfa-hpi-2026-12-29.md) rests its central confound on *"68 of 68 measured
release days since 2021 are also CB days."* Its own five December observations are **not** CB days —
FHFA took 12-28/12-27/12-26/12-31/12-30, the Board took 12-22/12-21/12-20/12-23/12-23. Corrected:
**63 of 68**, and **FHFA's own 2026-12-29 session is de-confounded**, which is the opposite of what
that ledger tells its next reader. Date **estimate**; `symbols: []`; **0** macro-keyed playbooks;
nothing here licenses an entry.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-114) | **Stand aside** | High | `symbols: []`, D-114, and a re-grep of `trade-playbooks.md` and `multi-symbol-sweep.md` for any macro- or sentiment-keyed playbook returns **0 hits** today. There is nothing dated to act on, and on the evidence below there is no print here to act on either. | A macro-keyed house playbook landing in `docs/plans/trade-playbooks.md` before **2026-12-29** — none exists today |
| This week | **Stand aside — the series' live edition is the 09-29 print, not this slot** | High | The current release is **August 2026 (released 08-25)**: headline **89.4**, Present Situation **121.2**, Expectations **68.2**, cut-off **Aug 3–16**, re-read direct today. The Board's page names exactly one forward date, *"Tuesday, September 29th at 10 AM ET"*; **December 2026 is named nowhere**. VIX **14.53** (CBOE primary, 2026-09-04 close). | The Conference Board naming **2026-12-29** on its own page or wire before **2026-11-30** |
| This month | **Do not let this id stand as a second December print — one real-world release, two calendar rows** | High | Ten sourced editions (table in leg 2) put the December release **before Christmas in every year since 2020** and **on/after Christmas in every year 2016–2019**. The break is dated to **Dec 2020** and the Board wired the move itself. Two rows for one print would double-count the corridor and hand `/research` a phantom. | A Conference Board December 2026 release on **2026-12-29**, or on any date after **2026-12-24** |
| This quarter | **Treat 2026-12-29 as an FHFA-only 9:00 a.m. session — and pass that correction to the FHFA ledger** | Medium | [`fhfa-hpi-2026-12-29`](fhfa-hpi-2026-12-29.md) is **confirmed** on two FHFA primaries at **9:00 a.m. ET**. Its "68 of 68 are also CB days" is off by exactly its five December observations (**63 of 68**), so its 12-29 day is the modern set's **first de-confounded FHFA December session** — a cleaner observation than that ledger claims to have, not a dirtier one. Medium because the correction is arithmetic on two ledgers' sourced dates and the 2026 outcome is still forward. | The Conference Board publishing a December 2026 date of **12-29**, which would restore the session confound and re-validate the 68-of-68 framing |

**Signals & conditions** — the buy/sell/hold triggers:

- **No buy signal and no sell signal exists off this event.** `symbols: []`, 0 macro-keyed playbooks,
  and on the evidence below no Conference Board release occurs on this date at all.
- **The Conference Board names a December 2026 date** (expected late Nov, one month ahead per its own
  next-release convention) → adopt it verbatim on `consumer-confidence-2026-12-22`, not here.
- **That named date is 12-29** → this slot revives, the FHFA confound is restored, and both forward
  tests registered here are killed. Watch for it before **2026-11-30**.
- **A December 2026 cut-off outside Dec 15–17** → the modern ~7-day field-to-release lag has broken
  and the window derivation needs re-deriving from the new lag, not from the old dates.
- **Do not spend sessions hunting a consensus for this slot.** Conference Board consensus is withheld
  under publication restrictions (structural, established by the 09-29 sibling) and there is no print.
- **Watch (dated):** CB print **09-29** · CPI **10-14** · FOMC **10-28** · CB print **10-27** ·
  midterms **11-03** (est.) · CB print **11-24** (est.) · **FOMC 12-09** · **CPI 12-10** · **CR expiry
  12-11** (est.) · likely CB field cut-off **12-16** · opex **12-18** · **the real December print
  12-21→12-23** (est.) · half day **12-24** (est.) · **FHFA HPI 12-29, 9:00 ET (confirmed)** · FOMC
  minutes **12-30**.

## Initial research

### The question, plainly

This id exists only as `proposals/consumer-confidence-2026-12-29.from-fhfa-hpi-2026-12-29.json`, filed
by the FHFA lane on 2026-09-06 so that its own ledger's central confound would be visible on the
board. Initial research on a proposal-only id has one job before any other: **is the proposed event
real?** So: **does the Conference Board release a Consumer Confidence Index on 2026-12-29?** And if
not — what does the answer do to the two sibling ledgers that already depend on the assumption that
it does?

**One-line verdict:** it does not — **December 29 is the specific date the Board scheduled in 2020,
announced it was moving off, and has never returned to**, and the six-edition pre-Christmas regime
that started with that move puts the real December 2026 print on 12-21→12-23 where
`consumer-confidence-2026-12-22` already tracks it; the useful residue is that the FHFA sibling's
"68 of 68 shared sessions" is really **63 of 68**, which makes its own 12-29 print cleaner than it
believes.

### Method

Macro-print mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — `symbols: []`, so no
symbol-keyed instrument applies, `earnings-cycle.mjs` / `intraday-edges.mjs` were not run and the
cache-busting rule has no target. **Every source below was fetched direct today (2026-09-06) and
returned HTTP 200; nothing was blocked, so `probe-ref.blocked` is empty** — a first for this series
this week, and worth stating because both December siblings carry block lists.

The sample was deliberately widened past the 12-22 sibling's five years, because that ledger's
conclusion — *"no Tuesday rule survives"* — is a statement about the last five editions and cannot
distinguish "the rule never held in December" from "the rule held until a datable break." Sources:
the Conference Board's own topic page (the cadence sentence, the named next release, the August 2026
values and cut-off); the Board's December press pages for **2016** and its PRNewswire wire datelines
for **2017, 2018, 2019, 2020 (advisory), 2025**; and the Board's own
[*Update to the Consumer Confidence Survey*](https://www.conference-board.org/topics/consumer-confidence/press/Update-to-Consumer-Confidence-Survey)
page for the methodology date. The 2021–2024 datelines are **read from the
[`consumer-confidence-2026-12-22`](consumer-confidence-2026-12-22.md) sibling and cited to it**, not
re-fetched and not restated as this session's own primaries. Market reading: **VIX close 14.53
(2026-09-04)** off CBOE's own `VIX_History.csv` (HTTP 200, 472,309 bytes) — the primary, not Yahoo,
which returned 429 to two sibling lanes today.

### Conviction legs, tested

#### Leg 1 — the last-Tuesday rule is the Board's scheduled default and December is where it gets overridden · **SUPPORTED, with the override sourced from the wire**

The 12-22 sibling read the rule as simply false in December. The stronger and better-sourced reading
is that the rule **is** the schedule and December is a **discretionary pull-forward off it**. The
receipt is a PRNewswire advisory the Board issued the day before its December 2020 release, fetched
today at HTTP 200, dateline *"NEW YORK, Dec. 21, 2020 /PRNewswire/"*:

> *"As a reminder, The Conference Board's December Consumer Confidence Index® release date has moved
> from **December 29th** at 10 AM ET to tomorrow, December 22nd, at 10 AM ET."*

December 29, 2020 was the last Tuesday of that month. So the Board **did** schedule the last-Tuesday
December slot, **did** publish that schedule, and **then moved off it** — and the date it vacated is
byte-for-byte the date this id claims for 2026. That is a materially different finding from "the rule
is false": it explains why an automated last-Tuesday derivation lands on 12-29 (the Board's own
default) and why it is nonetheless wrong (December is the exception the Board announces).

The rule sentence itself is unchanged and still live, re-read on three separate documents today:
*"The Conference Board publishes the Consumer Confidence Index® at 10 a.m. ET on the last Tuesday of
every month"* — on the topic page, on the December 2016 wire, and on the December 2025 wire. **The
Board has never amended the sentence; it just does not apply it to December.**

#### Leg 2 — the pre-Christmas December regime is six editions old and starts at December 2020 · **SUPPORTED**

| Edition | Released | Weekday | Last Tuesday that December | Slot | Source (fetched 2026-09-06) |
|---|---|---|---|---|---|
| Dec 2016 | **2016-12-27** | Tue | 12-27 — **matched** | post-Christmas | PRNewswire dateline *"NEW YORK, Dec. 27, 2016"*, HTTP 200 |
| Dec 2017 | **2017-12-27** | Wed | 12-26 | post-Christmas | PRNewswire, dated Dec. 27, 2017, HTTP 200 |
| Dec 2018 | **2018-12-27** | Thu | 12-25 (Christmas Day) | post-Christmas | PRNewswire dateline *"NEW YORK, Dec. 27, 2018"*, HTTP 200 |
| Dec 2019 | **2019-12-31** | Tue | 12-31 — **matched** | post-Christmas | PRNewswire dateline *"NEW YORK, Dec. 31, 2019, 10:00 ET"*, HTTP 200 |
| Dec 2020 | **2020-12-22** | Tue | 12-29 | **pre-Christmas — the break** | PRNewswire advisory, dateline *"NEW YORK, Dec. 21, 2020"*, HTTP 200 |
| Dec 2021 | 2021-12-22 | Wed | 12-28 | pre-Christmas | cited to the 12-22 sibling |
| Dec 2022 | 2022-12-21 | Wed | 12-27 | pre-Christmas | cited to the 12-22 sibling |
| Dec 2023 | 2023-12-20 | Wed | 12-26 | pre-Christmas | cited to the 12-22 sibling |
| Dec 2024 | 2024-12-23 | Mon | 12-31 | pre-Christmas | cited to the 12-22 sibling |
| Dec 2025 | **2025-12-23** | Tue | 12-30 | pre-Christmas | PRNewswire dateline *"NEW YORK, Dec. 23, 2025"*, HTTP 200 |

**Ten editions, one clean break.** 2016–2019: four for four on or after Christmas, **two of them exactly
the last Tuesday** (2016, 2019). 2020–2025: **six for six before Christmas**, none the last Tuesday.
The regime is real, it is dated, and the transition edition announced itself.

Two consequences the five-year sample could not reach. First, **this id is stale, not nonsensical** —
under the pre-2020 practice a December 29 release was ordinary, and 2019's *was* the last Tuesday.
Anyone re-deriving the date from the Board's stated rule will keep landing here; the ledger is the
place that stops it. Second, **the regime is six observations old**, which is exactly why the call
above is "high" on the near horizons and only "medium" on the quarter: a six-year practice with no
published policy behind it is a strong prior, not a certainty, and the falsifier is dated accordingly.

#### Leg 3 — the online-panel transition is *not* the mechanism behind the slot change · **REFUTED (my own first hypothesis)**

The obvious story — the Board moved to an online panel, production got faster, so December could move
earlier — is wrong on dates. The Board's own update page is dated **May 18, 2021** and puts the
mail-to-online transition at **May 2021**: *"The survey questions and historical series dating back to
1967 will remain unchanged. Previously published data from January through April (based on our
long-time mail survey) will be amended to reflect the results of the online survey."* The December
slot moved in **December 2020**, five months earlier, under the mail panel. So the two changes are
independent and the slot change has **no published mechanism** — recorded as unexplained rather than
narrated, which is what holds the confidence at medium on the quarter horizon.

#### Leg 4 — the sibling's "fixed December 16 cut-off" is a modern-regime property, not a structural one · **MIXED — a refinement, not a demolition**

[`consumer-confidence-2026-12-22`](consumer-confidence-2026-12-22.md) treats the field cut-off as
*"December 16 on all three editions that state one (2021, 2024, 2025) — a fixed calendar date rather
than a floating lag,"* and builds its whole quarter-horizon call on that. The wider sample says the
fixed date is a property of the **post-2020 regime only**:

| Edition | Stated cut-off | Released | Field-to-release lag |
|---|---|---|---|
| Dec 2016 | **December 15** | 2016-12-27 | 12 days |
| Dec 2018 | **December 13** | 2018-12-27 | 14 days |
| Dec 2019 | **December 13** | 2019-12-31 | 18 days |
| Dec 2025 | **December 16** | 2025-12-23 | **7 days** |

Pre-2020 the cut-off was **December 13–15**, not 16, and the lag ran **12–18 days**. The modern
regime's lag is **6–7 days** (Dec 2025: 12-16 → 12-23), which is what makes "December 16" look fixed
across 2021/2024/2025 — those three releases all sit 6–7 days after it. **The sibling's conclusion
survives for 2026** (a 12-21→12-23 release implies a 12-14→12-17 cut-off, and 12-16 is the modal
value), **but its stated reason does not**: what is stable is the short modern lag, not a calendar
date the Board has fixed. That distinction is testable and is registered as `-2` below, because the
two readings diverge the moment the release date moves within its window.

#### Leg 5 — the FHFA sibling's central confound is overstated by exactly five observations · **REFUTED as stated; corrected to 63 of 68**

[`fhfa-hpi-2026-12-29`](fhfa-hpi-2026-12-29.md) declines a tape claim on the grounds that *"2026-12-29
is the last Tuesday of December, so Conference Board Consumer Confidence shares the session by the
publisher's own stated rule — **68 of 68** measured release days since 2021 are also CB days."* Both
ledgers' own sourced dates settle it, no new data required:

| December | FHFA release (last Tuesday, per that ledger's leg 2) | Conference Board release (leg 2 above) | Same session? |
|---|---|---|---|
| 2021 | 12-28 | 12-22 | **no** |
| 2022 | 12-27 | 12-21 | **no** |
| 2023 | 12-26 | 12-20 | **no** |
| 2024 | 12-31 | 12-23 | **no** |
| 2025 | 12-30 | 12-23 | **no** |

**Five of the sixty-eight are not CB days: 63 of 68.** The eleven months a year where both publishers
keep the last Tuesday are genuinely bundled; December is the one month they are not, and it is the
month that ledger's own event sits in. The consequence runs **against** that ledger's framing rather
than with it: **2026-12-29 would be an FHFA-only 9:00 a.m. session**, the modern set's first
de-confounded FHFA December observation. Its decline of the tape claim may well still be right on
power (n=1 de-confounded day settles nothing), but the *reason* it gives — a 100% session confound —
is not what its own dates say.

**This lane does not edit another event's file** (#1449) — the correction is recorded here, cited from
this ledger, and belongs on `fhfa-hpi-2026-12-29`'s next pulse. The mirror-image error was already
caught from the other side by the 12-22 sibling (which found the CB series' null had been measured on
FHFA days); this is the same underlying mistake seen from the FHFA side, on a claim that is still live.

#### Leg 6 — nothing here is a trade, on either date · **SUPPORTED**

`symbols: []` on this entry, on the 12-22 sibling and on the FHFA event. A re-grep of
[`trade-playbooks.md`](../../plans/trade-playbooks.md) and
[`multi-symbol-sweep.md`](../multi-symbol-sweep.md) for any macro- or sentiment-keyed playbook returns
**0 hits** today, unchanged from the four sibling editions. The date is `estimate` and, on the finding
above, is an estimate of a release that does not happen — which is the strongest possible version of
"estimates only widen caution."

### Honest limits

- **The 2021–2024 datelines are inherited, not re-fetched.** They are cited to the 12-22 sibling,
  which sourced them at HTTP 200 the same day. Five of the ten rows in leg 2 are this session's own
  primaries; the break year (2020) and the two anchors that matter most (2016, 2019, 2025) are among
  them.
- **Six observations is a regime, not a law.** No Conference Board document states a December policy.
  The pre-Christmas practice could revert without notice — and leg 3 removes the tidy mechanism that
  would have made reversion unlikely.
- **No December 2026 date exists anywhere yet.** The Board names one forward release at a time; the
  December date should appear on its page around late November 2026. Until then every date claim in
  this series, including the 12-22 sibling's, is derivation.
- **Leg 5 is arithmetic across two ledgers, not a re-run study.** It shows the *count* is wrong; it
  does not re-run the FHFA instrument on the corrected set, which is that lane's work to do.
- **A `low` impact tier is this session's call, not the proposer's.** The proposal filed `medium`,
  matching the real print. On the finding that no print occurs here, `low` (30-day pulses) is the
  honest tier; if the Board names 12-29, the tier goes straight back to `medium`.

## Stance & kill switches

**Stand aside — and stop the calendar carrying this as a second December print.** The Conference Board
Consumer Confidence Index for December 2026 is one real-world release, already tracked as
[`consumer-confidence-2026-12-22`](consumer-confidence-2026-12-22.md) with an estimated 12-21→12-23
window. `consumer-confidence-2026-12-29` is the naive forward application of the publisher's stated
last-Tuesday rule — the same slot the Board scheduled and publicly vacated in December 2020 — and on
ten sourced editions it has not been used since 2019. The canonical
`src/domain/market-events/consumer-confidence-2026-12-29.json` written by this session says exactly
that in its own title and shadows the proposal (which stays where it is: a lane never deletes another
lane's proposal, #1717). Date **estimate**; nothing on this date licenses an entry, and on the finding
there is nothing on this date at all from this publisher.

**Kill switches — any one ends this stance:**

- **The Conference Board names 2026-12-29** as its December release date, on its page or its wire, at
  any point before **2026-12-29**. The slot revives, the impact tier returns to `medium`, and both
  forward tests below are killed.
- **The Board publishes any December 2026 date after 2026-12-24.** The pre-Christmas regime is broken
  and the 12-22 sibling's window is wrong along with this ledger's reasoning.
- **A stated December 2026 cut-off outside December 15–17**, which breaks the modern 6–7 day lag that
  leg 4 substitutes for the sibling's fixed-date claim.
- **The FHFA lane re-running its instrument on the corrected 63-of-68 set and finding the correction
  immaterial** — the arithmetic in leg 5 would stand, but the consequence drawn from it would not.

**Two forward tests registered** in
[`forward-tests/consumer-confidence-2026-12-29.md`](../forward-tests/consumer-confidence-2026-12-29.md):
`-1` (no CB release occurs on 2026-12-29; FHFA's session there is de-confounded, making the corrected
count 63 of 69) and `-2` (the December 2026 cut-off falls 6–8 days before the release, wherever in the
window the release lands — the lag reading, against the sibling's fixed-12-16 reading). Deliberately
**not** re-registered: the 12-21→12-23 window prediction, which is already
`FT-consumer-confidence-2026-12-22-1`. Duplicating a sibling's row would inflate the register's `n`
with one observation counted twice, which is the one thing a forward-test register cannot afford.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-06 | D-114 | **Initial research on an id that existed only as `proposals/consumer-confidence-2026-12-29.from-fhfa-hpi-2026-12-29.json`, read first and now shadowed by the canonical file this session wrote. The proposal's event is not real, and there is a wire quote about this exact date.** **Leg 1 — the override is sourced:** the Board's PRNewswire advisory of *"NEW YORK, Dec. 21, 2020"* (HTTP 200) reads verbatim *"The Conference Board's December Consumer Confidence Index® release date has moved from **December 29th** at 10 AM ET to tomorrow, December 22nd, at 10 AM ET."* — 2020-12-29 was that month's last Tuesday, i.e. the Board scheduled this id's slot and vacated it. The rule sentence itself is live and unamended, re-read today on three documents. **Leg 2 — the regime break is dated to Dec 2020** on ten editions, five of them this session's own primaries: 2016-12-27 Tue (**= last Tuesday**), 2017-12-27 Wed, 2018-12-27 Thu (last Tuesday was Christmas Day), 2019-12-31 Tue (**= last Tuesday**), 2020-12-22 Tue (**the break**), then 2021-12-22 / 2022-12-21 / 2023-12-20 / 2024-12-23 / 2025-12-23 cited to the 12-22 sibling. Four for four on/after Christmas 2016–2019; six for six before it 2020–2025. This widens the sibling's five-year "no Tuesday rule survives" into "the rule was the schedule until a datable break," which is why this id keeps being re-derived. **Leg 3 — my own first hypothesis REFUTED:** the mail-to-online panel transition is dated **May 2021** on the Board's own update page, five months *after* the slot moved, so it is not the mechanism; the slot change has no published reason and is recorded as unexplained. **Leg 4 — the sibling's "fixed December 16 cut-off" is MIXED:** stated cut-offs run Dec **15** (2016), **13** (2018), **13** (2019) and **16** (2025), with lags of 12/14/18 days pre-2020 vs **7** days in 2025. The stable thing is the modern 6–7 day lag, not a fixed calendar date; the sibling's 2026 conclusion survives, its reason does not. **Leg 5 — CORRECTION TO A LIVE SIBLING CLAIM:** `fhfa-hpi-2026-12-29` declines its tape claim on *"68 of 68 measured release days since 2021 are also CB days"*; its own five December observations are not — FHFA 12-28/12-27/12-26/12-31/12-30 vs CB 12-22/12-21/12-20/12-23/12-23, zero overlap. **63 of 68**, and FHFA's own 2026-12-29 is the modern set's first de-confounded December session, cleaner than that ledger claims. Recorded here for that lane's next pulse; this lane does not edit another event's file (#1449). **Leg 6 — not a trade:** `symbols: []`, 0 hits re-grepping `trade-playbooks.md` and `multi-symbol-sweep.md` for a macro- or sentiment-keyed playbook. **Adjacency sweep — peers:** n/a, `symbols: []`. **Macro:** the corridor is unchanged and dense — 12-24 half day, 12-25 Tokyo CPI flash, the four-item 12-28, **FHFA HPI 12-29 at 9:00 ET (confirmed)**, `fomc-minutes-2026-12-30`, the five-item 12-31 cluster; the real CB print sits 12-21→12-23, outside the ±5-day window of this date. **Volatility:** VIX **14.53** (2026-09-04 close, CBOE `VIX_History.csv` primary, HTTP 200) — baseline, nothing to diff on a first assessment. **Geopolitical:** PL 119-103 funds through 12-11; a lapse would touch the real print's 12-16 cut-off, not this slot. **Event tape:** the Board names exactly one forward release, *"Tuesday, September 29th at 10 AM ET"*; December 2026 is named nowhere. **No new dated adjacent events discovered — no proposals filed.** **No blocked sources: every fetch returned HTTP 200 and `probe-ref.blocked` is empty.** **Impact downgraded `medium` → `low`** on the finding that no print occurs here. **Two forward tests registered** (`-1` de-confounded FHFA session / corrected 63-of-69; `-2` the 6–8 day cut-off lag), and the window prediction deliberately NOT re-registered because it is already `FT-consumer-confidence-2026-12-22-1`. | **Initial stance set: stand aside, and treat this id as a refuted slot rather than a December print — the Conference Board scheduled 2020-12-29, wired that it had moved off it, and has released before Christmas in all six editions since. The real December 2026 print is `consumer-confidence-2026-12-22` (12-21→12-23). Canonical calendar entry written to say so and to shadow the proposal; impact `medium` → `low`. Correction banked for the FHFA lane: its 68-of-68 session confound is 63 of 68, and its own 12-29 print is de-confounded.** | 2026-10-06 (low, 15+ band: every 30d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse: it is a note to
the next session, not an essay, and a stance *change* earns its sentence in the Stance section with
the row as its receipt. The adjacency sweep runs in every row; a dated adjacent event found gets
proposed as a new `src/domain/market-events/proposals/<id>.from-consumer-confidence-2026-12-29.json`
(`status: "estimate"`) in the same PR. Close-out fills `## Outcome` below from re-run instrument data
(cache busted first), never from memory — after which this doc goes quiet.
