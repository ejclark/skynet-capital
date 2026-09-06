# SIFMA-recommended US fixed-income early close, 2:00 p.m. ET — the last session of 2026 — sifma-bond-early-close-2026-12-31

**Kind:** rates · **Date:** 2026-12-31 (estimate — NEWS: SIFMA `sifma.org/resources/guides-playbooks/holiday-schedule` US Holiday Recommendations panel, re-fetched and re-parsed 2026-09-05; the `estimate` label is a taxonomy gap plus a source that is non-binding by its own terms, not a doubt about the published date) · **Impact:** low
**Last assessed:** 2026-09-05
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"low:15+","adjacentIds":["advance-economic-indicators-2026-12-28","boj-summary-of-opinions-2026-12-28","china-retaliation-suspension-expiry-2026-12-31","fomc-minutes-2026-12-30","georgia-psc-data-center-cost-shift-2026-12-31","jpx-market-closure-2026-12-31","nerc-computational-load-standards-2026-12-31"],"screenStreak":0} -->

## At a glance

**TL;DR.** **Stand aside — but for the opposite reason the sibling ledgers would lead you to
expect.** The bond early close itself is settled and boring: `sifma-bond-early-close-2027-03-25`
already showed the "bonds shut at 14:00, equities run to 16:00" shape is 9 of 12 published
2026–2027 pairs, and SIFMA's own 2025/2026 card proves the **year-end** instance is an annual
fixture, not a 2026 quirk. What is new is the **session**. Measured this session from SPY daily
bars (1993–2025, n=33 year-end final sessions): volume runs a median **0.97×** its own trailing-20
median against a **0.99×** all-session baseline — the last session of the year is a **normal-volume
session**, not a thin one. That directly refutes the generalization a reader would import from
[`christmas-eve-half-day-2026-12-24`](christmas-eve-half-day-2026-12-24.md) six sessions earlier
(0.34×): *pre-holiday* does not imply *thin* at year-end. The second finding is a real directional
tilt and it is handled as a measurement, not a trade: close-to-close **up 11 of 33 (33.3%)** against
a **54.1%** all-session base rate, median **−0.29%**, one-sided binomial **p = 0.0132**, stable
across subsamples (5/17 then 6/16) — but it is a **data-mined calendar slot** at n=33, and it is
**perfectly collinear with the bond early close**, which recurs every year-end, so nothing here can
be attributed to SIFMA's recommendation. Two structural finds are genuinely new: the three SIFMA
regions sit in **three different states** on this date (US early close · **Japan fully shut** ·
UK normal), and the date is **crowded** — four tracked events land on it, including a medium-impact
China tariff-exclusion expiry, one session after **confirmed** FOMC minutes. Everything carries the
event's **`estimate`** label; `symbols: []`, impact `low`, no house playbook is calendar-keyed.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — a recommended bond early close is not a market event and there is nothing to size | High | D-117, `symbols: []`, `impact: low`; `trade-playbooks.md` and `multi-symbol-sweep.md` grepped this session for `holiday\|santa\|year-end\|closure\|half-day\|early close` return **0 hits in both** | A holiday- or session-hours-keyed house playbook being written and back-tested before **2026-12-31** — the "nothing can fire on this date" leg dies and this sheet is rebuilt on measured data |
| This week | **Bank the liquidity correction; do not act on it** | High | The deliverable is a refusal of an inherited generalization: year-end final sessions run **0.97×** normal volume (n=33) against Christmas Eve's **0.34×**. Slippage assumptions carried over from 12-24 to 12-31 would be wrong by ~3× | Any figure in leg 3 failing to reproduce from Yahoo SPY daily bars on the stated definition (session volume ÷ trailing-20-session **median** volume) before **2026-10-05** |
| This month | **Do not read this date as empty** — treat it as an attribution trap, not a structural blank | Medium | Four tracked events share **2026-12-31** (`china-retaliation-suspension-expiry` medium, `georgia-psc-data-center-cost-shift` medium, `nerc-computational-load-standards` low, this one), and `fomc-minutes-2026-12-30` is **confirmed** at D-1. The bond close is the least consequential item on its own date | All three sibling 12-31 items being re-dated or withdrawn from the calendar before **2026-12-31**, leaving the session structurally empty after all — the crowding leg falls |
| This quarter | **Do not trade the year-end weakness, despite p = 0.0132** — record it, do not size it | Low | 33 annual observations, a slot chosen after looking, a median of **−0.29%** against a 0.79% SD, and no way to separate the session from a bond early close that recurs every year-end. Confidence LOW is the call, so the size is zero | SPY's **2026-12-31** close-to-close printing positive — one out-of-sample miss against a 67% prior neither kills nor promotes the seasonal, but it is the first observation this refusal must answer for. Registered as **FT-sifma-bond-early-close-2026-12-31-2** |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never a trade on this date.** `symbols: []`, no calendar-keyed playbook, and the date is
  `estimate` — date-keyed *action* requires `confirmed` regardless. The measured tilt below changes
  none of that.
- **Execution note (Thu 2026-12-31):** equities run a full session to **16:00 ET**; SIFMA recommends
  US fixed income close at **14:00 ET** (`estimate`). A cross-asset construction loses its bond-side
  reference two hours before the equity close — true, and true on ~4–5 days a year, so it is a
  standing operational fact rather than this date's distinguishing feature.
- **The cross-jurisdiction state is this date's distinguishing feature, and it is new.** On
  2026-12-31 SIFMA's three regions differ: **US** early close 14:00 ET, **Japan** a full
  `Bank Holiday` (JPX independently publishes `Dec. 31 (Thu.) Market Holiday`), **UK** a normal
  session. A duration or JGB leg is not merely early — it is **absent all day**.
- **The post-14:00 window has one venue.** After 14:00 ET the US cash bond tape and Tokyo are both
  shut; the equity tape alone runs to 16:00. Any news on the same-date China tariff-exclusion expiry
  landing in that window has one expression venue, not three.
- **Do not import the 12-24 slippage assumption.** Measured: year-end final sessions run a median
  **0.97×** normal volume (n=33, range 0.47–1.74 excluding a 1994 microstructure outlier), against
  **0.34×** for the Christmas Eve half day. Plan against a normal session.
- **Settlement is not affected.** SIFMA's page states verbatim that "Previously scheduled SIFMA early
  close recommendations do not affect the closing time for settlements" (inherited from the
  2027-03-25 sibling's leg 5, not re-extracted this session).
- **The year-end tilt, stated as a measurement:** close-to-close up **11 of 33** (33.3%) vs a 54.1%
  base rate, median **−0.29%**, binomial **p = 0.0132**. Placebo controls: the **2nd**-to-last
  session is also 11/33; the **3rd**-to-last is 17/33 (neutral); the **1st** session of the new year
  is 18/33, median +0.18%. So the weakness spans the last *two* sessions, not this one alone.
- **Watch (dated):** half day **12-24** · closed **12-25** · reopen **12-28** (advance indicators,
  BoJ opinions) · FOMC minutes **12-30** (confirmed, 14:00 ET) · **this session 12-31** (US bonds
  14:00, Japan shut, China exclusion expiry, GA PSC findings, NERC filing) · **2027-01-01** closed ·
  reopen Mon **2027-01-04**.

## Initial research

### The question

A sibling has already demoted this event class. [`sifma-bond-early-close-2027-03-25`](sifma-bond-early-close-2027-03-25.md)
parsed SIFMA's whole schedule, found the bonds−2h shape in 9 of 12 published pairs, measured no
equity signature on its own slot, and filed **2026-12-31 as one row in its own table**. So the
honest question here is not "what is a bond early close" — it is **does this date have anything the
sibling's table row does not already contain?**

**One-line verdict:** the bond close contributes **nothing new** and is confirmed as an annual
fixture — but the *session* does. The last session of the calendar year is **not thin** (0.97×,
refuting a generalization the 12-24 sibling would otherwise export), it carries a **statistically
real but untradeable** directional tilt (11/33, p = 0.0132) that is inseparable from the bond close
itself, it is the one date where SIFMA's three regions disagree, and it is **crowded with four
tracked events** rather than structurally empty.

### Method

Macro / market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — no
symbol-keyed instrument applies (`symbols: []`). Instrument caches were busted
(`rm -rf node_modules/.cache/earnings-cycle node_modules/.cache/intraday-edges`) before any pull.
Primaries were re-fetched and re-parsed this session; where a finding is inherited rather than
re-derived it is labelled inherited.

- **SIFMA** `sifma.org/resources/guides-playbooks/holiday-schedule` — HTTP 200, 298,926 bytes. Parsed
  by card (`h3` heading / `span` date / `p` note) with **region attribution fixed to the page's own
  `U.S.` / `U.K.` / `Japan` `<h2>` section headings** — 66 cards across the three 2026 panels. The
  sibling parsed 118 entries but reported only the US ones; the UK and Japan year-end states below
  are new because of the region split, not because of a better fetch.
- **NYSE** `nyse.com/markets/hours-calendars` — HTTP 200 after its 302, 109,180 bytes. All
  early-close footnotes re-extracted verbatim, and the string `December 31` searched across the
  whole payload.
- **JPX** `jpx.co.jp/english/corporate/about-jpx/calendar/` — HTTP 200, 33,103 bytes, holiday panels
  parsed for the year-end rows.
- **Measured, not sourced:** SPY split/dividend-adjusted daily bars **with volume**, from the same
  Yahoo endpoint `scripts/research/market-data.mjs` uses — 8,458 bars, 1993-01-29 → 2026-09-04.
  (`bars()` itself drops the volume field, so the cached raw payload was re-read directly.) ^VIX:
  9,238 bars, close **14.53** on 2026-09-04. All ratios, up-rates, binomial tests and placebo
  controls below are computed this session.
- **Definitions, stated so they can be refuted:** volume ratio = session volume ÷ the **median**
  volume of its own trailing 20 sessions. Direction = close-to-close. "Year-end final session" = the
  last SPY bar of each calendar year, 1993–2025 (n=33); 2026 is excluded as incomplete.
- **Not attempted this session:** `cmegroup.com`, after eight documented 403s across sibling lanes.
  The futures leg is left unstated rather than assumed.
- **Re-grepped, not cited:** `docs/plans/trade-playbooks.md`, `docs/research/multi-symbol-sweep.md`.

### Conviction legs, tested

1. **The date and the 14:00 ET time reproduce independently — SUPPORTED (and it stays `estimate`).**
   The US 2026 panel card parses as three fields: `New Year's Day 2026/2027` /
   `Friday, January 1, 2027` / `Early Close (2:00 p.m. Eastern Time): Thursday, December 31, 2026`.
   NYSE's page contains **zero** occurrences of the string `December 31` and publishes exactly three
   early-close footnotes across 2026–2028 (the day after Thanksgiving in all three years, Monday
   2028-07-03, Thursday 2026-12-24) — so the equity session runs full to 16:00 ET. It stays
   `estimate` on three counts: the prefix taxonomy in `market-events-data.ts` has no slot for a trade
   association's recommended schedule; this lane may not self-confirm an in-sweep discovery; and the
   source is **non-binding by its own terms**.

2. **The year-end bond early close is an annual fixture, not a 2026 feature — SUPPORTED, and it
   removes the last reason to treat this row as novel.** The same US panel carries
   `New Year's Day 2025/2026` / `Thursday, January 1, 2026` /
   `Early Close (2:00 p.m. Eastern Time): **Wednesday, December 31, 2025**`. Both published years
   carry a year-end 14:00 ET close, and New Year's is one of the five holidays SIFMA's 2009 policy
   **retained** (inherited from the sibling's leg 6). This matters twice: it confirms the event class
   is routine, and — see leg 5 — it is why the measured tilt can never be attributed to the close.

3. **The last session of the year is NOT thin — SUPPORTED, and it refutes a generalization this
   corridor would otherwise export.** SPY, 33 year-end final sessions, each against its own
   trailing-20 median volume:

   | Set | n | Median volume ratio | Below 1.0× | Below 0.80× | Range |
   |---|---|---|---|---|---|
   | **Year-end final session** | 33 | **0.97×** | 18 of 33 | 9 of 33 | 0.47× – 1.74× |
   | All SPY sessions (baseline) | 8,438 | 0.99× | — | — | — |
   | Christmas Eve half day (sibling, n=18) | 18 | 0.34× | — | — | 0.17× – 1.07× |
   | Pre-Good-Friday Thursday (sibling, n=17) | 17 | 0.91× | 11 of 17 | — | — |

   The year-end session is **indistinguishable from an ordinary session** — 0.97× against a 0.99×
   baseline, with 15 of 33 instances *above* normal. The natural inference from the 12-24 sibling —
   *this corridor is thin, so plan for slippage* — is **wrong** by roughly 3× when carried six
   sessions forward. Excluding 1994-12-30 (a 9.10× ratio: 2.21M shares against ~0.24M neighbours, an
   early-SPY microstructure artifact, not a market event) the median is unchanged at 0.97× and the
   mean falls to 1.00×. Move magnitude is likewise near-normal: median |close-to-close| **0.473%**
   against a 0.533% all-session median — mildly quiet, not quiet.

4. **There is a real directional tilt on this slot — SUPPORTED statistically, REFUSED as
   tradeable.** Close-to-close on the year-end final session:

   | Set | n | Up rate | Median | Mean |
   |---|---|---|---|---|
   | **Year-end final session** | 33 | **11 of 33 = 33.3%** | **−0.29%** | −0.28% |
   | All SPY sessions | 8,457 | 4,573 = 54.1% | +0.07% | +0.05% |

   One-sided exact binomial, 11 of 33 against p₀ = 0.541: **p = 0.0132**. Welch-style t on the mean
   against the all-session mean: **t = −2.38** (df 32). It does **not** rest on one era — first 17
   observations 5/17 (median −0.41%), last 16 6/16 (median −0.28%), last 10 3/10 (median −0.28%).
   Placebo controls locate it: the **2nd**-to-last session of the year is also **11/33** (median
   −0.12%), the **3rd**-to-last is **17/33** (median +0.05%, i.e. neutral), and the **1st** session
   of the following year is **18/33** (median +0.18%). So the effect is a *turn-of-year* shape
   spanning the final two sessions and reversing in January — not a property of one date. Five of 33
   were below −1.0%; two above +1.0%; worst 2000-12-29 (−1.89%), best 2012-12-31 (+1.70%).

5. **The tilt cannot be attributed to the bond early close — DECISIVE LIMIT, not a caveat.** Every
   one of the 33 observations is a year-end session, and by leg 2 a year-end session is *always* a
   SIFMA-recommended bond early close (retained through the 2009 policy cut, published in both
   available years). The sample therefore contains **no contrast case** — zero year-end sessions
   without the early close — so the two are perfectly collinear and no measurement on this sample
   can separate them, now or ever. Leg 4 is a fact about the calendar slot. It is **not** evidence
   about SIFMA's recommendation, and this ledger asserts no mechanism for it: annual rebalancing,
   tax-year effects, window dressing and dealer balance-sheet constraints are all candidate stories
   and **none was tested here**.

6. **The three SIFMA regions disagree on this date — SUPPORTED, and new to this repo.** Parsed by
   region from the page's own section headings:

   | Region | 2026-12-31 state | Source field |
   |---|---|---|
   | **U.S.** | Early close **14:00 ET** | note on the `New Year's Day 2026/2027` card |
   | **Japan** | **Full close** — `Bank Holiday` | its own dated card, no early-close note |
   | **U.K.** | **Normal session** | no 12-31 card in the UK panel at all |

   Independently corroborated from a different primary: JPX's own calendar publishes
   **`Dec. 31 (Thu.) Market Holiday`** in its 2026 panel. This is a stronger statement than the
   sibling's cross-asset note — a JGB or Japan-duration leg is not shortened on 2026-12-31, it is
   **unavailable for the entire session**. Proposed as `jpx-market-closure-2026-12-31.json`
   (`estimate`), the calendar already carrying `jpx-market-closure-2027-03-22` as precedent.

7. **The date is crowded, not empty — SUPPORTED, and it inverts the framing this row inherited.**
   The seeding note calls this "IMPACT LOW AND STRUCTURAL ONLY." True of the bond close; false of the
   date. The calendar already tracks **four** events on 2026-12-31 —
   `china-retaliation-suspension-expiry-2026-12-31` (**medium**, geopolitical: China's market-based
   tariff-exclusion process for US imports expires), `georgia-psc-data-center-cost-shift-2026-12-31`
   (**medium**), `nerc-computational-load-standards-2026-12-31` (low), and this one — with
   `fomc-minutes-2026-12-30` (**confirmed**, medium, 14:00 ET) one session earlier. All four 12-31
   items are **deadline- or expiry-shaped, not print-shaped**: none is a scheduled release that must
   produce a number at a stated time, so the date carries latent headline risk rather than a
   datable event. The attribution trap is therefore severe, and it runs the opposite way to the
   12-28 one the sibling flagged: a move on 2026-12-31 has a China-trade explanation, a
   turn-of-year-flow explanation, a post-FOMC-minutes explanation and a year-end-rebalance
   explanation long before it has a bond-early-close explanation.

8. **This session strengthens the sibling's Santa Claus Rally refusal — SUPPORTED, incidentally.**
   The 12-24 sibling refused the seasonal at 23/33 (69.7%) against a 58.7% control, p = 0.134. Its
   window's **final** session is this one, measured here at a 33.3% up rate and a −0.29% median —
   the weakest slot in the whole window. The seasonal is not merely statistically indistinguishable
   from being long seven sessions; it closes on the one session in the window that measures
   negative. No new test is registered for this — it is the sibling's claim, and its refusal stands.

9. **Nothing in the house system is calendar-keyed — SUPPORTED, re-verified not inherited.** A grep
   of `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md` for
   `holiday|santa|year-end|closure|half-day|early close` returns **zero hits in both**, run this
   session. No playbook can fire on this date in either direction.

10. **The CME futures leg is still unretrievable — UNRESOLVED.** Not re-attempted after eight
    documented 403s across sibling lanes. This ledger asserts nothing about CME Globex hours on
    2026-12-31 or the 2027-01-01 closure.

### What plays the conditions support

None. `symbols` is empty, impact is `low`, the date is `estimate`, the source is a recommendation,
and the one statistically significant finding is a data-mined calendar slot that cannot be
attributed to this event and that no house playbook could act on. The supported outputs are the
guards in the signals list: the corrected (normal, not thin) liquidity expectation, the
three-region divergence with Japan fully shut, the single-venue post-14:00 window, and the
crowded-date attribution trap.

### Honest limits

- **Leg 4 is a data-mined slot and is presented as one.** The calendar position was chosen after
  looking at the data, and four placebo slots were tested alongside it. A crude Bonferroni
  adjustment over those five tests puts p = 0.0132 at roughly **0.066** — no longer significant at
  the 5% level. The subsample stability is the better argument, and it is still only 33 annual
  observations.
- **n = 33, one observation per year, and the effect is small.** A −0.29% median against a 0.79%
  standard deviation is not a size-able edge before costs, and this is an index-level observation
  with no instrument attached.
- **Collinearity is total (leg 5).** No sample can ever separate the year-end session from the
  year-end bond early close, because there are no year-end sessions without one.
- **No mechanism is asserted** for either leg 3 or leg 4. Why the year-end session is normal-volume
  while Christmas Eve is 0.34×, and why the last two sessions tilt negative, are both undescribed
  here. Candidate explanations were not tested.
- **Volume ratios are SPY's**, not consolidated tape, and the pre-2000 bars come from a period when
  SPY traded a few hundred thousand shares a day — leg 3's 1994 outlier is the visible edge of that.
- **The UK "normal session" reading is an absence-of-evidence inference** from the UK panel carrying
  no 2026-12-31 card. That is how the panel encodes a normal day, but no UK source was fetched to
  confirm it directly.
- **Legs 2 and 6 rest on SIFMA's published panels only** — the settlement clarification is inherited
  from the sibling rather than re-extracted, and the CME leg is missing entirely (leg 10).
- **Every trading-adjacent statement carries the `estimate` label.** Estimates widen caution and
  license nothing.

## Stance & kill switches

**Stance (2026-09-05):** stand aside, permanently and structurally — and **correct two inherited
framings in opposite directions**. Concretely: (a) the bond early close adds nothing the
`sifma-bond-early-close-2027-03-25` sibling has not already settled, and SIFMA's 2025/2026 card
confirms it is an **annual fixture**; (b) the seeding note's "structural only, nothing on this date"
is **wrong** — four tracked events share 2026-12-31, one of them a medium-impact China
tariff-exclusion expiry, one session after confirmed FOMC minutes; (c) the 12-24 sibling's thin-tape
finding **does not generalize** — year-end final sessions run a median **0.97×** normal volume
(n=33) against Christmas Eve's 0.34×, so slippage should be planned as ordinary; (d) a **real**
directional tilt exists on this slot (11/33 up, median −0.29%, p = 0.0132, stable across
subsamples, spanning the last two sessions) and is **refused as tradeable** — data-mined, n=33,
small, and perfectly collinear with the bond close it sits on; (e) the date's genuinely distinctive
property is **cross-jurisdictional**: US bonds close at 14:00 ET, **Japan is fully shut**, the UK
trades normally. Every statement carries the event's **`estimate`** label.

**Kill switches:**

- **SPY volume on 2026-12-31 comes in below 0.80× its trailing-20-session median** — leg 3's
  "year-end is a normal-volume session" fails on the instance that matters, and the correction to
  the 12-24 sibling's generalization is itself wrong. Registered as
  **FT-sifma-bond-early-close-2026-12-31-1**, score by 2027-01-06.
- **SPY's 2026-12-31 close-to-close prints positive** — the first out-of-sample observation against
  leg 4's 67% prior. One observation neither kills nor promotes a 33-year seasonal, and the test is
  registered at LOW confidence precisely to start an honest out-of-sample count rather than to
  settle anything. Registered as **FT-sifma-bond-early-close-2026-12-31-2**, score by 2027-01-06.
- **SIFMA revises, moves or withdraws the 2026-12-31 early-close recommendation** — the event's
  premise changes, leg 2's annual-fixture claim needs re-checking, and this ledger re-dates.
- **NYSE adds an equity early close on 2026-12-31** — the cross-asset shape inverts to the bonds+1h
  configuration, and legs 1 and 3's comparability both break (a shortened equity session cannot be
  measured against the 33 full ones).
- **JPX or SIFMA's Japan panel drops the 2026-12-31 closure** — leg 6, the date's one genuinely
  distinctive property, falls, and the proposed `jpx-market-closure-2026-12-31` is withdrawn.
- **The China tariff-exclusion expiry is extended, re-dated or resolved before 2026-12-31** — leg
  7's crowding argument loses its heaviest item and the date moves back toward the structural blank
  the seeding note described.
- **A holiday- or session-hours-keyed house playbook is written and back-tested** — leg 9 goes stale
  and the stand-aside must be re-argued on measured data rather than on absence.
- **A VIX regime shift (≥ 3 points from 14.53) before the next check** — leg 3's normal-volume
  reading is a calm-tape measurement, and the 12-24 sibling's 2018 counterexample is the in-sample
  proof that a stressed tape ignores holiday liquidity profiles entirely.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-05 | 117 | **Initial research.** Date/time reproduce: SIFMA US 2026 card `New Year's Day 2026/2027` / `Friday, January 1, 2027` / `Early Close (2:00 p.m. ET): Thursday, December 31, 2026`; NYSE payload contains **zero** `December 31` strings and only three 2026–2028 early-close footnotes, so equities run full to 16:00. **Annual fixture:** the same panel's 2025/2026 card carries `Early Close (2:00 p.m. ET): Wednesday, December 31, 2025` — the class is routine (sibling `sifma-bond-early-close-2027-03-25` already showed bonds−2h is 9 of 12 pairs). **Measured (SPY 1993–2025, n=33 year-end final sessions):** volume median **0.97×** trailing-20 median vs a **0.99×** all-session baseline, 15 of 33 *above* normal — **NOT thin**, refuting the generalization exportable from `christmas-eve-half-day-2026-12-24`'s 0.34×; median \|c-to-c\| 0.473% vs 0.533%. **Directional tilt found and refused:** up **11 of 33 (33.3%)** vs 54.1% base rate, median **−0.29%**, binomial **p = 0.0132**, t = −2.38, stable (5/17, 6/16, 3/10); placebos — 2nd-to-last 11/33, 3rd-to-last 17/33 (neutral), next-year 1st 18/33 (+0.18%). Refused: data-mined slot (Bonferroni ≈ 0.066), n=33, and **perfectly collinear** with a bond close every year-end has. **New structural:** SIFMA's three regions differ — US 14:00 ET, **Japan full `Bank Holiday`**, UK normal; JPX independently publishes `Dec. 31 (Thu.) Market Holiday`. **Date is crowded, not empty:** 4 tracked events on 12-31 (`china-retaliation-suspension-expiry` medium, `georgia-psc-data-center-cost-shift` medium, `nerc-computational-load-standards` low, this) + **confirmed** `fomc-minutes-2026-12-30` at D-1; all four 12-31 items are deadline-shaped, not print-shaped. Adjacency — peers n/a (`symbols: []`); macro: 12-28 advance indicators + BoJ opinions, 12-30 FOMC minutes; VIX **14.53** (^VIX close 2026-09-04); geopolitical: the China expiry, same date; tape: 12-24 half day, 12-25 closed, reopen 2027-01-04. CME not re-attempted (8 prior 403s) — futures leg unstated. Proposes `jpx-market-closure-2026-12-31.json` (`estimate`). | Initial stance set: **stand aside**, correcting the seeding note's "nothing on this date" and the 12-24 sibling's exportable thin-tape read in opposite directions. Registers **FT-sifma-bond-early-close-2026-12-31-1** and **-2**. | 2026-10-05 |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new `src/domain/market-events/<id>.json`
(`status: "estimate"`) in the same PR. Close-out fills `## Outcome` below from re-run instrument
data (cache busted first), never from memory — after which this doc goes quiet.
