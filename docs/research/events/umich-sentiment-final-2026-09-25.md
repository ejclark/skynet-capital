# University of Michigan consumer sentiment — final (Sep 2026) — umich-sentiment-final-2026-09-25

**Kind:** macro-print · **Date:** 2026-09-25 (confirmed, UMICH: the Surveys of Consumers' own 2026 release-dates document — data.sca.isr.umich.edu/fetchdoc.php?docid=79628, PDF text layer decompressed direct 2026-09-04 — lists verbatim "September 25   September Final"; the document states no clock time, and 10:00 ET is customary, not sourced) · **Impact:** low
**Last assessed:** 2026-09-04
<!-- probe-ref: {"symbols":{},"vix":14.32,"daysBand":"low:15+","adjacentIds":["adp-employment-2026-09-30","chicago-pmi-2026-09-30","consumer-confidence-2026-09-29","crwv-fully-connected-2026-09-29","dallas-fed-mfg-2026-09-28","durable-goods-2026-09-25","gdp-q2-2026-third-2026-09-30","government-funding-deadline-2026-09-30","jolts-2026-09-29","mu-2026-09-29-print","pce-2026-09-30","scoos-2026-09-24","treasury-2y-note-2026-09-22","treasury-5y-note-2026-09-23","treasury-7y-note-2026-09-24","treasury-buyback-20y30y-2026-09-24","trump-xi-summit-2026-09-24"],"screenStreak":0} -->

## At a glance

**TL;DR.** **This is the first UMich reading that can contain a Fed decision, and that — not the
headline — is the whole reason it exists as an entry.** The publisher's own collection rule, read
direct today, puts final-release interviews through the **Monday before release**, so this print
collects **2026-08-25 → 2026-09-21**. Its **exclusive** window versus the 09-11 preliminary is
**09-08 → 09-21**: CPI (09-11), PPI (09-10), retail sales (09-16), triple-witching opex (09-18) and
the **09-16 FOMC — a genuinely two-sided hold-vs-*hike* decision**. So the number to read is the
**prelim→final revision**, not the level. 2026's last three revisions were tiny and all upward
(**+0.6 / +0.7 / +0.8**); the one big one (**−2.2**, March) had a shock in its back half. This back
half is the most event-loaded of the year. **Still not tradeable:** `symbols: []`, `low` impact, and
measured here — 2026's eight final-release days moved the S&P a median **|0.373%|** against an
all-2026 median of **0.510%**, i.e. **quieter than an ordinary session**. Date is now **confirmed**
(primary, fetched today; no time in the document). Stand aside.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-21) | **Stand aside** | High | `symbols: []`, `low` impact, and the survey window has **17 collection days still open** — most of what this print reports has not been said to an interviewer yet. | The **2026-09-16 14:00 ET** FOMC hiking, which would put a rate rise *inside* the collection window and make the whole corridor — not this print — the thing to re-read |
| This week | **Watch the 09-11 preliminary; it is this print's baseline, not a rival** | High | A final is only ever read as a revision off its prelim, so the 09-11 number sets the bar this event is measured against — and it lands 90 minutes after CPI, which owns that morning. | The **2026-09-11** prelim not publishing (or publishing without a headline index), which removes the baseline and makes this a level read after all |
| This month | **Read the revision, not the level — and expect it larger than the recent cluster** | Medium | The exclusive 09-08 → 09-21 collection window carries CPI, PPI, retail sales, opex and a two-sided FOMC; the +0.6/+0.7/+0.8 revisions of Jun/Jul/Aug were all collected over quiet back halves. | A **2026-09-25** revision inside **±0.8** points of the 09-11 prelim — the "event-loaded back half ⇒ bigger revision" mechanism fails, and it is registered as **FT-55-umich-sep-revision** |
| This quarter | **The clean test of a final-release day is 2026-10-23, not this one** | Medium | 09-25 shares its 08:30 ET morning with **durable-goods-2026-09-25**, so nothing on the tape attributes; 10-23 has **no tracked event on it at all** and sits inside the 10-17 → 10-29 Fed blackout. | An S&P close-to-close move **≥ 1.459%** (2026's p90) on **2026-10-23** with no other dated catalyst — finals are not ordinary sessions, this entry is mis-tiered at `low`, and **FT-54-umich-final** scores against |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never a trade on this print.** `symbols: []`, `low` impact, no house playbook is macro-keyed.
- **The number that matters is the revision** — prelim (09-11) minus final (09-25), not the handle.
- **The sub-number that matters** — year-ahead inflation expectations (Aug **4.0%**, long-run **3.3%**).
- **Baseline (carried from the primary, via the [prelim doc](umich-sentiment-prelim-2026-09-11.md))** — Aug final **51.7**, prelim **51.0**; Jul **55.2**; Aug-2025 **58.2**; record low **44.8** (May 2026).
- **2026 revisions on the record** — Mar **55.5 → 53.3 (−2.2)** · Jun **48.9 → 49.5 (+0.6)** · Jul **54.4 → 55.2 (+0.8)** · Aug **51.0 → 51.7 (+0.7)**. Aggregator-sourced; the publisher's own tables archive stops at **July 2026**.
- **Watch (dated):** prelim + CPI **09-11** · **FOMC 09-16** (in-window) · opex **09-18** · **window closes 09-21** · Trump–Xi **09-24** (est) · this print + durable goods **09-25** · PCE/GDP/funding deadline **09-30**.

## Initial research

### The question, plainly

Is the 2026-09-25 date real, what does a *final* UMich release contain that its preliminary did not,
how does the tape actually behave on a final-release day, and does any of it change how a paper book
holding NVDA MRVL AVGO CRWV MSFT GOOG META AAPL AMZN should sit?

**One-line verdict:** the date is primary-confirmed today (without a clock time), the answer to
"what does the final add" is unusually large this month — its exclusive collection window contains a
two-sided FOMC — and the print is still untradeable, because final-release days measure *quieter*
than an ordinary 2026 session and this one shares its morning with durable goods.

### Method

Macro-print mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — `symbols: []`, so no
symbol-keyed instrument applies, `earnings-cycle.mjs` / `intraday-edges.mjs` were not run and the
cache-busting rule has no target. **The publisher's own 2026 release-dates document was fetched and
decompressed direct today** (`curl` → HTTP 200 binary → local zlib inflate of the PDF's FlateDecode
streams), and both the schedule table and the collection-rule paragraph are quoted verbatim below
from that decompression. **Market readings are measured, not quoted:** S&P, VIX and Brent daily
closes come from the same Yahoo daily-bar endpoint `scripts/event-material-scan.mjs` uses, and the
final-release-day base rate in leg 4 was computed this session over 169 2026 sessions. Two
data-availability facts are recorded because they bound what is checkable: the apex host
`sca.isr.umich.edu` **would not resolve from this session** (DNS failure on both `curl` and the
fetcher; the sibling prelim doc reached it yesterday), and both FRED's `UMCSENT` series and the
Surveys' **own** tables archive currently end at **July 2026** — so August's published figures are
carried from the [prelim doc](umich-sentiment-prelim-2026-09-11.md), labelled as carried. Fed-path
and corridor context is carried from [`fomc-2026-09-16`](fomc-2026-09-16.md),
[`cpi-2026-09-11`](cpi-2026-09-11.md) and the prelim doc rather than re-derived. Every figure is
dated in-line.

### Conviction legs, tested

1. **The date is real and primary-sourced — SUPPORTED, and it promotes the calendar entry.** The
   Surveys of Consumers' 2026 release-dates document, decompressed here today, lists verbatim
   **"September 11   September Prelim"** and **"September 25   September Final"** (2026-09-25 is a
   Friday). The entry was filed `estimate` by the prelim doc's sweep, which discovered it and
   explicitly deferred promotion to this session under the lane's no-self-confirm limit — the same
   deferral pattern the [`crwv-fully-connected-2026-09-29`](crwv-fully-connected-2026-09-29.md)
   entry names. That limit is met: the publisher is the primary and it was read direct. Flipped
   `estimate` → **`confirmed`** with the `UMICH:` prefix in this PR. **One honest gap, carried into
   the source string rather than papered over:** the schedule document states **no clock time**, and
   unlike the prelim there is no next-release line to supply one — 10:00 ET is customary, not
   sourced, and the entry says so.

2. **A final's collection window runs through the Monday before release — SUPPORTED, verbatim, and
   it is the finding this doc turns on.** The same document states the rule in full: *"The normal
   pattern of data collection is interviewing begins the Tuesday before the final release of the
   previous month. Interviews included in preliminary releases are conducted through the Monday
   before the prelim data release. Interviews included in final releases are conducted through
   Monday before the final data release. November and December are a bit off this schedule due to
   holidays."* August's final released **08-28** (Friday), so interviewing opened **Tuesday 08-25**;
   this final releases **09-25**, so its interviews close **Monday 09-21**. **The prelim doc quoted
   only the first two sentences** — the third is what makes this event distinct from a routine
   revision, and it is now on the record. Same two caveats as the sibling: it is the *normal*
   pattern, not a published per-month window, and the document itself carves out November/December.

3. **The exclusive 09-08 → 09-21 window is the most event-loaded back half of 2026 — SUPPORTED, from
   this repo's own calendar.** The prelim collects through **09-07**; the final collects **14 further
   calendar days**. Inside them, all tracked and all `confirmed` unless marked: PPI **09-10**, CPI
   **09-11**, the 20Y auction **09-15**, **the FOMC decision 09-16 (SEP + dot plot)**, retail sales
   **09-16**, import/export prices **09-16**, the 10Y TIPS **09-17**, the Fed blackout lifting
   **09-17**, and **quarterly triple-witching opex 09-18**. The FOMC is the one that matters:
   [`fomc-2026-09-16`](fomc-2026-09-16.md) records a genuinely two-sided **hold-vs-hike** decision —
   CME FedWatch ~**66%** hike (2026-08-31) against Kalshi's ~**41–48%**, the widest cross-venue gap
   that ledger has logged, with cut odds at **0%** — all carried, not re-derived. **No previous 2026
   UMich reading has had a rate decision inside its collection window.**

4. **A UMich *final* release day is an ordinary session — and measurably quieter than average —
   SUPPORTED, measured this session.** The eight 2026 final releases (Jan 23 · Feb 20 · Mar 27 ·
   Apr 24 · May 22 · Jun 26 · Jul 31 · Aug 28) produced S&P close-to-close moves of **+0.033 ·
   +0.694 · −1.672 · +0.797 · +0.373 · −0.047 · +0.700 · −0.249 %** — median |move| **0.373%**
   against an all-2026 baseline of **median 0.510% / p75 0.843% / p90 1.459%** across **169**
   sessions, with **4 of 8** above the all-day median (null 4.0, i.e. exactly the null). **This is a
   different answer from the prelim's** (median 0.627%, 5 of 8 above), and both are noise at n=8.
   Registered as **FT-54-umich-final**, scored on the **2026-10-23** final — the only remaining 2026
   final with no tracked event on its date, and inside the 10-17 → 10-29 Fed blackout.

5. **The single large final-day move is the Iran-shock session, and it does not generalise —
   SUPPORTED, and it closes a loop the repo left open.** The only reading above 2026's p90 is
   **03-27 at −1.672%**, the session of the March final's **−5.8% m/m** collapse. The prelim doc
   already corrected this repo's shorthand — the March *prelim* printed **55.5 and beat estimates**,
   so the collapse belongs to the final — and adds the confound: roughly two-thirds of the March
   final's interviews were taken after the start of the US military conflict with Iran, alongside
   rising yields and an energy shock. So the one exhibit for "a final can move the tape" is a war
   shock arriving inside a collection window, which is a statement about *shocks*, not about finals.
   **Recorded because it cuts both ways:** that is also the precedent for the mechanism in leg 6.

6. **Revisions are small when the back half is quiet and large when it is not — MIXED, on
   aggregator-grade numbers.** 2026's revisions on the record: **Jun 48.9 → 49.5 (+0.6)** · **Jul
   54.4 → 55.2 (+0.8)** · **Aug 51.0 → 51.7 (+0.7)** — three consecutive small *upward* revisions —
   against **Mar 55.5 → 53.3 (−2.2)**, whose back half carried the Iran shock. The mechanism is
   leg 2's arithmetic: a final adds two weeks of interviews, so the revision *is* the back half.
   **Graded MIXED, not SUPPORTED, and the reason is the sourcing:** the June and July pairs are
   aggregator-reported (a WebSearch pass surfacing Advisor Perspectives / IndexBox summaries), and
   the publisher's own tables archive and FRED both stop at **July 2026**, so no primary was
   available to check them against today. n=4 with one shock is not a distribution. It is enough to
   register a magnitude test and nothing more.

7. **The corridor makes this print unattributable even if it were interesting — SUPPORTED.**
   Seventeen tracked events sit within five days. The decisive neighbour is
   **durable-goods-2026-09-25** at **08:30 ET the same morning** (`estimate`, medium) — a hard
   orders print 90 minutes ahead of a soft survey, which is exactly the CPI-owns-the-morning problem
   the prelim faced. Around it: three Treasury auctions (**2Y 09-22 · 5Y 09-23 · 7Y 09-24**), a
   20Y–30Y buyback **09-24**, the `estimate`-dated **trump-xi-summit-2026-09-24** (high impact,
   trade and export controls), and four days later a stack of **PCE · GDP-3rd · ADP · Chicago PMI ·
   JOLTS-adjacent** prints plus the **FY2027 funding deadline 09-30** and MU's print **09-29**.
   Current readings, measured: S&P **7,747.71**, VIX **14.32** (both 09-03 closes), Brent **$95.63**
   (09-02 settle; a **$95.91** 09-04 bar exists in the futures series).

8. **The window's energy input is unchanged from the prelim's and still points sentiment down —
   SUPPORTED, and it is the one input that can be re-checked cheaply each pulse.** AAA's own page
   today still shows the **9/3/26** snapshot: national regular **$4.1436**, versus $4.0997 a week
   ago, $4.0946 a month ago and **$3.1903 a year ago** — **+30% y/y**, and a record Labor Day
   average per the sibling docs. Brent, measured: **$88.58** (08-25, window open) → **$89.31**
   (08-28) → **$94.65** (09-01, the CENTCOM strike session) → **$95.63** (09-02). Because the final's
   window stays open **17 more days**, this is the live variable: unlike the prelim, the direction of
   the last two weeks of pump prices is still unwritten.

9. **Tracked-name sensitivity is thin and indirect — SUPPORTED, inherited.** `symbols: []`. Only
   **AAPL** (discretionary device demand) and **AMZN** (e-commerce volumes) carry a direct consumer
   channel; the other seven feel this only through the shared rate-path / recession-odds channel.
   The **09-09 iPhone 18 launch** sits inside this window as it did the prelim's — but here, unlike
   the prelim, it lands *inside* the exclusive 09-08 → 09-21 stretch rather than a day before the
   cut-off. Flagged as an in-window curiosity and explicitly **not** used as a signal: nothing
   measurable connects a device launch to a national sentiment index, and this doc does not pretend
   otherwise.

### What the conditions support

A **reading order**, not a position. (a) Read the **09-11 prelim first** — it is the baseline this
print revises, and a final has no meaning without it. (b) On **09-25**, read the **revision**
(final minus prelim) before the level, per legs 2/3/6: the revision is the only part of this print
that carries information the prelim structurally could not. (c) Read the **year-ahead inflation
expectations revision** next, for the same reason the prelim doc put it first — it is the sub-number
with a live, identifiable driver, and it now has a Fed decision inside its collection window. (d)
Read the **08:30–10:00 ET tape as durable goods**, not sentiment (legs 4 and 7). (e) Carry the
**10-23 final** forward as the clean measurement date; nothing about 09-25 can settle leg 4.

### Honest limits

**No September consensus is published** for either release as of D-21, so the directional lean is
mechanism-based extrapolation, not a measured surprise gap. **The apex publisher host did not
resolve from this session** — every UMich fact here comes from the schedule document on
`data.sca.isr.umich.edu` (which did resolve) or is carried, dated, from the prelim doc; the August
figures were therefore *not* re-read from the primary today, and FRED and the Surveys' own archive
both stop at July, so there was no independent check available. **Leg 6's revision base rate is
aggregator-grade at n=4** and is the weakest evidence in the doc — it is why FT-55 tests magnitude
rather than direction, and why the stance's confidence is Low. **Direction is deliberately
un-forecast:** the dominant in-window event is a hold-vs-hike FOMC that this repo's own ledger
prices at 41–66% depending on venue, so a directional call on this revision would be a coin flip
dressed as analysis. **Leg 4 is n=8 on daily bars** and cannot separate a 10:00 ET release from the
rest of a session; FT-54 is registered with that limit stated. **The promotion in leg 1 is a
judgement call**, as it was for the prelim: the lane forbids promoting *without* a primary, and one
was read today — but this one carries no clock time, and the `treasury-3y-note-2026-09-08` entry
reads the limit more strictly and stayed `estimate` despite primary sourcing. If the stricter
reading is intended, the flip and its `UMICH:` prefix are a one-line revert.

## Stance & kill switches

**Stance (date confirmed, primary-fetched 2026-09-04; no clock time sourced).** Treat 2026-09-25 as a
**low-impact, non-tradeable release whose value is diagnostic and whose diagnostic is the
revision, not the level.** No position opened, closed or sized off it; no AAPL/AMZN
discretionary-adjacent entry keyed to it; no reading of the morning tape as a sentiment reaction
while durable goods owns 08:30. Base case (**Low** confidence — n=4 aggregator-grade revisions, no
consensus, and the dominant in-window event is itself two-sided): the September prelim→final
revision is **larger in magnitude than the +0.6/+0.7/+0.8 cluster** of Jun/Jul/Aug, because its
exclusive 09-08 → 09-21 collection window carries CPI, retail sales, triple-witching and a
hold-vs-hike FOMC. **Direction is not called** — it is hostage to the 09-16 decision. Confidence is
low by construction and therefore sizes nothing: a stand-aside with a stated expectation, never a
small bet. The doc's forward job is the clean measurement: **2026-10-23** is the only 2026 final
that can test leg 4 without contamination.

**Kill switches:**

- **The 2026-09-25 revision lands inside ±0.8 points of the 09-11 prelim** — the "event-loaded back
  half ⇒ bigger revision" mechanism (legs 3/6) fails on its first test, and this entry drops back to
  being a routine revision with no reason to exist separately. Registered as **FT-55-umich-sep-revision**.
- **The 09-16 FOMC holds *and* the 09-11 CPI prints in line** — the window's headline content
  evaporates, the whole "first UMich containing a Fed decision" framing loses its force, and the
  September revision should be re-argued from a quiet back half rather than this one.
- **An S&P close-to-close move ≥ 1.459% (2026's p90) on 2026-10-23 with no other dated catalyst** —
  leg 4 dies, finals are not ordinary sessions, this event is mis-tiered at `low`, and
  **FT-54-umich-final** scores against.
- **The 09-11 preliminary does not publish, or publishes without a headline index** — there is no
  baseline, the revision framing is unusable, and this print reverts to a level read the doc has
  argued is near-exhausted (May's 44.8, then 51.0/51.7).
- **A primary source names a clock time other than 10:00 ET for 09-25** — the entry's source string
  is wrong on the one thing it flagged as unsourced, and the corridor ordering against durable goods
  (08:30 ET) may need re-checking.
- **AAA's national average falls back below ~$3.90 before 09-21** — the window's defining energy
  input reverses *inside* the exclusive stretch, and leg 8's direction goes with it.
- **A published September consensus appears for either release** — the mechanism-based lean gains a
  measured surprise gap; re-run the read against a real number instead of a mechanism.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-04 | D-21 | Initial research banked (above). **Date flipped `estimate` → `confirmed`/`UMICH:`** — the Surveys' 2026 release-dates document (docid=79628) decompressed direct today lists verbatim *"September 25   September Final"*; **no clock time is stated anywhere in the document**, so 10:00 ET stays customary-not-sourced and the source string says so. **The material finding, verbatim and new to this repo** — the schedule document's third collection sentence, which the prelim doc did not quote: *"Interviews included in final releases are conducted through Monday before the final data release."* → window **2026-08-25 → 2026-09-21**, and an **exclusive** 09-08 → 09-21 stretch versus the prelim containing PPI 09-10, CPI 09-11, the 20Y 09-15, **FOMC 09-16**, retail sales + import/export 09-16, TIPS 09-17, blackout lift 09-17 and **triple-witching opex 09-18**. **No prior 2026 UMich reading has had a rate decision inside its window.** **Base rate measured this session (not quoted):** the eight 2026 *final* release days moved the S&P **+0.033 · +0.694 · −1.672 · +0.797 · +0.373 · −0.047 · +0.700 · −0.249 %**, median \|move\| **0.373%** vs an all-2026 **median 0.510% / p75 0.843% / p90 1.459%** over **169** sessions, **4 of 8** above the median (null 4.0) — i.e. finals run *quieter* than average, a different answer from the prelim's 0.627%. Only **03-27 (−1.672%)** clears p90, and it is the Iran-shock final. Registered **FT-54-umich-final**, scored on the clean **10-23** final, not this durable-goods-contaminated date. **Revision base rate, aggregator-grade (n=4):** Mar **55.5→53.3 (−2.2)** · Jun **48.9→49.5 (+0.6)** · Jul **54.4→55.2 (+0.8)** · Aug **51.0→51.7 (+0.7)** — small when the back half is quiet, large when it carries a shock. Registered **FT-55-umich-sep-revision** on \|Δ\| ≥ 1.0, **magnitude only** — direction is hostage to a two-sided FOMC. **Adjacency sweep — peers:** n/a, `symbols: []`; **AAPL's 09-09 iPhone 18 launch falls inside the exclusive window**, flagged and explicitly not used as a signal. **Macro surprises:** none since the event was created (2026-09-04); the 09-04 08:30 ET jobs print had not published when this was banked — its outcome belongs to the next row and to [`jobs-2026-09-04`](jobs-2026-09-04.md). Fed path carried, not re-derived, from [`fomc-2026-09-16`](fomc-2026-09-16.md): CME ~**66%** hike (08-31) vs Kalshi ~**41–48%**, cut **0%**. **Volatility regime:** VIX **14.32** (09-03 close, Yahoo daily bars, same endpoint as the probe) — baseline set, nothing to diff against yet; S&P **7,747.71** (09-03). **Geopolitical / energy:** AAA still showing the **9/3/26** snapshot — **$4.1436** national regular vs $3.1903 a year ago (**+30% y/y**); Brent measured **$88.58 (08-25) → $89.31 (08-28) → $94.65 (09-01, CENTCOM strike) → $95.63 (09-02)**, with a **$95.91** 09-04 futures bar. Unlike the prelim's, **this window's energy input is still open for 17 days** — the live variable. **Event tape:** no September consensus published for either release at D-21. **Data-availability facts recorded so the next session skips the dead ends:** the apex host `sca.isr.umich.edu` **would not resolve** from this session (DNS failure, both `curl` and the fetcher) though `data.sca.isr.umich.edu` did; and **both FRED's `UMCSENT` and the Surveys' own tables archive currently end at July 2026**, so August's figures are carried from the [prelim doc](umich-sentiment-prelim-2026-09-11.md), not re-read from a primary. **New dated adjacency found → none proposed.** The corridor is already fully populated (17 tracked events within 5 days). The **10-23 October final** is deliberately **not** added despite being FT-54's scoring date — the prelim doc made the same call for FT-53's 10-09 prelim, and adding release dates purely to host a forward test would spend extra material pulses for no decision value. **Forward-test id scheme changed on purpose:** the register's own 2026-09-04 process finding records three colliding `FT-25`s created by parallel matrix legs picking "the next number"; these two use the event-suffixed form it recommends. | — (stance set) | 2026-10-04 (low, 15+d band: every 30d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed to `market-events.ts` as an `estimate` in
the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first),
never from memory — after which this doc goes quiet.
