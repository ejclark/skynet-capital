# SIFMA-recommended US fixed-income early close, 2:00 p.m. ET — sifma-bond-early-close-2027-03-25

**Kind:** rates · **Date:** 2027-03-25 (estimate — NEWS: SIFMA `sifma.org/resources/guides-playbooks/holiday-schedule` US Holiday Recommendations panel, re-fetched and re-parsed 2026-09-05; the `estimate` label is a taxonomy gap plus a genuinely non-binding source, not a doubt about the published date) · **Impact:** low
**Last assessed:** 2026-09-05
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"low:15+","adjacentIds":["boj-summary-of-opinions-2027-03-29","ftc-v-amazon-antitrust-trial-2027-03-29","good-friday-market-closure-2027-03-26","japan-cpi-tokyo-flash-2027-03-26"],"screenStreak":0} -->

## At a glance

**TL;DR.** **Stand aside — and demote this event from "notable" to "routine."** The sibling
`good-friday-market-closure-2027-03-26` ledger filed 2027-03-25 as its headline find: a full equity
session (to 16:00 ET) running against a fixed-income tape that SIFMA recommends closing at 14:00 ET.
The date and the time both reproduce independently this session. What does **not** survive is the
framing. Parsing SIFMA's whole published schedule rather than one cell, and pairing it against NYSE's
own early-close footnotes, gives **twelve** dated equity/bond hour pairs across 2026–2027 — and
**nine of them are the same "bonds shut two hours before equities" shape**. It happens four to five
times a year. Worse for the framing, the equity tape on this exact calendar slot has no signature at
all: across **17 pre-Good-Friday Thursdays (2010–2026)**, SPY traded a median **0.91×** its own
trailing-20-session median volume, with **6 of 17 above 1.0×** — no reliable thinning, and move
magnitude ranging 0.03×–3.73× of normal (no signal). One real output survives, narrowed: a
**cross-asset execution note** — anything hedging an equity leg with a duration leg loses its bond
reference two hours before the equity close — and it is a property of ~5 days a year, not of this
date. Everything here carries the event's **`estimate`** label; `symbols` is empty and no house
playbook is holiday-keyed (re-grepped to zero hits).

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — nothing to size, and a bond early close is not a market event | High | D-201, `symbols: []`, `impact: low`; `trade-playbooks.md` and `multi-symbol-sweep.md` grepped for `holiday\|good friday\|closure\|half-day\|early close` return **0 hits in both**, re-run this session | A holiday- or session-hours-keyed house playbook being written and back-tested before **2027-03-25** — the "nothing can fire on this date" leg dies and this sheet is rebuilt on measured data |
| This week | **Stand aside; write the correction down, do not act on it** | High | The one deliverable is the demotion — 9 of 12 published 2026–2027 equity/bond pairs share this exact shape, so "asymmetry on 03-25" is the ordinary case | Any row of the cross-asset table below failing to reproduce from the SIFMA panel + NYSE footnotes before **2026-10-05** — the routineness leg collapses and the sibling's framing stands |
| This month | **Stand aside** — the near-dated item this finds is another structural row, not a trade | Medium | The sweep found NYSE's **2026-12-24** 1:00 p.m. equity half-day untracked while its Thanksgiving twin is tracked; proposed as `christmas-eve-half-day-2026-12-24` (`estimate`) in this PR | NYSE republishing its hours page without the `****` footnote naming Thursday, December 24, 2026 before **2026-12-01** — the proposal is withdrawn |
| This quarter | **Do not treat a SIFMA early close as an event class worth a ledger each** — treat it as a standing execution note | Medium | SIFMA publishes ~6 US early closes per year, all at 2:00 p.m. ET in both published years; measured equity footprint on the closest analogue is nil (median 0.91× volume, n=17) | SPY volume on **2027-03-25** printing **below 0.80×** its trailing-20-session median — the "no footprint" claim fails on the instance that matters. Registered as **FT-sifma-bond-early-close-2027-03-25-1** |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit or hedge is keyed to 2027-03-25. The date is `estimate`, the source is
  explicitly a *recommendation*, and date-keyed action requires `confirmed` regardless.
- **Execution note (Thu 2027-03-25), narrowed:** equities run a full session to 16:00 ET; SIFMA
  recommends fixed income close at **14:00 ET** (`estimate`). A cross-asset construction loses its
  bond-side reference two hours early. True — and true on roughly five days a year, so it is a
  standing operational fact, not this date's distinguishing feature.
- **Settlement is not affected.** SIFMA's own page states verbatim that "Previously scheduled SIFMA
  early close recommendations do not affect the closing time for settlements."
- **The genuinely unusual days in the published window are elsewhere:** **2026-11-27** and
  **2027-11-26** (equities 13:00 ET, bonds 14:00 — bonds outlive equities by an hour), and
  **2026-04-03** (equities shut, bonds trade a 12:00 ET half session).
- **Drop the FT-opex contamination caveat.** This event's own `notes` claim that a 03-25 bond early
  close is an unrecorded measurement caveat on `FT-opex-2027-03-19-1`. It is not: that test reads
  **QQQ closes** on a **full-length equity session**. See leg 4.
- **Do not read a thin tape into this date in advance.** Measured: median SPY volume on the
  pre-Good-Friday Thursday is 0.91× normal, and 6 of the last 17 were *above* normal.

## Initial research

### The question

This row exists because a sibling ledger called it the load-bearing find of the whole March 2027
corridor. Two questions follow, and neither has been asked here before: **is the cross-asset
schedule asymmetry on 2027-03-25 actually unusual**, and **does a SIFMA-recommended fixed-income
early close leave any measurable footprint on the equity tape we could ever act on?**

**One-line verdict:** the schedule fact is **real and correctly dated**, but it is the **ordinary
configuration** (9 of 12 published equity/bond pairs in 2026–2027 share it) and it has **no measured
equity signature** on this calendar slot — so the honest output is a standing execution note, a
demotion of the sibling's framing, and a correction to a caveat currently attached to another
event's forward test.

### Method

Macro / market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — no
symbol-keyed instrument applies (`symbols: []`). Nothing below is inherited from the sibling ledger;
every primary was re-fetched and re-parsed this session, and the two measurements are new.

- **SIFMA** `sifma.org/resources/guides-playbooks/holiday-schedule` — HTTP 200, 298,926 bytes. The
  year/region tabs are hidden panels the rendered text drops, so the whole embedded Next.js payload
  was parsed into **118 heading/date/note triples** spanning the US, UK and Japan panels for 2026
  and 2027 — rather than reading the single Good Friday cell the sibling read.
- **SIFMA** press release *"SIFMA Changes Early Close Recommendation Policy"* (2009-04-03) — HTTP
  200, 136,334 bytes, read in full for the stated policy and its retained-holiday list.
- **NYSE** `nyse.com/markets/hours-calendars` — HTTP 200, 109,180 bytes, re-fetched and its **four**
  early-close footnotes extracted verbatim (not just the Thanksgiving one).
- **Measured, with Yahoo split/dividend-adjusted daily bars** (the same source
  `scripts/research/market-data.mjs` uses), two ad-hoc passes over SPY: the **17 pre-Good-Friday
  Thursdays 2010–2026** (this event's exact calendar slot) and, as a contrast set, the **17
  pre-Memorial-Day Fridays 2010–2026** (the same bond-early-close shape before a different
  three-day weekend). Metric per instance: session volume ÷ trailing-20-session median volume, and
  |close-to-close return| ÷ trailing-20-session median |return|.
- **Attempted and failed, recorded rather than worked around:** `cmegroup.com` — the holiday
  calendar (two URL forms), the trading-hours page and the 2027 holiday-calendar PDF, under two
  browser user-agents: **HTTP 403 on all five attempts**, matching the sibling's experience.
- **Re-grepped, not cited:** `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md`.

### Conviction legs, tested

1. **The date and the 14:00 ET time reproduce independently — SUPPORTED (and it stays
   `estimate`).** The US 2027 panel entry parses as three fields: `Good Friday` /
   `Friday, March 26, 2027` / `Early Close (2:00 p.m. Eastern Time): Thursday, March 25, 2027`. The
   same field shape reproduces across all 118 entries. It stays `estimate` on three counts, and the
   third is not a taxonomy quibble: the prefix taxonomy in `market-events-data.ts` has no slot for a
   trade association's recommended schedule; this lane may not self-confirm an in-sweep discovery;
   and **the source is non-binding by its own terms** — the 2009 policy release states verbatim that
   "All SIFMA calendar recommendations are subject to change due to market conditions."

2. **The cross-asset asymmetry is the ORDINARY case — REFUTES the sibling ledger's framing.**
   Pairing the SIFMA US panels against NYSE's early-close footnotes gives every dated
   equity-hours/bond-hours mismatch in the published window:

   | Date | Equity (NYSE) | Bond (SIFMA rec.) | Shape |
   |---|---|---|---|
   | 2026-04-03 (Good Friday) | **closed** | 12:00 ET half session | bonds trade, equities dark |
   | 2026-05-22 Fri | full, 16:00 | 14:00 | bonds −2h |
   | 2026-07-02 Thu | full, 16:00 | 14:00 | bonds −2h |
   | 2026-11-27 Fri | **13:00** | 14:00 | **bonds +1h** |
   | 2026-12-24 Thu | **13:00** | 14:00 | **bonds +1h** |
   | 2026-12-31 Thu | full, 16:00 | 14:00 | bonds −2h |
   | **2027-03-25 Thu** | **full, 16:00** | **14:00** | **bonds −2h** |
   | 2027-05-28 Fri | full, 16:00 | 14:00 | bonds −2h |
   | 2027-07-02 Fri | full, 16:00 | 14:00 | bonds −2h |
   | 2027-11-26 Fri | **13:00** | 14:00 | **bonds +1h** |
   | 2027-12-23 Thu | full, 16:00 | 14:00 | bonds −2h |
   | 2027-12-31 Fri | full, 16:00 | 14:00 | bonds −2h |

   **Nine of twelve** are the bonds−2h shape, ~4–5 per year. 2027-03-25 is the **first** of 2027's
   six US early closes and is otherwise indistinguishable from five siblings that year. What is
   genuinely atypical in this window is the *opposite* configuration — the three days where bonds
   outlive equities, and 2026's lone 12:00 ET Good Friday half session (the only non-14:00 US early
   close in either published year).

3. **The equity tape has no measurable signature on this calendar slot — SUPPORTED, and it is the
   first house measurement of the claim.** SPY, 17 pre-Good-Friday Thursdays (2010–2026), against
   each session's own trailing-20 median:

   | Set | Median volume ratio | Mean | Instances below 1.0× | Median \|ret\| ratio | Range of \|ret\| ratio |
   |---|---|---|---|---|---|
   | Pre-**Good Friday** Thursday (this slot) | **0.91×** | 0.91× | **11 of 17** | 0.59× | 0.03× – 3.73× |
   | Pre-**Memorial Day** Friday (contrast) | 0.76× | 0.84× | 13 of 17 | 0.81× | 0.09× – 2.78× |

   The pre-long-weekend thinning that *does* show up before Memorial Day (−24% median volume) is
   **largely absent** before Good Friday (−9%, with 6 of 17 instances above normal). Move magnitude
   is a coin flip in both sets — a median below 1.0× against a mean at ~0.9–1.0× and a 40×
   peak-to-trough spread is dispersion, not an edge. Nothing here supports an ex-ante expectation
   about the 2027-03-25 session in either direction.

4. **"The 03-25 early close is an unrecorded measurement caveat on `FT-opex-2027-03-19-1`" —
   REFUTED as stated.** This event's own `notes` field makes that claim. That forward test measures
   **QQQ close-to-close realized volatility** over the four sessions 2027-03-22 → 2027-03-25. NYSE's
   early-close footnotes, re-extracted verbatim this session, name exactly four dates —
   2026-11-27, 2026-12-24, 2027-11-26, 2028-07-03 and 2028-11-24 — and **none is in March 2027**. So
   the 03-25 equity session is full-length and the QQQ close that test consumes is an ordinary 16:00
   print; a fixed-income early close cannot move it. The residual concern is a *different* one — the
   final observation lands on a pre-three-day-weekend session — and that is an equity-side holiday
   effect the test's own construction already names, measured at 0.91× volume in leg 3. **The
   forward-test row is not edited**: rows are append-only and that fragment belongs to another
   event. The correction lives here.

5. **A SIFMA early close moves trading hours, not settlement — SUPPORTED, and new to this repo.**
   Verbatim from the schedule page: *"Previously scheduled SIFMA early close recommendations do not
   affect the closing time for settlements."* The same paragraph scopes the recommendation to *"the
   trading of U.S. dollar-denominated government securities, mortgage- and asset-backed securities,
   over-the-counter investment-grade and high-yield corporate bonds, municipal bonds and secondary
   money market trading in bankers' acceptances, commercial paper and Yankee and Euro certificates
   of deposit."*

6. **SIFMA's published policy no longer describes its published schedule — MIXED, and it caps how
   far any policy-based prediction can go.** The 2009 release announced a cut "from twelve to five"
   recommended early closes and named *"Day before Independence Day"* among those **eliminated**,
   retaining only Good Friday, Memorial Day, Thanksgiving (day after), Christmas and New Year's. Yet
   both published US panels carry **six**, including an Independence-Day-adjacent early close
   (2026-07-02 and 2027-07-02). Whether that is a later unpublished revision or an artifact of the
   observed-holiday shift is **not asserted here** — no source retrieved settles it. The consequence
   is the useful part: the 2009 text cannot be used to predict what SIFMA will publish, which is the
   strongest available caution on the sibling ledger's leg 7 (its unsourced payrolls-based
   explanation of the 12:00-vs-14:00 difference).

7. **Nothing in the house system is holiday-keyed — SUPPORTED, re-verified not inherited.** A grep
   of `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md` for
   `holiday|good friday|closure|half-day|early close` returns **zero hits in both**, run this
   session. No playbook can fire on this date in either direction.

8. **The CME futures leg is still unretrievable — UNRESOLVED.** Five attempts across three URL forms
   and two browser user-agents, all HTTP 403. This ledger therefore does **not** assert what CME
   Globex does on 2027-03-25 or 2027-03-26. Left unstated rather than assumed, exactly as the
   sibling left it.

9. **A dated adjacency the calendar is missing — NYSE's 2026-12-24 equity half-day.** Footnote
   `****` reads verbatim: *"Each market will close early at 1:00 p.m. (1:15 p.m. for eligible
   options) on Thursday, December 24, 2026."* Its Thanksgiving twin is already tracked
   (`thanksgiving-half-day-2026-11-27`), and that entry's own notes record a prior lane finding this
   very date and declining it before the `sector` precedent existed. Proposed here as
   `christmas-eve-half-day-2026-12-24` (`estimate`).

### What plays the conditions support

None. `symbols` is empty, impact is `low`, the date is `estimate` and the source is a
recommendation rather than a rule. The supported outputs are the four already in the signals list:
the narrowed cross-asset execution note, the settlement clarification, the demotion of the
"asymmetry" framing, and the withdrawal of the FT-opex caveat.

### Honest limits

- **The measurement bounds a total effect; it cannot attribute one.** A pre-Good-Friday Thursday is
  simultaneously a pre-three-day-weekend session and (in some years) a bond early close. The 0.91×
  figure caps how large *any* combined effect can be — it does not isolate the bond close, and
  nothing here claims it does.
- **The historical bond-schedule shape was not verified year by year.** Only the 2026 and 2027 US
  panels are published today; earlier years' early closes are taken from the 2009 policy's retained
  list. This qualifies the Memorial-Day contrast set's *label*, not the Maundy-Thursday result,
  which measures the equity side and does not depend on the bond schedule at all.
- **Daily bars only.** The natural question — what happens in the 14:00–16:00 ET window
  specifically — needs intraday volume this repo's instruments do not provide. A whole-day proxy
  bounds it; it does not answer it.
- **n = 17, and no significance is claimed.** Seventeen annual observations, one of them 2020.
- **The CME leg is missing** (leg 8), and the event is `estimate` (leg 1). Estimates widen caution
  and license nothing.

## Stance & kill switches

**Stance (2026-09-05):** stand aside, permanently and structurally — and **demote the framing this
row inherited**. Concretely: (a) the full equity session against a 14:00 ET recommended bond close
on 2027-03-25 is confirmed as published, but it is the **ordinary** configuration — 9 of the 12
dated equity/bond pairs in the published 2026–2027 window share it, ~4–5 times a year. (b) The
equity tape on this exact calendar slot carries **no measured signature**: median SPY volume 0.91×
normal over 17 instances, with 6 above 1.0×, and move magnitude dispersed across 0.03×–3.73×. (c)
The single surviving output is a **cross-asset execution note**, which is a standing operational
fact rather than a property of this date. (d) SIFMA's recommendation moves trading hours, **not
settlement**. Every statement carries the event's **`estimate`** label.

**Kill switches:**

- **SPY volume on 2027-03-25 comes in below 0.80× its trailing-20-session median** — the "no equity
  footprint" leg fails on the instance that matters, and (b) is rewritten. Registered as
  **FT-sifma-bond-early-close-2027-03-25-1**, score by 2027-03-31.
- **SIFMA revises or withdraws the 2027-03-25 recommendation** (including moving the early close to
  Good Friday itself, the 2026 shape) — the event's premise changes and this ledger re-dates. Note
  the sibling's `FT-good-friday-market-closure-2027-03-26-1` already measures that specific flip;
  this is the same observation seen from this row and is deliberately **not** re-registered.
- **NYSE adds an equity early close adjacent to 2027-03-25** — the cross-asset note inverts to the
  bonds+1h shape and legs 2 and 4 both need rewriting.
- **A holiday- or session-hours-keyed house playbook is written and back-tested** — leg 7 goes
  stale and the stand-aside must be re-argued on measured data rather than on absence.
- **A retrievable CME source appears** — leg 8 resolves and the futures leg can finally be stated.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-05 | 201 | **Initial research.** SIFMA page re-fetched (HTTP 200, 298,926 B) and its whole embedded payload parsed — **118** entries across US/UK/Japan 2026–2027, not one cell; US 2027 Good Friday = full bond close 03-26 + `Early Close (2:00 p.m. ET): Thursday, March 25, 2027`, reproduced. **Sibling framing demoted:** pairing SIFMA against NYSE's four early-close footnotes gives 12 dated equity/bond pairs, **9 of them the same bonds−2h shape** (~4–5/yr); the atypical days are 2026-11-27 / 2026-12-24 / 2027-11-26 (bonds +1h) and 2026-04-03 (bonds trade, equities dark). **Measured (new):** SPY over 17 pre-Good-Friday Thursdays 2010–2026 = median **0.91×** trailing-20 median volume, 6 of 17 above 1.0×, \|ret\| ratio 0.03×–3.73× — no signature; contrast pre-Memorial-Day Friday 0.76×. **Refuted:** this event's `notes` claim of contaminating `FT-opex-2027-03-19-1` — that test reads QQQ closes on a full-length equity session (no NYSE March-2027 early close). **New verbatim:** early closes "do not affect the closing time for settlements". 2009 policy names 5 retained early closes but both panels publish 6 — policy no longer predicts schedule. Adjacency — peers n/a (`symbols: []`); macro: none datable to 03-25 (BLS/BEA publish no 2027 schedule); VIX **14.53** (close 2026-09-04); geopolitical: none; tape: `good-friday-market-closure-2027-03-26`, `japan-cpi-tokyo-flash-2027-03-26`, `boj-summary-of-opinions-2027-03-29`, `ftc-v-amazon-antitrust-trial-2027-03-29`. CME **403 ×5** — futures leg unstated. Proposes `christmas-eve-half-day-2026-12-24.json` (`estimate`); the four other 2027 US bond early closes are recorded here, **not** proposed (identical structural objects, zero impact — five more rows would spend five research sessions for nothing). | Initial stance set: **stand aside**, with the inherited "notable asymmetry" framing demoted to routine. Registers **FT-sifma-bond-early-close-2027-03-25-1**. | 2026-10-05 |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new `src/domain/market-events/<id>.json`
(`status: "estimate"`) in the same PR. Close-out fills `## Outcome` below from re-run instrument
data (cache busted first), never from memory — after which this doc goes quiet.
