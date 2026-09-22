# SIFMA-recommended US fixed-income early close, 2:00 p.m. ET — the last session of 2027, with no New Year holiday behind it — sifma-bond-early-close-2027-12-31

**Kind:** rates · **Date:** 2027-12-31 (estimate — NEWS: SIFMA `sifma.org/resources/general/holiday-schedule` US Holiday Recommendations panel, fetched and payload-parsed first-hand 2026-09-09; `estimate` is a taxonomy gap plus a source non-binding by its own terms, not a doubt about the published date) · **Impact:** low
**Last assessed:** 2026-09-09
<!-- probe-ref: {"symbols":{},"vix":15.72,"daysBand":"low:15+","adjacentIds":["fed-board-closure-2027-12-31","fhfa-hpi-2027-12-28","fomc-minutes-2027-12-29"],"screenStreak":0,"blocked":[{"url":"https://www.nyse.com/markets/hours-calendars","status":"403","at":"2026-09-09"}]} -->

## At a glance

**TL;DR.** **Stand aside — and stop reading this session as a quiet one.** The date and the 14:00 ET
time reproduce first-hand from SIFMA's own 2027 US panel, and the configuration that makes it unusual
— a year-end early close with **no observed holiday behind it**, because Saturday 2028-01-01 is not
observed — has a dated precedent SIFMA itself published: in 2021, the identical geometry, its panel
named the full close **"None"** and still recommended the **2:00 p.m. close on Friday 2021-12-31**.
What is new here is measured, and it **breaks the analogy every neighbouring ledger has been reaching
for.** The day-after-Thanksgiving half session removes volume from the bond tape; **the last session
of the year does not** — not for Treasuries. Credit thins decisively (LQD below-normal volume in
**19 of 24** years, p = 0.0066, median **0.70×**; HYG **15 of 19**, p = 0.019) while Treasury duration
does not (TLT **15/24**, p = 0.31; IEF **10/24**, median **1.10×**) and **TIPS runs heavier**
(**17 of 22** above normal, p = 0.017). The move lands on the **other side of the boundary**: the first
session of the new year prints an above-normal |move| in **18 of 24** years for SHY (p = 0.023, median
**1.64×**), and SHY's year-end print **reverses** on it in **17 of 23** (p = 0.035). And unlike the
Thanksgiving slot, the issuer **does** use this date — 13 auctions across 1999–2025 — but **never on a
Friday** (0 across the four Friday year-ends, which is exactly the geometry 2027 repeats). Everything
here carries the event's **`estimate`** label, `symbols` is empty, and no house playbook is
calendar-keyed (re-grepped to zero hits).

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — a recommended bond early close is not a tradeable event | High | D-478, `symbols: []`, `impact: low`; `trade-playbooks.md` and `multi-symbol-sweep.md` grepped this session for `holiday\|christmas\|new.?year\|half.?day\|early.?close\|closure\|year.?end\|santa` return **0 hits in both** | A calendar- or session-hours-keyed house playbook being written and back-tested before **2027-12-31** — the "nothing can fire on this date" leg dies and this sheet is rebuilt on measured data |
| This week | **Write the correction down; do not act on it** | High | The deliverable is that the Thanksgiving finding does **not** transfer: this slot thins **credit** and leaves the Treasury tape alone, and it is **not** auction-free (13 auctions on year-end sessions 1999–2025, `fiscaldata.treasury.gov`) — the sibling's 0-of-27 fact is specific to the day after Thanksgiving | SIFMA republishing its 2027 US panel without the 12-31 early close, or NYSE adding a December 2027 early close, before **2026-10-09** |
| This month | **Stand aside** — nothing near-dated is created by this row | Medium | Three tracked events sit inside the ±5-day corridor (`fhfa-hpi-2027-12-28`, `fomc-minutes-2027-12-29`, `fed-board-closure-2027-12-31`), all already owned by their own lanes; the sweep found no untracked dated event to propose | A dated 2027 year-end market-structure event appearing that is not one of those three or this one, checked at the **2026-10-09** pulse |
| This quarter | **Do not carry "the last session of the year is a thin, quiet bond tape" as a planning assumption** (`estimate` — a planning refusal, never an entry) | Medium | The thinning is credit-only; the Treasury tape is normal-to-heavy and TIPS is heavier; the outsized print is the **first session of the new year**, not this one | SHY's **2028-01-03** \|move\| ratio printing **below 1.0×** the trailing-20 median measured before the year-end session. Registered as **FT-sifma-bond-early-close-2027-12-31-2** |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit or hedge is keyed to 2027-12-31. The date is `estimate`, the source is
  explicitly a recommendation, and date-keyed action requires `confirmed` regardless.
- **The execution note, stated precisely.** Equities run a **full** session to 16:00 ET (NYSE names no
  December 2027 early close at all); SIFMA recommends cash and OTC fixed income out at **14:00 ET**. So
  every listed bond proxy prints its official close **two hours after** the cash tape it tracks stops
  trading — the ordinary year-end shape, and the inverse of 2027-11-26.
- **Size for the boundary, not for the session.** The measured tail is on **2028-01-03**, not on
  2027-12-31: SHY's first-session |move| ratio is above normal in 18 of 24 years (median 1.64×) and
  reverses the year-end print in 17 of 23.
- **A bill auction is possible in principle but not on this geometry.** Treasury auctioned on the last
  session of the year in 6 of 27 years — **every one of them Monday–Thursday**. All four Friday
  year-ends since 1999 carried zero. Settlements are another matter: **85** across those 27 dates.
- **The funding turn is the date's real rates event, and it prints after everyone has gone home.**
  SOFR's year-end fixing has run **+69.5bp** over its December median (2018), **+24bp** (2022) and
  **+12bp** (2025), with a 99th-percentile tail of **+380bp** in 2018 — and the fixing for 2027-12-31
  publishes **2028-01-03**, the next business day.
- **Watch (dated)** — next pulse **2026-10-09** · Christmas observed, NYSE closed **2027-12-24** (est) ·
  bond early close **2027-12-23** (est) · FHFA HPI **2027-12-28** · FOMC minutes **2027-12-29** (est) ·
  this early close + OCC quarterly expiration **2027-12-31** (est) · first session of 2028
  **2028-01-03**.

## Initial research

### The question, plainly

This id existed only as a proposal, written by the `christmas-market-closure-2027-12-24` adjacency
sweep, which argued the row earns its place because three things land on one session: a full equity
day, an OCC quarterly expiration, and a recommended 14:00 ET bond close — with, unusually, no holiday
behind it. Two questions follow. **Do the schedule facts reproduce at the precision the sources
support, given that the one source naming the "no holiday" fact is a page this runner cannot reach?**
And the question no sibling has asked: **the day-after-Thanksgiving ledger measured that a half
session is thin but not calm — does that finding transfer to the year-end early close, which is the
other end of the same holiday corridor?**

**One-line verdict:** the schedule holds, has a dated precedent in SIFMA's own archive, and one
inherited wording needs narrowing — and the Thanksgiving finding **does not transfer**: this slot
thins credit, leaves Treasuries alone, and pushes its outsized print across the year boundary.

### Method

Macro / market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — no
symbol-keyed instrument applies (`symbols: []`). Every schedule primary was re-fetched this session;
nothing is inherited from the proposal or from the sibling ledgers.

- **SIFMA** `sifma.org/resources/general/holiday-schedule` — HTTP 200, 299,159 bytes. The year/region
  tabs are hidden panels the rendered text drops, so the embedded RSC payload was parsed and the US
  2027 New Year card read verbatim, with the surrounding cards used to establish panel attribution.
- **SIFMA, archived** `web.archive.org/web/20211209015548/…/holiday-schedule/` — HTTP 200, 98,305 bytes.
  The December-2021 capture is the precedent test: the last time Jan 1 fell on a Saturday.
- **NYSE** `nyse.com/markets/hours-calendars` — **HTTP 403 to this runner today** (logged in
  `probe-ref.blocked`). Read instead from `web.archive.org/web/20260106155838/…` — HTTP 200, 159,160
  bytes — which carries the full 2026/2027/2028 holiday table and every early-close footnote.
- **OCC** `www.optionseducation.org/api/expirationcalendar` — HTTP 200, 34,871 bytes, GUIDs resolved
  against the file's own `legend` array.
- **Treasury** `api.fiscaldata.treasury.gov` `auctions_query` — 8,015 auction records, 1999-01-04 to
  2026-09-10, queried on both `auction_date` and `issue_date`.
- **New York Fed** `markets.newyorkfed.org/api/rates` — SOFR (2,106 fixings, 2018-04-02 →) and EFFR
  (2,934 fixings, 2015-01-02 →), including the published percentile distribution.
- **Tape** — Yahoo split/dividend-adjusted daily bars, 1993–2026, for SPY, TLT, IEF, SHY, LQD, BND,
  AGG, TIP, HYG and `^VIX`. Sign tests are two-sided binomial against p = 0.5.

### Leg 1 — the SIFMA recommendation reproduces, and one inherited wording is wrong — SUPPORTED

The US 2027 panel's final card renders as three fields whose middle field is **empty**:

| heading | date | note |
|---|---|---|
| `New Year’s Day 2027/2028` | *(empty string in the payload)* | `Early Close (2:00 p.m. Eastern Time): Friday, December 31, 2027` |

Attribution is first-hand, not inherited: the cards immediately preceding it run `Labor Day / Monday,
September 6, 2027`, `Columbus Day / Monday, October 11, 2027`, `Veterans Day / Thursday, November 11,
2027`, `Thanksgiving Day / Thursday, November 25, 2027` and `Christmas Day / Friday, December 24,
2027` — a US-only sequence — while the UK and Japan panels carry their own `New Year's Day 2027/2028`
cards that **do** name `Saturday, January 1, 2028`. The complete US 2027 early-close list this parse
returns is **2027-03-25, 05-28, 07-02, 11-26, 12-23, 12-31**, with MLK and Presidents Day 2027 carrying
no note as the negative control.

**The narrowing.** The proposal described this as "a TWO-field row with NO full-close date", and the
`christmas-market-closure-2027-12-24` ledger wrote "*(no date — the field is absent)*". The field is
**present and empty**. That is not pedantry: leg 2 shows SIFMA writing the literal string `None` in
that same slot in 2021, so an empty string is a rendering choice on the current page, not a record
that was never made.

### Leg 2 — the configuration has a precedent, and SIFMA kept the early close — SUPPORTED

The question the proposal left open is whether a year-end early close survives when there is no
holiday for it to precede. SIFMA's own archived page answers it. The Wayback capture of **2021-12-09**
— the last year Jan 1 fell on a Saturday — renders the US card as:

> `New Year's Day 2021/2022` | **`None`** | **`Early Close Only (2:00 p.m. Eastern Time): Friday, December 31, 2021`**

Two things follow. The full close was explicitly **`None`**, and the early close was recommended
anyway — with the distinct wording *"Early Close Only"*. The same capture's next card is the ordinary
shape for contrast: `New Year's Day 2022/2023` / `Monday, January 2, 2023` / `Early Close … Friday,
December 30, 2022`. So the 2027 card is not an anomaly or a data-entry gap; it is what this page does
when a Saturday New Year removes the holiday. (The current page has dropped "Only" from the wording;
nothing in the recommendation itself differs.)

### Leg 3 — equities run a full session, and the quarterly expiration is real — SUPPORTED, on an archived copy

`nyse.com` returned **HTTP 403** to this runner today, so the NYSE facts below are read from the
Wayback capture of **2026-01-06** and are dated as such rather than presented as today's page. That
capture's holiday table, headed *"All NYSE markets observe U.S. holidays as listed below for 2026,
2027, and 2028"*, carries:

- **New Year's Day 2028 = `—*`**, footnote `*` reading verbatim: *"Because the holiday falls on
  Saturday, January 1, 2028, no New Year's Day holiday is observed."*
- **Christmas Day 2027 = "Friday, December 24 (Christmas Day observed)"** — the contrast that makes the
  point: a Saturday Christmas **is** observed on the preceding Friday; a Saturday New Year is not,
  because the Friday belongs to the prior year.
- An early-close footnote set naming **only** Mon 2028-07-03, the day after Thanksgiving in 2026/2027/
  2028, and Thu 2026-12-24 — therefore **no equity early close anywhere in December 2027**, and none on
  2027-12-31.

Independently, and fetched **live** today, the OCC expiration calendar marks **2027-12-31** with GUID
`812CD242-…`, which the file's own legend resolves to **"Quarterly Expiration date"** — the same marker
it carries on 2025-12-31 and 2026-12-31. The same file marks **2027-12-24** an *"Exchange/OCC holiday"*,
corroborating the observed Christmas from a source that is not a holiday calendar's own table. The
file's range ends at 2027-12-31, so it says nothing about January 2028 either way.

### Leg 4 — "a year-end early close means a thin bond tape" — REFUTED for Treasuries, SUPPORTED for credit

This is the leg that matters, and it is where the neighbouring ledger's finding stops transferring.
For each year 1993–2025, the **last session of the year** was scored against that instrument's own
**trailing-20-session median** (volume, and |close-to-close move|), measured over the sessions ending
the day before.

| Instrument | Volume below normal | p | median volume ratio | \|move\| above normal | median \|move\| ratio |
|---|---|---|---|---|---|
| LQD | **19 / 24** | **0.0066** | **0.70×** | 8 / 24 | 0.78× |
| HYG | **15 / 19** | **0.019** | **0.72×** | **4 / 19** (p = 0.019) | 0.64× |
| TLT | 15 / 24 | 0.31 | 0.95× | 9 / 24 | 0.85× |
| IEF | 10 / 24 | 0.54 | **1.10×** | 10 / 24 | 0.85× |
| SHY | 12 / 24 | 1.00 | 0.98× | 10 / 24 | 1.00× |
| AGG | 7 / 23 | 0.093 | 1.07× | 10 / 23 | 0.93× |
| TIP | **5 / 22** | **0.017** | **1.12×** *(heavier, not thinner)* | 8 / 22 | 0.76× |
| SPY | 18 / 33 | 0.73 | 0.97× | 17 / 33 | 1.04× |

**Read it as a split by instrument type, not as a market-wide lull.** Credit — the part of fixed income
that trades by appointment through dealers — is decisively thin and quiet on this session. The Treasury
complex is not: TLT's thinning fails its sign test, IEF's median volume is *above* normal, and TIPS runs
significantly **heavier** than a normal session. A plausible mechanism is that annual index events
(duration extension, rebalancing into year-end) keep the government complex busy while dealer credit
books step away — but that is a **hypothesis this ledger does not test**, and it is not asserted.

Contrast with the sibling: on the day after Thanksgiving, `sifma-bond-early-close-2027-11-26` measured
volume decisively lower across SPY, SHY, LQD **and** BND. Same corridor, same recommendation, opposite
result on the government side. The two dates are not one configuration.

### Leg 5 — the outsized print lands on the far side of the year boundary — MIXED, strongest at the front end

Using the **same** trailing-20 baseline (measured before the year-end session, so the holiday period
cannot contaminate the denominator), the **first session of the new year**:

| Instrument | \|move\| above that baseline | p | median ratio |
|---|---|---|---|
| SHY | **18 / 24** | **0.023** | **1.64×** |
| LQD | 17 / 24 | 0.064 | 1.61× |
| SPY | 21 / 33 | 0.16 | 1.45× |
| IEF | 15 / 24 | 0.31 | 1.41× |
| TLT | 15 / 24 | 0.31 | 1.33× |
| AGG | 13 / 23 | 0.68 | 1.31× |

And the front end **reverses**: SHY's first-session return carries the opposite sign to its year-end
return in **17 of 23** years (p = 0.035); no other instrument's reversal rate is distinguishable from
a coin (SPY 15/32, TLT 11/24, IEF 12/24, LQD 14/24).

**Why this is MIXED and not asserted.** Only SHY clears a two-sided test, the January effect is an
obvious confound this ledger does not control for, and a January repricing would raise these ratios
whether or not any bond tape shut early. What the data supports is narrow and worth writing down: **the
front-end's year-end closing print is the least informative print of the corridor** — unusually likely
to be followed by a large move that undoes it.

### Leg 6 — the issuer does use this session, but never on a Friday — SUPPORTED

`fiscaldata.treasury.gov` `auctions_query`, filtered on the last session of each year 1999–2025:

- **13 auctions across 6 of 27 years** — 2001 (13w, 26w), 2002 (4w), 2007 (26w, 13w), 2018 (26w, 52w,
  13w), 2020 (4w, 8w), 2025 (8w, 17w, 4w). All bills; never a coupon.
- **85 settlements** on the same 27 dates, consistent with SIFMA's standing note that early-close
  recommendations do not affect settlement times.
- **Every one of the 13 landed Monday–Thursday.** The four **Friday** year-ends in the window —
  1999-12-31, 2004-12-31, 2010-12-31 and 2021-12-31, which is the exact geometry 2027 repeats — carried
  **zero** auctions.

This **corrects** the analogy a reader would otherwise carry over from the Thanksgiving ledger, whose
0-of-27 auction count is specific to that date. Year-end is not structurally auction-free; it is
auction-free **on this weekday**, which is a weaker and more honest claim, and it is the basis of
forward test **-1** rather than an assertion.

### Leg 7 — the date's real rates event is the funding turn, and it prints after the close — SUPPORTED

The one thing that is reliably special about the last session of the year in rates is not the tape, it
is the money market. SOFR's fixing for the year's last session, against its own December median:

| Year | Turn vs December median | 99th-percentile tail vs its December median |
|---|---|---|
| 2018 | **+69.5bp** | **+380bp** (p99 printed 6.25% against a 2.45% median) |
| 2019 | +1.0bp | +35bp |
| 2020 | −1.0bp | +1bp |
| 2021 | 0.0bp | 0bp |
| 2022 | **+24.0bp** | +32bp |
| 2023 | +6.0bp | +26bp |
| 2024 | −10.5bp | +4bp |
| 2025 | **+12.0bp** | +13bp |

EFFR shows the same shape smaller (+20bp in 2018, +25bp in 2022, −25bp in 2024). The turn is **regime-
dependent, not annual** — three of eight years at ≥12bp, three at zero — so no base rate is claimed for
2027. Two facts are worth carrying: the **tail** is the sharper statistic (the 2018 p99 is a 380bp
excursion on a day the median barely moved), and the fixing for **2027-12-31 publishes on 2028-01-03**,
the next business day, so the one number that describes this session is not observable during it.

### Leg 8 — nothing in the house system can fire on this date — SUPPORTED

`docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md` re-grepped this session for
`holiday|christmas|new.?year|half.?day|early.?close|closure|year.?end|santa`: **0 hits in both.** No
house playbook is calendar-keyed in either direction, so the stand-aside is a description of the system
as it exists today, not a preference.

### Honest limits

- **The NYSE facts are archived, not live.** `nyse.com` 403'd this runner; the 2026-01-06 capture is
  what leg 3 reads. A published table can change, and this one is eight months old at the time of
  reading. It is corroborated on the Christmas side by OCC's live file, and not at all on the "no 2028
  New Year holiday" side, which rests on the archived footnote alone.
- **`estimate` is about taxonomy, not doubt.** `market-events-data.ts` has confirmed prefixes for
  `IR:`/`CAL:`/`BLS:`/`FED:`/`PJM:`/`SEC:`/`TSY:`/`OCC:`/`BEA:`/`CENSUS:`/`ISM:`/`CB:`/`UMICH:`/`FHFA:`
  and none for a trade association's recommended schedule; the lane may not self-confirm an in-sweep
  discovery; and SIFMA's closes bind no one.
- **`rates` is an imperfect kind.** `EventKind` has no market-structure member. Whether the union needs
  one is not this lane's call — the same note every sibling records.
- **CME was not attempted.** `cmegroup.com` has returned 403 to this runner in sibling lanes; whether
  rate futures keep separate hours that afternoon is **unresearched**, not assumed.
- **The 14:00–16:00 window itself is unmeasured.** Every measurement here is on daily bars. What the
  two hours after the cash close actually look like would need intraday history that does not reach
  back far enough to sample year-ends.
- **The quarterly expiration is recorded, not studied.** Its interaction with the truncated bond tape
  is untested; it is filed as an attribute of the date.
- **No new calendar file is proposed.** The sweep's dated discoveries outside this event's corridor —
  NYSE's 2028 early closes (2028-07-03, 2028-11-24) and the 2028 holiday grid — are recorded here and
  deliberately **not** proposed, following the precedent the 03-25 / 05-28 / 11-26 siblings set: they
  are not adjacent to this event and belong to their own lanes.

## Stance & kill switches

**Stand aside.** This row is structural. It changes how the last session of 2027 is **read**, never
what to do on it — `symbols: []`, `impact: low`, D-478, and every statement below carries the event's
**`estimate`** label.

What the ledger now asserts:

- (a) SIFMA recommends a **2:00 p.m. ET** fixed-income close on **Friday 2027-12-31** (`estimate`), on a
  card whose full-close field is empty because Saturday 2028-01-01 is not observed.
- (b) The configuration is **not unprecedented**: in 2021, the identical geometry, SIFMA's own page
  wrote `None` for the full close and recommended the early close anyway.
- (c) **Equities run a full session to 16:00 ET** — NYSE names no December 2027 early close — so the
  bond tape shuts **two hours before** the equity close, the ordinary shape, and the inverse of
  2027-11-26.
- (d) The session is **an OCC quarterly expiration** (live source), an attribute, not a play.
- (e) The Thanksgiving finding **does not transfer**: this slot thins **credit** (LQD 19/24, p = 0.0066;
  HYG 15/19, p = 0.019) and leaves the **Treasury** tape normal-to-heavy (TIP heavier in 17/22,
  p = 0.017).
- (f) The outsized print sits on **2028-01-03**, not on this session (SHY 18/24, p = 0.023, median
  1.64×; reversal 17/23, p = 0.035) — MIXED, with the January-effect confound stated.
- (g) The issuer **has** auctioned on year-end sessions (13 across 1999–2025) but **never on a Friday**
  one (0 of 4); settlements are heavy (85 of 27 dates).
- (h) The **funding turn**, not the tape, is the date's rates event — and it publishes the next
  business day.

**Kill switches:**

- **Any Treasury security carries `auction_date` 2027-12-31** — the Friday-year-end regularity in (g)
  breaks and the truncated session acquires a supply event. Registered as
  **FT-sifma-bond-early-close-2027-12-31-1**, score by 2028-01-06.
- **SHY's 2028-01-03 |move| ratio prints below 1.0×** the trailing-20 median measured before the
  year-end session — the "the move is on the far side of the boundary" reading in (f) fails on the
  instance. Registered as **FT-sifma-bond-early-close-2027-12-31-2**, score by 2028-01-06.
- **SIFMA revises, withdraws or re-dates the 2027-12-31 recommendation** — the event's premise changes
  and this ledger re-dates.
- **NYSE adds any December 2027 early close, or observes a 2028 New Year holiday** — (c) and the whole
  "no holiday behind it" framing die, and legs 2, 4 and 5 need re-slotting against a different session.
- **A live re-fetch of `nyse.com` disagrees with the 2026-01-06 capture** — leg 3's sourcing collapses
  and every claim resting on the footnote has to be re-argued.
- **A calendar- or session-hours-keyed house playbook is written and back-tested** — leg 8 goes stale
  and the stand-aside must be re-argued on measured data rather than on absence.
- **OCC republishes its calendar without the quarterly-expiration marker on 2027-12-31** — (d) drops.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-09 | 478 | **Initial research; canonical `<id>.json` written**, shadowing the one proposal (`from-christmas-market-closure-2027-12-24`), read first. SIFMA re-fetched (HTTP 200, 299,159 B): US 2027 final card = `New Year's Day 2027/2028` / **empty date field** / `Early Close (2:00 p.m. ET): Friday, December 31, 2027`; attribution fixed by the surrounding US-only run; UK and Japan panels **do** name `Saturday, January 1, 2028`. **Proposal wording narrowed:** the date field is present and empty, not absent — the 2021 archive writes literal `None` there. **Precedent found (new):** Wayback 2021-12-09 capture shows the identical Saturday-New-Year geometry as `None` + `Early Close Only … Friday, December 31, 2021`, so the recommendation survives having no holiday behind it. **`nyse.com` 403'd this runner** (logged in `probe-ref.blocked`); read from the 2026-01-06 capture (159,160 B) — 2028 New Year `—*`, *"no New Year's Day holiday is observed"*, and no December 2027 early close in the footnote set. OCC live (34,871 B): 2027-12-31 = `Quarterly Expiration date`, 2027-12-24 = Exchange/OCC holiday. **Measured (new), last session of each year 1993–2025 vs each instrument's trailing-20 median:** the Thanksgiving finding does **not** transfer — credit thins (LQD 19/24 p=0.0066, 0.70×; HYG 15/19 p=0.019) but Treasuries do not (TLT 15/24 p=0.31; IEF median 1.10×) and TIP is **heavier** (17/22 p=0.017). The outsized print is the **next** session (SHY 18/24 p=0.023, median 1.64×; reversal 17/23 p=0.035) — MIXED, January-effect confound stated. **Treasury (fiscaldata, 8,015 records):** 13 auctions on year-end sessions across 6 of 27 years, all bills, **all Mon–Thu**; **0** across the four Friday year-ends (1999/2004/2010/2021); 85 settlements. **NY Fed:** SOFR year-end turn +69.5bp (2018, p99 tail +380bp), +24bp (2022), +12bp (2025) — regime-dependent, and the 2027 fixing publishes 2028-01-03. Adjacency — peers: n/a (`symbols: []`); macro: `fhfa-hpi-2027-12-28`, `fomc-minutes-2027-12-29` in the corridor; VIX **15.72** (close 2026-09-08); geopolitical: none dated here; tape: `fed-board-closure-2027-12-31` shares the date (proposal only, its own lane). Playbook grep: **0 hits in both**. CME not attempted (403 in sibling lanes). **No new calendar file proposed** — the 2028 NYSE dates found are outside this corridor, per the 03-25/05-28/11-26 precedent. | Initial stance set: **stand aside** (structural row only), with the sibling's half-session finding explicitly **not** carried over and one proposal wording narrowed. Registers **FT-sifma-bond-early-close-2027-12-31-1** and **-2**. | 2026-10-09 |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-sifma-bond-early-close-2027-12-31.json`
(`status: "estimate"`) in the same PR — your own file, never another event's canonical one (#1717).
Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from
memory — after which this doc goes quiet.
