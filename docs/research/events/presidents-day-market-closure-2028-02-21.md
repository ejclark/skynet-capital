# US markets and the Federal Reserve Board closed — Washington's Birthday 2028, the Monday AFTER February expiration — presidents-day-market-closure-2028-02-21

**Kind:** sector · **Date:** 2028-02-21 (estimate — NEWS: NYSE `nyse.com/markets/hours-calendars` holiday table + Federal Reserve Board `federalreserve.gov/aboutthefed/k8.htm`, both fetched direct 2026-09-09, reproduced by 5 U.S.C. 6103; the `estimate` label is a taxonomy gap, not a doubt about the date) · **Impact:** low
**Last assessed:** 2026-09-09
<!-- probe-ref: {"symbols":{},"vix":16.23,"daysBand":"low:15+","adjacentIds":["fomc-minutes-2028-02-16","vix-expiration-2028-02-16","opex-2028-02-18"],"screenStreak":0,"blocked":[]} -->

## At a glance

**TL;DR.** **Stand aside — and do not inherit the 2027 sibling's numbers into 2028, because the
calendar geometry is inverted.** February 2028's third Friday is **2028-02-18** and its third Monday
is **2028-02-21**, so this closure falls the Monday **after** expiration week, not inside it — the
2025–2027 run that
[`presidents-day-market-closure-2027-02-15`](presidents-day-market-closure-2027-02-15.md) was
measured on ends with 2027. That is not a cosmetic difference. Re-measured this session on SPY and
^VIX daily bars (2010-01-01 → 2026-09-08, cache busted, n=840 Friday→next-session spans), the
sibling's headline — implied vol is marked down into the long-weekend Friday and **rebounds** on
reopen, 71% of the time versus 56% — **is a property of the subset it happened to measure, and it
disappears in the configuration 2028 actually has.** Splitting the 85 Monday-holiday weekends by
whether the preceding Friday was a monthly expiration: where it was **not** (the 2027 shape, n=64)
VIX closes higher on reopen **77%** of the time, median ΔVIX **+0.695**; where it **was** (the 2028
shape, n=21) it is **57%**, median **+0.340** — a two-proportion **z of 0.11** against the 56%
all-ordinary-weekend baseline, i.e. **indistinguishable from an ordinary weekend**. The direction is
independently corroborated at large n on weekends with no holiday at all: **47% (82/174)** after an
expiration Friday versus **59% (340/581)** otherwise, **z = −2.66**. The per-calendar-day price
result does not transfer either (0.152%/day here versus 0.151% for an ordinary weekend — flat, not
lower). Two further things this session establishes: the corridor is **one-sided** — every tracked
neighbour within ±5 days sits *before* the closure, so Tuesday **2028-02-22** is currently the
cleanest post-holiday reopen on this calendar, the inverse of 2027's attribution trap — and the
**fixed-income side is unsourced**, because SIFMA has published US holiday panels only through 2027.
Nothing here is tradeable: the date is `estimate`, `symbols: []`, `impact: low`, and a re-grep of
both house playbook docs for holiday/closure keying returns **zero hits in both**, run this session.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — a closed session is not a position and there is nothing to size | High | D-530; `symbols: []`, `impact: low`, and a grep of `trade-playbooks.md` + `multi-symbol-sweep.md` for `holiday\|presidents\|washington\|closure\|half-day\|early close` returns **0 hits in both**, run this session rather than inherited from the 2027 sibling | A house playbook keyed on holiday-adjacent sessions being written and back-tested before **2028-02-21** — the "nothing is calendar-keyed" leg goes stale and this sheet is rebuilt on measured data |
| This week | **Do not carry the sibling's long-weekend vol caution into this date** — it is a non-expiration-Friday result | High | The load-bearing number is not the n=21 holiday split, it is the n=755 ordinary-weekend one: after an expiration Friday VIX is higher on the next session **47% (82/174)** of the time vs **59% (340/581)** otherwise, **z = −2.66**. 2028-02-18 is a monthly expiration; 2027-02-12 was not | The one out-of-sample instance that scores before this event — the reopen **2027-01-19**, after the post-expiration MLK weekend of **2027-01-18** — lifting the post-expiration holiday-weekend VIX-up rate back into the long-weekend band (≥ 70%) on re-measurement. Registered as **FT-presidents-day-market-closure-2028-02-21-2** |
| This month | **Treat the bond side as unknown, not as settled** — 2027's "no flanking early close" does not transfer | Medium | SIFMA's holiday-schedule page, fetched 2026-09-09 (HTTP 200, 299,159 bytes), carries US panels for 2026 and 2027 only; its furthest 2028 row is the 2027 schedule's tail (`New Year's Day 2027/2028 — Saturday, January 1, 2028`). Presidents Day 2026 and 2027 both carry an **empty** note, so the base case is a plain full close — but 2028 is unpublished, and here the flanking Friday is also an expiration | SIFMA publishing a 2028 US recommendation that attaches an early close to **2028-02-18** — a cross-asset execution guard appears where this ledger records a hole. Registered as **FT-presidents-day-market-closure-2028-02-21-1**, score by **2027-12-31** |
| This quarter | **Watch whether the corridor stays one-sided** — that, not the tape, is this row's whole value | Medium | All three ±5-day neighbours are upstream: `fomc-minutes-2028-02-16` (D-5, canonical), `vix-expiration-2028-02-16` (D-5, proposal), `opex-2028-02-18` (D-3, proposal). Nothing is dated after the closure, so a move on **2028-02-22** would have a single explanation rather than three — the exact inverse of the 2027 sibling's attribution trap | Any tracked calendar entry landing in **2028-02-19 … 2028-02-25** before **2028-02-18** — the clean-reopen property dies and this call retires. Registered as **FT-presidents-day-market-closure-2028-02-21-3** |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit or hedge is keyed to 2028-02-21. It is a closed session; the date is
  `estimate`, and date-keyed action requires `confirmed` regardless.
- **The correction, stated so it is not re-derived from the sibling:** the "long weekend pre-marks
  vol and rebounds on reopen" caution is measured at **77% (49/64)** when the preceding Friday is
  *not* an expiration and **57% (12/21)** when it is. 2028-02-18 **is** the February monthly
  expiration. Carry the caution into 2027-02-15; do not carry it into 2028-02-21.
- **No cross-asset guard can be stated here, and that is a hole rather than a negative.** SIFMA has
  not published a 2028 US schedule. The 2027 sibling could assert "full bond close, no flanking
  early close"; this ledger cannot, and says so rather than borrowing it.
- **The counts, so they are not re-derived wrong:** expiration week 2028 is a **full five sessions**
  (Mon 02-14 → Fri 02-18). The **short** week is the one *after* the holiday — **four sessions**,
  Tue 02-22 → Fri 02-26. This is the mirror image of 2027, where the four-session week was
  expiration week itself.
- **Attribution runs backwards from 2027.** A move on Tuesday **2028-02-22** has a three-day-weekend
  explanation and no dated competitor; a move on **2028-02-16** has *two* (FOMC minutes and VIX
  settlement, both estimate, both the same day). The congestion sits before the closure, not after.

## Initial research

### The question

This row exists only because the `fomc-minutes-2028-02-16` adjacency sweep proposed it as a
**measuring stick** — the Board closure a January-class minutes release is structurally unable to
collide with. Three questions follow. Does the date hold on primaries this lane re-fetches rather
than inherits? Does the 2027 sibling's already-measured long-weekend result apply to this date at
all? And does a day the market is shut earn a calendar row when its own proposer said nothing about
it is tradeable?

**One-line verdict:** the date holds on three independent legs, and the sibling's result **does not
transfer** — the geometry is inverted (holiday after expiration week rather than inside it), and the
long-weekend vol-rebound edge the sibling headlines is measurably absent in exactly that
configuration. The row's value is that correction, a one-sided corridor that makes 2028-02-22 an
unusually clean reopen, and one honestly-recorded source hole.

### Method

Macro / market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — no
symbol-keyed instrument applies (`symbols: []`). Nothing from the proposal was taken on faith; every
primary was re-fetched and every count recomputed.

- **The proposal read first**, per the "when your own event was proposed by others" rule:
  `proposals/presidents-day-market-closure-2028-02-21.from-fomc-minutes-2028-02-16.json` is the only
  one for this id. The canonical `src/domain/market-events/presidents-day-market-closure-2028-02-21.json`
  is written by this session; the proposal is now shadowed and inert.
- **NYSE** `nyse.com/markets/hours-calendars` fetched direct (HTTP 200 after its 302, 109,180 bytes;
  needs `curl -L`, renders holiday data as JSON-ish `"text":"…"` cells), parsed cell-by-cell — the
  holiday rows *and* the complete footnote list.
- **Federal Reserve Board** `federalreserve.gov/aboutthefed/k8.htm` fetched direct (HTTP 200, 82,205
  bytes, stamp `Last Update: July 8, 2026`), holiday table and both footnotes parsed. The 2027
  sibling never checked this source; it is new here.
- **SIFMA** `sifma.org/resources/general/holiday-schedule/` fetched direct (HTTP 200, 299,159 bytes),
  parsed out of the page's own embedded Next.js payload. Every panel was enumerated to establish that
  2028 is **absent**, rather than reading the 2027 row and assuming.
- **Yahoo daily bars** for **SPY** (8,459 sessions) and **^VIX** (9,241 sessions) via this repo's own
  `scripts/research/market-data.mjs`, **cache busted first** per the process doc's cache discipline.
  Every statistic below is computed from those bars over 2010-01-01 → 2026-09-08, never recalled.
- **Computed, not sourced:** third-Monday and third-Friday dates for February 2015–2035, the
  FOMC-minutes gap quantisation, every session and calendar-span count, and both two-proportion
  z-statistics.
- **Re-grepped this session:** `docs/plans/trade-playbooks.md` and
  `docs/research/multi-symbol-sweep.md` for holiday/closure keying.
- **Not re-measured, and therefore inherited:** the FOMC-minutes displacement *base rates* from
  [`fomc-minutes-2027-12-29.md`](fomc-minutes-2027-12-29.md) (leg 9).

### Conviction legs, tested

1. **The date rests on three independent legs and still reads `estimate` — SUPPORTED.** NYSE's
   holiday table, parsed against its own `2026 / 2027 / 2028` year headers, gives
   `Washington's Birthday → ['Monday, February 16', 'Monday, February 15', 'Monday, February 21']`.
   The Federal Reserve Board's own table gives `February 16 | February 15 | February 21 | February 19
   | February 18` across 2026–2030. 5 U.S.C. 6103 fixes the third Monday in February, and the third
   Monday of February 2028 is 2028-02-21 (2028-02-01 is a Tuesday). **It stays `estimate`** because
   the prefix taxonomy in `market-events-data.ts` has no slot for an exchange's or the Board's own
   holiday calendar and this lane may not self-confirm an in-sweep discovery — a label about the
   taxonomy, not the evidence, and it costs nothing while every honest call here is a stand-aside.

2. **No NYSE early close attaches to this holiday — SUPPORTED, verified against the whole footnote
   list rather than the row.** The table carries exactly four markers and all four were read: `*`
   (no New Year's holiday in 2028 — it falls on Saturday, January 1), `**` (early close Monday
   2028-07-03), `***` (early close the day after Thanksgiving, incl. Friday 2028-11-24), `****`
   (early close Thursday 2026-12-24). **None attaches to February in any of the three years**, so no
   adjacent equity session shortens.

3. **The Federal Reserve Board is closed the same day, unasterisked — SUPPORTED, and new.** The k8
   page's `*` marker means "Saturday — the Reserve Banks are open, but the Board of Governors is
   closed", and it lists only 2026-07-03, 2027-06-18, 2027-12-24, 2027-12-31 and 2028-11-10.
   Washington's Birthday 2028 carries neither marker, so Banks and Board shut together. This matters
   only because it is the property the proposing lane's displacement rule is keyed on (leg 9).

4. **2028 breaks the 2025–2027 run: the holiday falls AFTER expiration week — SUPPORTED, recomputed
   from scratch.** Whether the third Monday of February lands inside the third-Friday week depends on
   which weekday February starts on. Recomputed 2015–2035: it does in **9 of 21 years** — 2015, 2016,
   2020, 2021, 2025, 2026, 2027, 2031, 2032 — and **2028 is not one of them**. February 2028 begins
   on a Tuesday, so its Fridays are the 4th, 11th, 18th and 25th and its Mondays the 7th, 14th, 21st
   and 28th. **Expiration week is a full five sessions** (Mon 02-14 → Fri 02-18); the **four-session**
   week is the one *after* the closure (Tue 02-22 → Fri 02-26). The 2027 sibling's entire framing —
   a Monday holiday inside opex week — is inapplicable here, and 2027 was the last year of the only
   unbroken three-year run in the window.

5. **The sibling's headline long-weekend vol edge does not survive the expiration split — SUPPORTED,
   and it is the load-bearing find.** From SPY/^VIX daily bars 2010-01-01 → 2026-09-08, every Friday
   close followed either by a Monday session (ordinary weekend) or by a Tuesday session with no
   Monday bar (Monday holiday), split by whether that Friday was a monthly equity expiration:

   | Set | Description | n | median \|open gap\| | per calendar day | median ΔVIX over the gap | VIX higher on reopen |
   |---|---|---|---|---|---|---|
   | A | **Holiday weekend, Friday WAS opex — the 2028 shape** | 21 | 0.457% | **0.152%** | **+0.340** | **12/21 (57%)** |
   | B | Holiday weekend, Friday was not opex — the 2027 shape | 64 | 0.370% | 0.123% | +0.695 | **49/64 (77%)** |
   | C | Ordinary weekend, Friday WAS opex | 174 | 0.312% | 0.156% | −0.055 | 82/174 (47%) |
   | D | Ordinary weekend, Friday was not opex | 581 | 0.301% | 0.150% | +0.220 | 340/581 (59%) |

   Set A against **all** ordinary weekends (422/755, 56%) gives a two-proportion **z of 0.11**. The
   2027 ledger's "71% versus 56%" is set A and set B pooled; unpooled, the whole of it lives in set B.
   Two consequences, stated separately because they cut different ways: this ledger's date sits in
   set A and therefore inherits **no** rebound premium, and the sibling's own registered forward test
   (`FT-presidents-day-market-closure-2027-02-15-1`, keyed on 2027-02-12 → 2027-02-16) sits in set B,
   whose base rate is **77%, higher than the 71% it was registered against**. That is an observation
   about their fragment, recorded here; their file is not touched.

6. **The suppression is not an n=21 story — SUPPORTED at large n on the no-holiday sample.** Sets C
   and D contain no holidays at all and differ only in whether the Friday was an expiration:
   **47% (82/174)** versus **59% (340/581)**, two-proportion **z = −2.66**. The holiday split runs the
   same direction at z = −1.72. So the effect being claimed — an expiration Friday suppresses the
   next session's VIX rebound — rests on the 755-observation sample, and the 21-observation one only
   has to be *consistent* with it, which it is. **The mechanism is a hypothesis, not a measurement:**
   a monthly expiration retires a large block of open interest and resets dealer positioning, and the
   VIX index's own constituent SPX series roll around the monthly cycle. Nothing here isolates which.

7. **The "less price risk per calendar day" result also fails to transfer — SUPPORTED.** The 2027
   ledger's finding that a three-day weekend carries *less* gap risk per calendar day (0.135% vs
   0.151%) is likewise a set-B property: set A runs **0.152%/day** against set D's **0.150%** and set
   C's **0.156%** — flat. Set A's absolute median gap is the widest of the four (0.457%), consistent
   with expiration Fridays preceding livelier reopens generally. Neither direction is claimed as an
   edge; the point is only that the sibling's number must not be quoted for this date.

8. **The corridor is one-sided, and that inverts the attribution trap — SUPPORTED.** Scanned across
   all 871 canonical entries and proposals, the ±5-day corridor of 2028-02-21 holds exactly three
   distinct ids, **all upstream**: `fomc-minutes-2028-02-16` (D-5, canonical, `estimate`, medium),
   `vix-expiration-2028-02-16` (D-5, proposal, `estimate`) and `opex-2028-02-18` (D-3, proposal,
   `estimate`). Nothing at all is dated 2028-02-22 → 2028-02-26. The 2027 sibling had to warn that a
   post-holiday Tuesday move carried three competing explanations; here the congestion is entirely
   *before* the shut day and **2028-02-22 is the cleanest post-holiday reopen currently on this
   calendar**. That is the one genuinely useful property this row holds, and it is exactly the
   property a later entry can destroy — hence the "This quarter" call.

9. **The proposer's "structurally unable to collide" claim reproduces by arithmetic — SUPPORTED on
   the geometry, INHERITED on the base rates.** The quantisation is exact and needs no data: the
   closure is always a **Monday** (5 U.S.C. 6103), and a D+21 minutes release from a last-Wednesday-
   of-January decision is always a **Wednesday**, so the signed gap can only ever be **+2 or −5** days
   and can never enter the |gap| ≤ 1 band. Verified for this instance: `fomc-2028-01-26` is a
   Wednesday, +21 days is **2028-02-16**, also a Wednesday, and 02-16 − 02-21 = **−5**. What is *not*
   re-measured here is the displacement base rate that makes the band interesting (|gap| ≤ 1 → 4
   displaced of 5; |gap| ≥ 2 → 0 of 14), which belongs to
   [`fomc-minutes-2027-12-29.md`](fomc-minutes-2027-12-29.md) and is recorded as inherited.

10. **The 2027 duplicate defect did not propagate to 2028 — SUPPORTED, but its issue is still open.**
    The 2027 sibling's operationally load-bearing find was that one shut day was filed twice, as
    `presidents-day-market-closure-2027-02-15` and `washingtons-birthday-market-closure-2027-02-15`
    (NYSE heads the row *Washington's Birthday*, SIFMA calls it *Presidents Day*), filed as **#1609**.
    Re-scanned this session: **2028-02-21 carries exactly one id**, and 2027-02-15 still carries two.
    #1609 is **OPEN** and labelled `stall-flagged` as of 2026-09-09. This ledger reports that rather
    than acting on it — reconciling ids is a calendar-ownership call, and this lane owns one file.

11. **SIFMA has not published a 2028 US schedule — SUPPORTED as a negative, and it is a hole, not a
    finding.** Every panel on the page was enumerated. US rows exist for 2026 and 2027; Presidents
    Day appears as `Monday, February 16, 2026` and `Monday, February 15, 2027`, both with an **empty**
    note (no flanking early close). The only 2028 dates anywhere on the page are the 2027 schedule's
    year-boundary tail, `New Year's Day 2027/2028 — Saturday, January 1, 2028`. So the 2027 sibling's
    sourced fixed-income conclusion **cannot be carried into 2028**, and this ledger declines to.

12. **Nothing in the house system is calendar-keyed — SUPPORTED, re-verified not inherited.** A grep
    of `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md` for
    `holiday|presidents|washington|closure|half-day|early close` returns **zero hits in both files**,
    run this session. No playbook can fire on this date in either direction.

### What plays the conditions support

None. A closed session cannot be traded, `symbols` is empty, impact is `low`, and the date is
`estimate`. The supported outputs are the five in the signals list: the expiration-split correction
to the sibling's caution, the recorded absence of any fixed-income source for 2028, the corrected
session and span counts, the inverted attribution direction, and the clean-reopen property of
2028-02-22 that a later calendar entry could remove.

### Honest limits

- **Set A is 21 observations and cannot carry the claim alone.** It is quoted because it is the exact
  configuration of this date, not because it is a sample. The load-bearing statistic is the
  no-holiday split (n=755, z = −2.66); the holiday split is corroboration at z = −1.72, which on its
  own would not clear any reasonable bar.
- **Exactly one out-of-sample instance scores before this event** — the post-expiration MLK weekend
  of 2027-01-18, reopening 2027-01-19. One observation cannot settle a proportion, and the registered
  test says so in its own kill switch rather than pretending otherwise.
- **The suppression mechanism is unmeasured.** Open-interest retirement, dealer-gamma reset and the
  VIX constituent roll are all consistent with the numbers; nothing here distinguishes them, and no
  claim rests on which is true.
- **^VIX is an index, not a tradeable.** Every vol statistic is spot-VIX close-to-close. It does not
  price any option, spread or futures roll, and no such number is asserted.
- **The FOMC-minutes base rates are inherited** from `fomc-minutes-2027-12-29.md` (leg 9). Only the
  weekday quantisation was reproduced here, and that half needs no data.
- **530 days out, everything in the corridor is `estimate`** — including the closure itself, the
  minutes, the VIX settlement and the expiration, two of which exist only as proposals. Estimates
  widen caution and license nothing.
- **The 2028 fixed-income schedule does not exist yet**, so the cross-asset picture is genuinely
  unknown rather than known-benign.

## Stance & kill switches

**Stance (2026-09-09):** stand aside, permanently and structurally — this row holds a correction, a
recorded source hole and one perishable calendar property, not a view. Concretely: (a) the 2027
sibling's long-weekend vol caution is **subset-specific and does not apply to this date** — split by
whether the preceding Friday was a monthly expiration, the VIX-higher-on-reopen rate is 77% (49/64)
when it was not and 57% (12/21) when it was, the latter statistically indistinguishable (z = 0.11)
from the 56% ordinary-weekend baseline, with the direction corroborated at n=755 (47% vs 59%,
z = −2.66) on weekends carrying no holiday at all; 2028-02-18 **is** an expiration. (b) The
fixed-income side is **unsourced** — SIFMA publishes US panels only through 2027 — so this ledger
records a hole where the sibling could record a sourced negative. (c) The ±5-day corridor is
**one-sided**, every neighbour upstream, which makes 2028-02-22 the cleanest post-holiday reopen on
the calendar and is the only property here worth re-checking. Every statement carries the event's
**`estimate`** label.

**Kill switches:**

- **SIFMA publishes a 2028 US recommendation attaching an early close to 2028-02-18** — the "no
  cross-asset guard can be stated" position inverts into an execution note, and on an expiration
  Friday at that. Registered as **FT-presidents-day-market-closure-2028-02-21-1**, score by
  2027-12-31.
- **The post-expiration suppression fails out of sample** — re-measured after the 2027-01-19 reopen,
  set A's VIX-higher-on-reopen rate returns to the long-weekend band (≥ 70%). Legs 5–7 weaken and
  the sibling's caution has to be re-admitted for this date. Registered as
  **FT-presidents-day-market-closure-2028-02-21-2**, score by 2027-01-20.
- **A tracked calendar entry lands in 2028-02-19 … 2028-02-25** — the clean-reopen property dies and
  the "This quarter" call retires. Registered as **FT-presidents-day-market-closure-2028-02-21-3**,
  score by 2028-02-18.
- **A house playbook keyed on holiday-adjacent sessions is written and back-tested** — leg 12 goes
  stale and the stand-aside is re-argued on measured data rather than on absence.
- **#1609 is resolved by merging ids rather than by picking one** — if the reconciliation renames
  this naming family, this file's id moves with it.
- **NYSE or the Federal Reserve Board republishes with a different 2028 date** — everything re-dates.
  (No mechanism exists; 5 U.S.C. 6103 fixes the third Monday. Listed for completeness.)

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-09 | 530 | **Initial research.** Canonical `<id>.json` written from the one prior proposal (`from-fomc-minutes-2028-02-16`), which is now shadowed. Date triple-legged — NYSE holiday table (full footnote list read; none attaches to February), Federal Reserve Board k8 (unasterisked, Banks **and** Board shut), 5 U.S.C. 6103 arithmetic — stays `estimate` on the taxonomy gap alone. **Geometry inverts vs 2027:** third Friday 2028-02-18, third Monday 2028-02-21, so the holiday sits **after** a full five-session expiration week; the four-session week is 02-22→02-26. **Sibling's headline does not transfer:** SPY/^VIX bars 2010→2026-09-08 (cache busted) split by expiration-Friday give VIX-up-on-reopen **57% (12/21)** for the 2028 shape vs **77% (49/64)** for the 2027 shape, z=**0.11** against the 56% (422/755) ordinary baseline; corroborated with no holidays at all, **47% (82/174)** vs **59% (340/581)**, z=**−2.66**. Per-calendar-day gap flat (0.152% vs 0.150%). **Source hole:** SIFMA publishes US panels only through 2027 — 2027's "no flanking early close" is **not** carried forward. Proposer's quantisation reproduced (gap ∈ {+2,−5}; this instance −5); its base rates inherited. Adjacency — peers n/a (`symbols: []`); macro: `fomc-minutes-2028-02-16` (D-5, estimate); VIX **16.23** (2026-09-09); geopolitical: none dated here; tape: `vix-expiration-2028-02-16` (D-5) and `opex-2028-02-18` (D-3), both proposals — corridor **one-sided**, nothing dated after the closure. 2027's duplicate defect did **not** propagate (one id here); #1609 still OPEN/`stall-flagged`. Playbook grep **0 hits**. No new dated adjacent event found — no calendar proposal. | Initial stance set: **stand aside** (structural row only). Registers **FT-…-1**, **FT-…-2**, **FT-…-3**. | 2026-10-09 |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-presidents-day-market-closure-2028-02-21.json`
(`status: "estimate"`) in the same PR — your own file, never another event's canonical one (#1717).
Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from
memory — after which this doc goes quiet.
