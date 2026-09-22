# US markets closed — Thanksgiving Day 2028 — thanksgiving-market-closure-2028-11-23

**Kind:** sector · **Date:** 2028-11-23 (estimate — NEWS: NYSE `nyse.com/markets/hours-calendars` holiday grid, fetched HTTP 200 this session, plus 5 U.S.C. §6103 verbatim and weekday arithmetic validated against 57 years of tape. The two sources that independently corroborated the 2027 sibling — the OCC expiration calendar and SIFMA's US panel — do not publish 2028 yet, and that thinness is recorded, not papered over. The `estimate` label is a taxonomy gap, not a doubt about the date) · **Impact:** low
**Last assessed:** 2026-09-09
<!-- probe-ref: {"symbols":{},"vix":15.97,"daysBand":"low:15+","adjacentIds":["thanksgiving-half-day-2028-11-24"],"screenStreak":0,"blocked":[{"url":"https://query1.finance.yahoo.com/v7/finance/download/%5EGSPC","status":"429","at":"2026-09-09"}]} -->

## At a glance

**TL;DR.** **Stand aside — and do not carry the 2027 sibling's reading rule into 2028, because it
measurably does not reach this configuration.** [`thanksgiving-market-closure-2027-11-25`](thanksgiving-market-closure-2027-11-25.md)
found and registered a **displacement** result: Thanksgiving is the only NYSE closure *followed* by a
scheduled early close, so the reopening premium every other US closure carries on its first session
lands one session late — the half-day Friday runs **0.73×** the November baseline and the Monday
**1.44×**. This lane **reproduced that exactly** from the same instruments (`^GSPC` 1970–2025, n=56:
session 2 out-moves session 1 in **35 of 56 = 62.5%** against **83 of 194 = 42.8%** pooled across MLK,
Presidents, Memorial and Labor, **z = 2.60**) and then asked the question the sibling did not: *does it
transfer?* **It does not reach 2028.** November 2028 is a **five-Thursday** month — Thanksgiving is the
fourth Thursday but **not the last one** — a mechanical property knowable **800 days ahead** and true in
**16 of the 56** measured years. In those 16 the ordering runs **8 of 16 — exactly a coin flip**, which
against the same four-closure baseline is **z = 0.56**; in the complementary **40** four-Thursday years
it runs **27 of 40 = 67.5%, z = 2.85**. In the **8** years sharing 2028's exact date (1972, 1978, 1989,
1995, 2000, 2006, 2017, 2023) the Friday averages **0.451%** absolute and the Monday **0.438%** — both
*below* the **0.764%** November baseline — and the Monday out-moves the Friday in only **3 of 8**.
**This is a confidence downgrade, not a reversal, and the limit is stated:** the direct four-vs-five
contrast is **17.5pp at two-sided permutation p = 0.36** (200,000 draws) and the seven per-day cells run
**37.5% → 87.5%** with no monotone structure, so the honest reading is that the pooled **62.5%** is a
property of the *pooled sample*, not a per-year expectation. The **2027 attribution trap does not
recur**: the displaced Monday **2028-11-27** is November's session **18 of 21** with three full sessions
behind it (2027's was the *penultimate*), and no December 2028 FOMC blackout can be dated because
`federalreserve.gov`'s published calendar stops at *"a two-day meeting is scheduled for January 25-26,
2028."* So the one Monday of the pair that could be read cleanly is 2028's — and the rule that would
justify looking is the one that doesn't reach it. Nothing here is tradeable: date `estimate`,
`symbols: []`, `impact: low`, and a re-grep of both house playbooks returns **0 hits**.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-806) | **Stand aside** — a closed session 806 days out is not a position | High | `symbols: []`, `impact: low`, date `estimate`, and `docs/plans/trade-playbooks.md` + `docs/research/multi-symbol-sweep.md` grepped this session for `holiday\|thanksgiving\|black friday\|half.day\|early close\|closure\|blackout` return **0 hits in both**. No instrument in this repo reaches 2028 | A house playbook acquiring a calendar-keyed or holiday-adjacent trigger, or this entry acquiring a non-empty `symbols` list, on or before the **2026-10-09** pulse |
| This week | **Stand aside; bank the transfer test, do not trade it** | High | The live calendar this week is dated 2026-09, not 2028-11. The one thing worth doing now is written down: the sibling's displacement rule has a **stated scope condition** (four-Thursday Novembers), so the next pulse tests it instead of re-deriving it | Any figure in the conviction-leg tables below failing to reproduce from `^GSPC`/`^VIX` daily bars before **2026-10-09** — every number here is this session's own arithmetic and nothing else |
| This month | **Watch the corroboration window open, not the tape — this date is the thinnest-sourced closure on the shelf** | Medium | Unlike 2027, the OCC calendar (2025–2027 only) and SIFMA's US panel (ends at 2028-01-01) publish **nothing** for 2028, so the date rests on the NYSE grid plus 5 U.S.C. §6103 — two legs, not four. Both bodies publish roughly a year ahead, so the gap closes on its own | The OCC publishing a **2028** expiration calendar, **or** SIFMA publishing a 2028 US recommendation, on or before **2026-10-09** — the corroboration leg upgrades and the bond-side early close for **2028-11-24** becomes proposable with a source |
| This quarter | **Carry the scope condition, never the rule — "the Monday vents it" is a four-Thursday finding and 2028 is a five-Thursday November** (`estimate`) | Low | 8/16 vs 27/40 against a 42.8% baseline (z = 0.56 vs z = 2.85), and 3/8 in 2028's own date cell where both sessions run *below* the November baseline. Confidence is **low** on purpose: the contrast itself is p = 0.36 and the cells are non-monotone, so this downgrades the sibling's call rather than inverting it | The **2028-11-27** session printing a larger absolute S&P close-to-close move than the **2028-11-24** half session. Registered as **FT-thanksgiving-market-closure-2028-11-23-2**, deliberately the **opposite** registered bet to [`FT-thanksgiving-market-closure-2027-11-25-1`](../forward-tests/thanksgiving-market-closure-2027-11-25.md) — base rates disclosed and in conflict (3 of 8 in-configuration *for*, 35 of 56 pooled *against*) |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit, hedge or size is keyed to 2028-11-23 in any branch. It is a closed
  session; `impact: low`, `symbols: []`, and date-keyed action requires `confirmed` regardless.
- **Reading rule, amended from the sibling — "the Monday vents it" carries a scope condition, and 2028
  fails it.** Do not read 2028-11-27 as the session that prices the closure. In five-Thursday Novembers
  the ordering is a coin flip (8/16) and both sessions in 2028's exact date cell run *below* the
  November baseline. The sibling's rule stands for 2026 and 2027, which are four-Thursday years.
- **Execution guard (Wed 2028-11-22) — a full session, verified, not assumed.** NYSE's early-close
  footnote list names exactly three occasions across 2026–2028 (Mon July 3 2028, the day after
  Thanksgiving, Christmas Eve 2026). **No Wednesday-before-Thanksgiving early close exists in any of the
  three years**, so 2028-11-22 trades 09:30–16:00 ET.
- **Execution guard (Fri 2028-11-24) — the equity bell is sourced; the bond bell is not.** NYSE footnote
  \*\*\* puts equities out at **13:00 ET**, eligible options **13:15**. SIFMA's US panel publishes
  nothing past **2028-01-01**, so unlike [2027](thanksgiving-market-closure-2027-11-25.md) there is **no
  sourced 2028 fixed-income hour** — and none is invented here. `sifma-bond-early-close-2028-11-24` is
  deliberately **not proposed**; it becomes proposable the pulse after SIFMA publishes.
- **Explicitly refused — that this is an *inversion*.** The four-vs-five-Thursday difference is
  **p = 0.36** and would not survive a Bonferroni correction over the seven day-cells tested (the best
  cell, the 26th at 87.5%, is raw p = 0.023 → **0.16** corrected). Nothing here says the displacement
  reverses in 2028; it says the evidence for it does not extend to 2028's half of the sample.
- **No blackout claim is available for 2028, and that absence is the finding.** `federalreserve.gov`
  (fetched HTTP 200 this session) publishes no December 2028 FOMC date — its furthest forward statement
  is *"A two-day meeting is scheduled for January 25-26, 2028."* Any future ledger asserting a December
  2028 blackout must cite a publication that does not exist as of 2026-09-09.

## Initial research

### The question, plainly

The NYSE is shut on 2028-11-23. A sibling ledger 363 days earlier already measured what a Thanksgiving
closure does to the tape and registered it as a forward test. **So the only question worth a session
here is whether that finding is a property of *Thanksgiving* or a property of the *pooled sample* — and
if the latter, whether 2028 sits in the half that carries it.** Everything else about this event is
bookkeeping.

### Verdict, one line

**The date is solid on two legs instead of four, and the sibling's displacement rule has a scope
condition it never stated: it lives in four-Thursday Novembers, and 2028 is not one.**

### Method

- `^GSPC` daily bars **1969-01-02 → 2026-09-09** (14,543 bars) and `^VIX` **1990-01-02 → 2026-09-09**
  (9,241 bars), fetched this session from the Yahoo v8 chart endpoint. The v7 CSV download endpoint
  returned **429** and is recorded in `probe-ref.blocked`; the v8 endpoint served the same series and is
  what every number below is computed from.
- Thanksgiving dates are **computed** from 5 U.S.C. §6103's fourth-Thursday rule for 1970–2026, never
  looked up, and the rule is validated against the tape rather than quoted (see leg 1).
- Sessions 1 and 2 are the first and second `^GSPC` bars strictly after each Thanksgiving date. The
  **November baseline** is that year's other November sessions' mean absolute close-to-close move,
  excluding sessions 1 and 2 so the comparison is not self-referential.
- The four Monday closures (MLK from 1998, Presidents, Memorial from 1971, Labor) are computed the same
  way and pooled to form the control the sibling used, so its z-statistic is reproduced rather than
  quoted.
- Significance is **rank-based first** (which session is larger) so a single tail like 2008 cannot drive
  a result, with permutation tests (200,000 draws) on the ratio statistics as a cross-check.
- Web sources fetched first-hand this session, all HTTP 200: NYSE hours/calendars (109,180 B),
  uscode.house.gov §6103 (170,863 B), optionseducation.org expiration calendar (34,871 B),
  sifma.org holiday schedule (299,159 B), federalreserve.gov FOMC calendars (164,831 B).

### Conviction legs

**Leg 1 — 2028-11-23 is a full NYSE closure. SUPPORTED.** The grid's header row is
`Holiday | 2026 | 2027 | 2028` and the Thanksgiving row parses cell-by-cell as
`Thursday, November 26***` / `Thursday, November 25***` / `Thursday, November 23*** `. §6103 reads
verbatim *"Thanksgiving Day, the fourth Thursday in November"*; 2028-11-01 is a Wednesday so November's
Thursdays are the 2nd, 9th, 16th, 23rd and 30th, and the fourth is the **23rd**. The rule was validated
against the tape, not assumed: computing the fourth Thursday of November for **1970–2026** and looking
each date up in `^GSPC` daily bars returns **0 of 57 trading days**.

**Leg 2 — the corroboration available for 2027 is not available for 2028. SUPPORTED (a limit, not a
doubt).** Both checks were run and both came back out of range. The **OCC** expiration calendar's `data`
array covers **2025, 2026 and 2027 only**; its `downloads` list offers 2025, 2026 and 2027 PDFs and no
2028 one, so the `hatched: true` "Exchange/OCC holiday" flag that independently corroborated 2027-11-25
has no 2028 counterpart to read. **SIFMA**'s US Holiday Recommendations panel runs out at
*"New Year's Day 2027/2028 — Saturday, January 1, 2028."* The 2028 date therefore rests on **two** legs
(NYSE grid + statute) where 2027 rested on four. This is why the month-horizon call watches the
publication window rather than the tape.

**Leg 3 — the sibling's displacement result reproduces exactly. SUPPORTED.** Independently recomputed
here: the half-day Friday averages **0.560%** absolute (**0.73×** the 0.764% November baseline, n=1,141)
and the Monday **1.098%** (**1.44×**); session 2 out-moves session 1 in **35 of 56 (62.5%)** against
**83 of 194 (42.8%)** pooled across the four Monday closures — **z = 2.60** — with the per-closure
splits MLK **13/28**, Presidents **24/55**, Memorial **27/55**, Labor **19/56**. Every figure matches
the sibling's to the digit, from a fresh fetch. *(Worth stating plainly: against a bare coin flip the
35/56 is only **p = 0.081**; its significance comes entirely from the 42.8% control, which is the right
null and is the one the sibling used.)*

**Leg 4 — that result does not transfer to 2028's configuration. MIXED, and the mixedness is the
point.** Thanksgiving's date is **exactly uniform** over 1970–2025 — 8 years on each of the 22nd through
the 28th — which makes the calendar-position split clean rather than opportunistic. Splitting on the one
property 2028 has and 2027 does not:

| Configuration | Years | s2 > s1 | Rate | vs 42.8% baseline | Friday / Nov base | Monday / Nov base |
|---|---|---|---|---|---|---|
| **Five-Thursday Nov** (Thanksgiving 22nd–23rd) — **2028's class** | 16 | 8 | **50.0%** | **z = 0.56** | 1.01× | **1.26×** |
| Four-Thursday Nov (24th–28th) — 2026's and 2027's class | 40 | 27 | **67.5%** | **z = 2.85** | 0.80× | **1.43×** |
| **Day-23 cell exactly** (1972, 78, 89, 95, 2000, 06, 17, 23) | 8 | 3 | **37.5%** | — | 0.76× | **0.96×** |
| Pooled (the sibling's number) | 56 | 35 | 62.5% | z = 2.60 | 0.73× | 1.44× |

In 2028's own date cell the Friday averages **0.451%** and the Monday **0.438%** — statistically
indistinguishable from each other and *both below* the November baseline. **The total repricing across
the closure is identical in both classes** (span 2.26× baseline for five-Thursday years, 2.22× for
four-Thursday), so this is a claim about *where* the move sits, not *how much* there is — the same shape
of claim the sibling made, one level down.

**Leg 5 — but the split is underpowered and is reported as such. REFUTED as a strong claim.** The direct
four-vs-five contrast is **17.5pp, two-sided permutation p = 0.3591** (200,000 draws); on the Monday's
baseline ratio it is **1.43× vs 1.26×, p = 0.5889**. The seven per-day cells are **non-monotone** —
22nd **62.5%**, 23rd 37.5%, 24th **75.0%**, 25th 37.5%, 26th **87.5%**, 27th 75.0%, 28th 62.5% — which
kills the tidiest available mechanism (that the effect is really month-end flow stacking onto a Monday
that sits near the end of November), because the 24th and the 22nd sit on the wrong side of it. And the
best-looking cell would not survive correction: the 26th's raw **p = 0.023** becomes **0.16** across
seven cells. Modern-era subsets are consistent but tiny (since 1992: 4-Th **17/25**, 5-Th **4/9**).
**So the honest output is a scope condition held at low confidence, not a discovery**: the pooled 62.5%
is a property of the pooled sample, 2028 sits in the half that shows none of it, and one more
observation either way will not settle it.

**Leg 6 — the 2027 ledger's attribution trap does not recur in 2028. SUPPORTED.** The 2027 Monday had
four competing stories (displacement, FOMC blackout, month-end, ordinary Monday). 2028's has fewer, and
each was checked: **2028-11-27 is November session 18 of 21**, with three full sessions behind it — the
2027 Monday was the month's *penultimate* session. **No December 2028 FOMC blackout is datable**:
`federalreserve.gov`'s calendar page, fetched this session, contains exactly one 2028 statement — *"A
two-day meeting is scheduled for January 25-26, 2028"* — and nothing later. November 2028 trades **21
NYSE sessions** (22 weekdays minus this closure), the **top** of the 1970–2025 range of 18–21 (mean
20.38, hit by 30 of 56 years).

**Leg 7 — nothing in the house system can fire on this date. SUPPORTED.** A re-grep this session of
`docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md` for
`holiday|thanksgiving|black friday|half.day|early close|closure|blackout` returns **0 hits in both**.
`symbols: []`, `impact: low`, `status: estimate`. There is no branch in which this event changes a
position.

**Leg 8 — the adjacency sweep, run mechanically. SUPPORTED, and it found the calendar's frontier.** Over
all **942** tracked entries (566 canonical + 376 proposals), the ±60-day corridor around 2028-11-23
contains **two** things besides this event and its own half-day sibling:
[`presidential-election-2028-11-07`](presidential-election-2028-11-07.md) at **D-16** and
[`fed-board-closure-2028-11-10`](fed-board-closure-2028-11-10.md) at **D-13**. Within ±5 days there is
only `thanksgiving-half-day-2028-11-24`. Past 2028-11-24 the calendar was **empty** — those were its two
furthest-out dates. One proposal is filed from this sweep:
`christmas-market-closure-2028-12-25.from-thanksgiving-market-closure-2028-11-23.json` (D+32, off the
same NYSE fetch; notable because the 2028 cell carries **no** footnote marker, so unlike 2026 there is
**no Christmas Eve early close** — Friday 2028-12-22 is a full session). The grid also names seven other
2028 US holidays and a July 3 2028 early close; those are **deliberately left unproposed** rather than
harvested, because they are not adjacent to this event.

**Leg 9 — the sibling's `^VIX` corroboration did NOT reproduce here, and that is reported rather than
quietly adopted. REFUTED as stated.** The 2027 ledger's independent-instrument leg reads *"VIX's larger
step lands on session 2 in **25 of 36 (69.4%)** against 67 of 136 (49.3%), z = 2.159, p = 0.031."* Three
definitions of "larger step" were computed here on `^VIX` 1990–2025 (n=36) and **none returns 25**:
absolute point change **20/36 (55.6%)**, percent change **20/36**, signed *rise* **26/36**. The nearest
variant is the signed one, which is a different claim (VIX went up more, not moved more). This may be a
definitional gap rather than an error — the sibling did not state which step it used — but the practical
consequence is the same either way: **the S&P result stands on its own (leg 3, reproduced to the digit)
and the "independent instrument confirms it" leg does not, until someone reproduces it.** Nor does VIX
support this ledger's own split: five-Thursday **6/10** vs four-Thursday **14/26** on absolute steps —
essentially no difference. **Routed, not left in prose:** this belongs to
[`thanksgiving-market-closure-2027-11-25`](thanksgiving-market-closure-2027-11-25.md)'s next pulse, which
owns that ledger's rows; nothing is edited there from here (rows are append-only and cross-lane edits are
forbidden), and its registered `FT-…-2027-11-25-1` is untouched — the S&P legs it actually rests on are
unaffected.

### What plays the conditions support

**None.** A closure removes sessions; it does not signal. The output of this session is two reading
rules and two execution facts, all of which are inputs to *interpreting* a future tape rather than
acting on one:

1. The sibling's "the Monday vents it" rule now carries a **stated scope condition**, so the 2028 pulse
   inherits a testable claim instead of a general one.
2. **2028-11-27 is the cleanest post-Thanksgiving Monday in this calendar's range** — no blackout, no
   month-end adjacency, three sessions of runway — which makes it a good *observation* and still not a
   position.
3. Wednesday **2028-11-22** is a full session; Friday **2028-11-24** closes 13:00 ET (13:15 options)
   with **no sourced bond hour yet**.
4. The corroboration gap (leg 2) is a dated, self-closing to-do, not a risk.

### Honest limits

- **The scope condition is a subgroup finding on n=16 versus n=40, at p = 0.36.** It is reported as a
  confidence downgrade for exactly that reason. Someone who believes the pooled 62.5% is the truth and
  the split is noise is holding a position this data cannot refute.
- **Seven day-cells were examined.** The split reported is the one with a mechanical, ex-ante definition
  (is Thanksgiving the last Thursday of its month?), but it was chosen after seeing the cells, and the
  multiple-comparison arithmetic is given above rather than hidden.
- **A 3.5-hour session mechanically has less time to move**, a confound the sibling conceded and which
  this ledger inherits unchanged: every session-1 figure here is depressed by an hours effect that no
  close-to-close statistic can strip out.
- **The date is two-legged, not four-legged**, until the OCC and SIFMA publish 2028 (leg 2).
- **`^VIX` does not referee the split, and its pooled figure did not reproduce — see leg 9.** On the
  36 years with VIX history the five-Thursday cell runs **6/10** and the four-Thursday cell **14/26** —
  **no split at all**, in an instrument the sibling leaned on. A further reason the quarter-horizon
  confidence is **low**.

## Stance & kill switches

**Stance: stand aside, and amend the sibling's reading rule rather than repeat it** (`estimate` — date
`estimate`, `symbols: []`, `impact: low`, no calendar-keyed playbook exists; nothing here licenses an
entry at any size).

The one substantive position this ledger takes is **negative**: the displacement result registered for
2027 has a scope condition, and 2028 fails it. Two forward tests are registered in
[`forward-tests/thanksgiving-market-closure-2028-11-23.md`](../forward-tests/thanksgiving-market-closure-2028-11-23.md):
the structural facts (`-1`, high/medium confidence) and the transfer test (`-2`, **low** confidence,
deliberately the **opposite** bet to `FT-thanksgiving-market-closure-2027-11-25-1`). Registering an
opposed pair, split by a property known 800 days ahead, is the point — whichever way the two score, the
pair says more than either alone, and a low-confidence call drives **no** size in either direction.

**Kill switches:**

- **The scope condition dies** if the 2026 and 2027 prints land such that the five-Thursday cell and the
  four-Thursday cell converge — or immediately, if a re-run over a different index or a different
  baseline window flips the sign of the 8/16-vs-27/40 gap. Re-check at every pulse from the same bars.
- **The stand-aside dies** if a house playbook acquires a holiday-adjacent or calendar-keyed trigger, or
  if this entry ever acquires a non-empty `symbols` list. Both are grep-checkable each pulse.
- **The two-leg sourcing dies (upward)** the moment the OCC publishes a 2028 expiration calendar or
  SIFMA publishes a 2028 US recommendation — at which point the bond-side early close for 2028-11-24
  becomes proposable and the month-horizon call retires.
- **The "no blackout" leg dies** the moment `federalreserve.gov` publishes 2028 FOMC dates. If a
  December 2028 meeting lands in the first half of the month, 2028-11-27 re-enters a blackout and stops
  being the clean Monday this ledger calls it.
- **The whole document is retired by taxonomy, not by tape,** if a `NYSE:`-class exchange-calendar prefix
  is added to `market-events-data.ts` (open issue **#2552**) — the entry promotes to `confirmed` and the
  estimate-driven caveats drop away.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-09 | 806 | **Initial research.** Canonical `<id>.json` written by this lane (the id existed only as `proposals/…from-presidential-election-2028-11-07.json`, read first). Date re-verified first-hand: NYSE grid 2028 column `Thursday, November 23***` (HTTP 200, 109,180 B) + 5 U.S.C. §6103 fourth-Thursday rule, validated against tape (0 of 57 fourth-Thursdays are `^GSPC` sessions). **Sourcing is thinner than 2027's and that is recorded**: OCC publishes 2025–27 only, SIFMA's panel ends 2028-01-01 → no sourced bond hour for 2028-11-24, none invented, `sifma-bond-early-close-2028-11-24` deliberately not proposed. **Reproduced the sibling's displacement result exactly** (`^GSPC` 1970–2025: 35/56 = 62.5% vs 83/194 = 42.8%, z = 2.60; Friday 0.73×, Monday 1.44× of the 0.764% Nov baseline). **New finding — it carries a scope condition**: five-Thursday Novembers (2028's class, n=16) run **8/16 = 50.0%**, z = 0.56 vs baseline; four-Thursday (n=40) run **27/40 = 67.5%**, z = 2.85; 2028's exact day-cell 3/8 with both sessions *below* baseline. Reported as a downgrade, not an inversion — direct contrast p = 0.36, cells non-monotone (37.5%→87.5%), and `^VIX` shows no split (6/10 vs 14/26). **Separate finding routed to the sibling's next pulse:** its `^VIX` corroboration leg (25/36) did **not** reproduce under any of three step definitions here (20/36 abs, 20/36 pct, 26/36 signed) — its S&P legs are unaffected and nothing was edited there. **2027's attribution trap does not recur**: 2028-11-27 is Nov session 18 of 21 (2027's was penultimate) and no Dec-2028 FOMC date exists (`federalreserve.gov` stops at "January 25-26, 2028"). Adjacency sweep over 942 entries: corridor holds only `presidential-election-2028-11-07` (D-16) and `fed-board-closure-2028-11-10` (D-13); past 2028-11-24 the calendar was empty → proposed `christmas-market-closure-2028-12-25` (D+32, same fetch; 2028 cell carries no footnote, so **no** Christmas Eve early close). Playbook re-grep: **0 hits** in both. VIX 15.97, S&P 7,642.57 (09-09 closes). Registered **FT-…-2028-11-23-1** and **-2** | **Initial stance set: stand aside; amend the sibling's reading rule rather than repeat it.** The rule "the Monday vents the Thanksgiving closure" is scoped to four-Thursday Novembers; 2028 is a five-Thursday November and inherits none of it. Confidence **low** on the scope condition by design | 2026-10-09 |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint notes any
row past ~1,200 chars): it is a note to the next session, not an essay, and a stance *change* earns its
sentence in the Stance section with the row as its receipt. The adjacency sweep (peer prints · macro
surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in every row; a dated
adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-thanksgiving-market-closure-2028-11-23.json`
(`status: "estimate"`) in the same PR — your own file, never another event's canonical one (#1717).
Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from memory —
after which this doc goes quiet.
