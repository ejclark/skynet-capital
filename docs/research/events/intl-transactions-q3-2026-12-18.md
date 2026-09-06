# U.S. International Transactions and Investment Position, Q3 2026 — intl-transactions-q3-2026-12-18

**Kind:** macro-print · **Date:** 2026-12-18 (confirmed, BEA: `bea.gov/news/schedule` December 2026 block, row "December 18 | 8:30 AM | News | U.S. International Transactions and Investment Position, 3rd Quarter 2026", fetched direct 2026-09-05 (HTTP 200, 75,122 bytes) and corroborated on the same site's `/news/schedule/full` view (HTTP 200, 124,325 bytes). Promoted from `estimate` by this lane — the entry's own note reserved the confirming re-read for "whichever lane owns this event's own never-assessed research," which is this one; `BEA:` is a confirmed-tier prefix in `market-events-data.ts`, and unlike the FT-900 siblings this is a sole-publisher BEA release, so the joint-publisher objection that keeps those `estimate` does not apply here) · **Impact:** low
**Last assessed:** 2026-09-05
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"low:15+","adjacentIds":["boj-decision-2026-12-18","durable-goods-2026-12-23","ecb-decision-2026-12-17","g20-miami-2026-12-14","gdp-q3-2026-third-2026-12-23","import-export-prices-2026-12-17","opex-2026-12-18","pce-2026-12-23","pjm-capacity-auction-2026-12","ppi-2026-12-15","puct-batch-zero-report-open-meeting-2026-12-17","retail-sales-2026-12-16"],"screenStreak":0} -->

## At a glance

**TL;DR.** **This event was filed as a canary — "the cheapest primary read on whether 12-23 publishes
on time" — and the canary is real, but the last time this exact slot was tested it failed in a way
the filing did not anticipate.** BEA's own 2025 schedule PDF, published 2024-09, put the Q3-2025
international transactions release on **December 18, 2025**. It published **2026-01-14** — a 27-day
displacement, and the only miss in **30 Q3 vintages back to 1996**. The lapse that caused it had
ended **five weeks earlier**: the release did not die in the shutdown window, it died of the input
backlog behind it, because the September-2025 FT-900 it consumes slipped from early November to
**2025-12-11**. That distinction decides how much the 12-18 read is worth. Here the backlog channel
is **closed** — every Jul–Sep 2026 input this calendar tracks publishes before the cliff, the last
one on **2026-11-04** — so 12-18 and 12-23 are left sharing exactly one failure channel: BEA dark on
the morning itself. And BEA's darkness is **all-or-nothing**: across the 43-day 2025 lapse its own
as-published calendar shows **zero** releases, the single scheduled one cancelled, the first
resumption **seven days** after funding returned. So the canary reads a narrower question than the
filing claimed, and on this occasion the narrow question is the whole question. Two verified
corrections travel with it: 12-18 is **seven** days after the 12-11 cliff, not six; and the release
carries **no GDPNow channel at all** — the Atlanta Fed's posted schedule has no 2026-12-18 row, so
the nowcast mechanism that makes the FT-900 siblings measurable is absent here. Date is now
**confirmed** on BEA primaries; `symbols: []`; nothing here is tradable at any horizon.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-104) | **Stand aside** | High | `symbols: []`, `low` impact, no house playbook (S1/S2/E1/S3/S4 + G1) is macro-keyed, and no instrument is attached to this event on any date. The date being `confirmed` licenses date-keyed action in principle and there is none to license. | A macro-keyed playbook landing in `docs/plans/trade-playbooks.md` before **2026-12-01** — none exists today |
| This week | **Stand aside — but mark 2026-09-24, the series' next observable** | High | The Q2-2026 edition prints **2026-09-24** (BEA schedule, fetched today), 19 days out; it sets the base the Q3 number is read against. Last published: Q1 2026, current account **−$226.8B**, NIIP **−$21.27T**. VIX **14.53** (2026-09-04 close). | BEA moving or dropping the **2026-09-24** slot on `bea.gov/news/schedule` before **2026-09-24** |
| This month | **Treat 12-18 as a schedule probe, not a print — and price the probe correctly** | Medium | It answers "is BEA publishing that morning," which under the 2025 all-or-nothing precedent is the only channel it and 12-23 still share. It does **not** answer the delay-by-backlog question that actually moved this slot in 2025. | BEA publishing **some but not all** of a day's scheduled releases during any lapse through **2027-03-31** — that would break the all-or-nothing premise the read rests on |
| This quarter | **Never attribute the 2026-12-18 tape to this print — it is quarterly triple witching and a BoJ decision day** | High | `opex-2026-12-18` (confirmed, high) and `boj-decision-2026-12-18` (estimate, medium) share the date and outrank it. Measured, the ITA session class is inert: SPY differences fail to reproduce on QQQ (gap p=0.43, range p=0.35, n=94). | SPY's **2026-12-18** high-low range exceeding the median of its trailing 20 sessions — registered as `-2`, against a December-opex median of **0.869%** vs a **1.046%** baseline |

**Signals & conditions** — the buy/sell/hold triggers:

- **No buy signal and no sell signal exists off this event**, and `confirmed` does not change that:
  `symbols: []`, `low` impact, no macro-keyed playbook. Research is not action.
- **The one thing to watch on 12-18 is whether it happens at all.** Published at 08:30 ET ⇒ BEA is
  operating seven days into a lapse ⇒ 12-23 has no funding-side obstacle left. Silent ⇒ read
  `gdp-q3-2026-third-2026-12-23` as at risk of the same displacement, and expect **delay, not
  deletion**: 117 ITA releases since 1996, zero deleted.
- **The correct size of that inference, stated honestly.** It is one-directional and narrow. A
  publishing 12-18 rules out only the *concurrent-lapse* channel; the channel that actually moved
  this slot in 2025 was an input backlog that bit five weeks after the shutdown ended.
- **The number to read first, if it publishes** — the **current-account balance**, against Q1 2026's
  **−$226.8B** (widened 2.6% from Q4 2025's −$221.1B) and whatever Q2 prints on 09-24. The NIIP is
  the second line: **−$21.27T** at end-Q1 2026, from −$21.87T at end-Q4 2025.
- **What this print cannot do:** move GDPNow. The Atlanta Fed's posted release calendar has no
  2026-12-18 entry — postings on **12-16**, **12-17** and **12-23** bracket it. Do not carry the
  FT-900 siblings' nowcast framing onto this series.
- **Watch (dated)** — Q2 edition **09-24** · Sept FT-900 **11-04** (the last Q3 input this calendar
  tracks) · FOMC **12-09** · CPI **12-10** · last pre-cliff BEA release **12-10** · **CR expiry
  12-11** · PPI **12-15** · retail sales **12-16** · ECB + import/export prices **12-17** · **this
  print 12-18** 08:30, alongside triple witching and the BoJ · GDP third estimate + PCE + durable
  goods **12-23** · advance goods **12-28**.

## Initial research

### The question, plainly

This event is on the calendar for a scheduling reason, not an economic one. Its
[`gdp-q3-2026-third-2026-12-23`](gdp-q3-2026-third-2026-12-23.md) parent proposed it as "the first
BEA release inside a hypothetical lapse window… the cheapest available read on whether 12-23 happens
on time, and it costs one schedule check." **Is it actually the first? Is the read valid? And has
this specific release slot ever been tested by a lapse before?**

**One-line verdict:** it is the first, on BEA's own December block — and the slot *has* been tested,
exactly one year earlier, where it failed for a reason that makes the canary narrower but, on this
occasion, still sound.

### Method

Macro-print mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — `symbols: []`, so
neither `earnings-cycle.mjs` nor `intraday-edges.mjs` applies and the cache-busting rule has no
target. Six inputs, all fetched direct on 2026-09-05:

1. **`bea.gov/news/schedule`** (HTTP 200, 75,122 bytes) and **`/news/schedule/full`** (HTTP 200,
   124,325 bytes) — the upcoming and full 2026 blocks, tag-stripped and read row-wise.
2. **`bea.gov/news/schedule/full-2025`** (HTTP 200, 120,417 bytes) — BEA's **as-published** 2025
   calendar, parsed per `<tr>` *with link presence*, so a scheduled-but-never-released row is
   distinguishable from a released one. This is what makes Leg 3 a measurement rather than an
   inference.
3. **`bea.gov/sites/default/files/2024-09/2025-News-Release-Schedule.pdf`** (HTTP 200, 202,771
   bytes) — the 2025 schedule **as planned in September 2024**, text-extracted by inflating its 44
   content streams. The planned-vs-actual pair is the whole of Leg 2.
4. **`bea.gov/news/archive`**, 8 pages, title-filtered to this series — **117 releases,
   1996-09-10 → 2026-03-25**, each parsed to `(release date, reference quarter)`.
5. **`GDPNowcastDataReleaseDates.xlsx`** (Atlanta Fed, 16,944 bytes) — both sheets (`PostedUpdates`,
   `InternalUpdates`), December 2026 rows enumerated.
6. **Yahoo daily bars, SPY / QQQ / VIX, 1993-01-29 → 2026-09-04**, restricted to the **6,709**
   sessions since 2000-01-01, with 20,000-iteration permutation tests on medians against a
   same-index baseline.

### Leg 1 — 2026-12-18 is the first BEA release after the 12-11 cliff · **SUPPORTED**, and the count in the entry is off by one

BEA's December 2026 block, in full, tag-stripped:

| Date | Release |
|---|---|
| December 2 | GDP by County and Personal Income by County, 2025 |
| December 8 | U.S. International Trade in Goods and Services, October 2026 |
| December 10 | Real PCE by State and Real Personal Income by State, 2025 |
| **December 18** | **U.S. International Transactions and Investment Position, 3rd Quarter 2026** |
| December 23 | GDP (Third Estimate), Industries, Corporate Profits, State GDP, State Personal Income, Q3 2026 |
| December 23 | Personal Income and Outlays, November 2026 |

Nothing sits between **12-10** and **12-18**, so the parent lane's structural claim holds on the
primary: this is the first BEA release on the far side of the cliff, and **12-10** is the last one
before it. The entry's own `notes` say "six days after the 12-11 cliff"; **12-18 is seven days after
12-11**, and six days into a lapse that would begin 00:00 on **2026-12-12**. Both readings exist in
the family and they differ by one day, so the entry is amended to state the arithmetic explicitly.

Status promoted to **confirmed**. `BEA:` is a confirmed-tier prefix in `market-events-data.ts`; this
release is BEA-only, so the joint-publisher objection that correctly keeps
[`intl-trade-full-report-2026-12-08`](intl-trade-full-report-2026-12-08.md) at `estimate` does not
reach it; and the entry itself reserved the confirming re-read for the lane that owns this research.
That re-read happened today, on two independent BEA views of the same schedule.

### Leg 2 — this release slot has never been tested by a lapse · **REFUTED**, and this is the ledger's central finding

BEA's 2025 News Release Schedule, published **2024-09**, reads verbatim (letter-spacing removed):

> `U.S. International Transactions, 3rd Quarter 2025 — December 18, Thu, 8:30 a.m., News Release`

The same slot, one year and one day earlier. It did not publish on 2025-12-18. The archive gives its
actual date: **2026-01-14**.

| | |
|---|---|
| Scheduled (2024-09 plan) | **2025-12-18** |
| Actually published | **2026-01-14** |
| Displacement | **+27 days**, across the year boundary |
| Q3 vintages in the archive, 1996–2025 | **30** |
| Q3 vintages that missed their December slot | **1** — this one |
| Releases deleted, all quarters, 1996–2026 | **0 of 117** |

The undisturbed series is remarkably tight. Lag from quarter-end to release, all 117 releases:
median **78 days**, min 70, max 106 — and the 106 is the 2025 outlier. The Q3 vintages alone:

| Years | Q3 lag |
|---|---|
| 1996–2005 | 70–77 days |
| 2006–2019 | 76–80 days |
| 2020–2024 | 79–82 days |
| **2026-12-18 (this edition)** | **79 days** |
| 2025 (lapse-displaced) | **106 days** |

So the scheduled date is ordinary in every respect except its neighbours.

### Leg 3 — the 2025 displacement was caused by the lapse window · **REFUTED**, and the correction is what re-scopes the canary

The 2025 lapse ran **2025-10-01 → 2025-11-12** (43 days; carried from
[`government-funding-deadline-2026-12-11`](government-funding-deadline-2026-12-11.md) and
[`cr-expiry-2026-12-11`](cr-expiry-2026-12-11.md), press-grade there and not re-verified here). It
ended **five weeks before** the release was due. The release still moved 27 days.

What moved it was the queue behind it. The Q3-2025 edition consumes the September-2025 FT-900, which
on BEA's as-published calendar landed **2025-12-11** instead of its usual early-November slot. The
ITA followed **34 days** later. In an undisturbed year the same gap is wider, not narrower — the
September-2026 FT-900 publishes **2026-11-04** and this edition follows **44 days** later — so BEA
did not merely wait out the backlog, it compressed its own turnaround by ten days and still finished
in January.

**Consequence for the canary.** The read is valid only for the failure channel both dates share, and
it is worth spelling out which channel that is:

- **Concurrent-lapse channel** — BEA dark on the morning. Shared by 12-18 and 12-23. This is what
  the 12-18 probe reads.
- **Input-backlog channel** — inputs published late, the release slips weeks after funding returns.
  This is what actually moved the 2025 edition, and **it is closed for both dates here**: the
  Jul–Sep 2026 reference quarter's inputs publish before the cliff, the last one this calendar
  tracks being the **11-04** FT-900, and a lapse beginning 12-12 cannot retroactively delay data
  already released.

Which is why the probe still earns its place: on this occasion the two dates have one channel
between them, so a published 12-18 removes the only thing that could take 12-23 down. That is a
narrower claim than "the cheapest read on whether 12-23 publishes on time" and it happens to be
sufficient — this cycle, for this reason, not as a general property of the pairing.

### Leg 4 — BEA might publish selectively during a lapse · **REFUTED**, on its own calendar

Parsed with link presence, BEA's as-published 2025 calendar across the lapse:

| Date | Release | Published? |
|---|---|---|
| 2025-09-29 | U.S. International Investment Position, Q2 2025 | **yes** |
| 2025-10-30 | GDP, Q3 2025 (Advance Estimate) | **no — never released** |
| 2025-11-19 | U.S. International Trade in Goods and Services, August 2025 | **yes** |

Exactly one release was scheduled inside the 43-day window, and it did not happen; nothing else
published between 09-29 and 11-19. The first resumption came **seven days** after funding returned
on 11-12. BEA's behaviour under a lapse is a switch, not a dial — which is precisely the property
that makes a single yes/no observation on 12-18 informative about 12-23, and the property Leg 3's
kill switch is written against.

The same rows show BEA's **other** failure mode, and it is a deletion: the 10-30 advance GDP estimate
was not rescheduled but **absorbed** — the archive's next GDP release is "Q3 2025 (**Initial**
Estimate) and Corporate Profits (Preliminary)" on **2025-12-23**. `government-funding-deadline-2026-12-11`
records the same shape for PCE (standalone 2025-12-19 print folded into a combined Oct+Nov release
on 2026-01-22): "release died, data lived." Reached from BEA's schedule pages rather than from BLS's
lapse tables, this converges with the parent lane's independent finding that a lapse "deletes the
advance vintage and reschedules the third-estimate payload intact." Two methods, one answer.

**Where this series sits in that taxonomy is settled by its own record:** 117 releases, zero
deletions, one 27-day delay. A quarterly balance-of-payments account has no field-collection window
that a lapse can destroy, which is the mechanism the BLS taxonomy uses to sort deletions from
delays — the data exist in Census and Treasury filings whether or not BEA is at its desk.

### Leg 5 — a delayed edition takes months to recover, as the FT-900's did · **REFUTED**

The [`intl-trade-full-report-2026-12-08`](intl-trade-full-report-2026-12-08.md) lane measured the
monthly report's recovery as a six-edition ladder (+44d → +36 → +33 → +24 → +14 → +4 → −3). The
quarterly series does it in **one**: after the 106-day Q3-2025 edition, the **Q4-2025** edition
published **2026-03-25** at an 84-day lag, against 79 days for Q4-2024 and 81 for Q4-2023 — roughly
four days of residue, gone by the next slot.

That is a cadence artifact rather than a virtue: a monthly series has to absorb a shock inside 30-day
spacing and stacks its editions, while a quarterly one has 90 days of slack and simply spends it.
It matters for reading the *successor* — a displaced 2026-12-18 would be back to normal by the
Q4-2026 edition in March 2027, so a slip here is a one-edition event, not a quarter-long drag.

### Leg 6 — the print moves the nowcast, as its FT-900 siblings do · **REFUTED**, and the mechanism is simply absent

The Atlanta Fed's `GDPNowcastDataReleaseDates.xlsx`, both sheets, for December 2026:

| Date | GDPNow posting |
|---|---|
| 2026-12-16 | Retail sales + inventories, Industrial production |
| 2026-12-17 | Housing starts, Import and export prices |
| **2026-12-18** | **— no entry, either sheet** |
| 2026-12-23 | GDP (Q3 3rd estimate), Personal income and outlays, NIPA underlying detail, Advance M3-1, New-home sales |

GDPNow ingests the **monthly** trade report, not the quarterly balance of payments, so this release
has no nowcast channel to move. Every measurement in the FT-900 ledgers — the 0.070pp median vintage
move, the month-1 position effect, the 0.10pp thresholds — describes a mechanism this event does not
possess. The one number this print produces that nothing else on the calendar produces is the
**current-account balance itself**, and no tracked instrument consumes it.

### Leg 7 — the 12-18 session is a place to act on an 08:30 print · **REFUTED**, twice over

**The release class is inert.** SPY, 6,709 sessions since 2000-01-01, ITA release days excluding
quarterly opex (n=94): median absolute overnight gap **0.210%** vs a **0.290%** baseline (p=0.040),
median session range **1.200%** vs **1.046%** (p=0.068); restricted to 2010+ (n=63) the same split
tightens to 0.185% (p=0.034) and 1.085% vs 0.901% (p=0.033). The family's own robustness check kills
it: **QQQ reproduces none of it** — 0.344% vs 0.384% (p=0.43) and 1.528% vs 1.419% (p=0.35). A
single-index effect that inverts sign between the gap (quieter) and the range (wider) on the same
sessions, and vanishes on a correlated index, is a calendar artifact — these releases cluster in the
Tue–Thu of quarterly expiration week — not a release effect.

**And the day belongs to expiration, which is itself quieter than folklore says.** 2026-12-18 is the
third Friday of December, so `opex-2026-12-18` (confirmed, high) owns the session:

| Class (SPY, since 2000) | n | median \|gap\| | p | median range | p |
|---|---|---|---|---|---|
| December quarterly opex | 26 | 0.347% | 0.426 | **0.869%** | 0.266 |
| Quarterly opex, ex-December | 72 | **0.380%** | 0.039 | 1.043% | 0.967 |
| ITA release days (ex-opex) | 94 | 0.210% | 0.040 | 1.200% | 0.068 |
| Baseline | 6,511 | 0.290% | — | 1.046% | — |

Two things follow. **Triple witching is not a wide session** — December's median range runs *below*
baseline and is statistically indistinguishable from it (QQQ agrees in direction: 1.101% vs 1.419%,
p=0.14). What the quarterly expiration actually does is concentrate in the **open**: outside
December the gap runs 0.380% against 0.290% (2010+: **0.443%** vs 0.285%, **p=0.007**) with the range
untouched (0.828% vs 0.901%, p=0.45) — the signature of settlement mechanics at the opening auction,
not a day of chaos. That is `-2`.

**Rare configuration, small sample, stated as such.** Of 117 releases in the archive, **8** landed on
a quarterly expiration; only **2005-12-16** and **2020-12-18** did so in December, making 2026-12-18
the **third**. Only 2 of 30 Q3 vintages have ever fallen on a Friday, and both were those two. The
table above measures the containing classes, never the intersection, which has no usable sample.

Also on the date: `boj-decision-2026-12-18` (estimate, medium), concluding a two-day MPM, and
`ecb-decision-2026-12-17` the session before. Attribution on 12-18 is dirty in three directions and
this print is the smallest of them.

### What the conditions support

Nothing to open, on any horizon. The output is a `confirmed` date, a canary whose validity is now
argued from measurement instead of assumed, a corrected day-count, one refuted nowcast framing that
would otherwise have been inherited from the siblings, three registered predictions and zero calendar
proposals.

### Honest limits

- **Two archive gaps, and they are the listing's, not the series'.** BEA's archive returns no rows
  for **2004Q2** and **2009Q2**. Both quarters almost certainly published — the surrounding cadence
  is unbroken and no BEA notice mentions them — but "zero deletions in 117 releases" is properly read
  as *zero deletions among the 117 releases the archive lists*.
- **The 2025 lapse dates are carried, not verified.** `2025-10-01 → 2025-11-12` comes from sibling
  ledgers that report it press-grade. Leg 3's mechanism (backlog, not window) does not depend on the
  exact end date — the FT-900's own 2025-12-11 publication is on BEA's calendar — but the "five
  weeks earlier" phrasing does.
- **The input chain is asserted at one link, not enumerated.** Leg 3 names the September FT-900 as
  the last Jul–Sep input this calendar tracks. BEA also consumes Treasury TIC data and its own
  services surveys, whose schedules this lane did not fetch. A pre-cliff input this ledger did not
  check could reopen the backlog channel.
- **The canary is one-directional.** A published 12-18 clears the shared channel. A *silent* 12-18
  would not, by itself, distinguish a lapse from an agency-specific problem, and the correct response
  is to read `gdp-q3-2026-third-2026-12-23` as at risk rather than as doomed.
- **Everything about 12-23's own exposure belongs to its lane.** This ledger verifies the sequencing
  and the mechanism; it does not re-derive the parent's own legs.
- **Session studies measure containing classes.** n=26 December expirations and n=94 release days,
  with the intersection at n=2 in December. None of it is a forecast about 2026-12-18.
- **No Q3 consensus exists at D-104**, and the Q2 edition that sets its base has not printed. Every
  content statement here is a last-published reading, never a forecast.
- **`symbols: []` and `low` impact are doing real work.** Even were every measurement twice as
  strong, this event has no instrument attached and no house playbook keyed to it.

## Stance & kill switches

**Stance (date is `confirmed` as of this assessment).** Stand aside on 2026-12-18 and on every
edition of this release. Hold three frames. **On the canary:** it is genuine but narrower than the
filing claimed — it reads "is BEA publishing on the morning of 12-18," which under the all-or-nothing
2025 precedent (zero releases across 43 days, one cancelled, resumption seven days after funding
returned) is the *only* failure channel 12-18 and 12-23 still share, because the backlog channel that
actually moved this slot in 2025 is closed by a Jul–Sep input chain that completes on 11-04. **On the
failure mode:** if it does slip, expect **delay, not deletion** — 117 releases since 1996 with zero
deleted, the one disruption a 27-day displacement that recovered inside a single edition, and no
field-collection window for a lapse to destroy. **On the tape:** treat 12-18 as unreadable rather
than merely inert. The release class fails its cross-index check outright (QQQ p=0.43/0.35), and the
session belongs to quarterly expiration and a BoJ decision — with the measured expiration signature
in the *opening gap*, not the range. Nothing here licenses an entry, `confirmed` or not, and there is
no instrument to enter.

**Kill switches** — any one of these ends the stance above and earns a ledger row:

- **BEA publishes some but not all of a day's scheduled releases during any funding lapse through
  2027-03-31.** The all-or-nothing premise is what converts one yes/no observation into information
  about 12-23; a selective lapse breaks the inference and the probe has to be re-argued or retired.
- **The 2026-12-18 slot moves or disappears from `bea.gov/news/schedule` before 2026-12-11.** A
  pre-cliff reschedule means something other than funding is driving the date, and the entire canary
  framing is answering a question nobody asked.
- **A Jul–Sep 2026 input to this release is still unpublished on 2026-12-11.** That reopens the
  backlog channel Leg 3 closed, at which point 12-18 and 12-23 no longer share a single channel and
  the read stops transferring.
- **The Q3-2026 edition is deleted rather than delayed** — absorbed into a later combined release the
  way the Q3-2025 advance GDP estimate was. 117/117 becomes 117/118, and this series moves from BEA's
  delay class into its deletion class.
- **SPY's 2026-12-18 high-low range exceeds the median of its trailing 20 sessions.** Against a
  December-expiration median of 0.869% versus a 1.046% baseline, that breaks the day-class ordering
  Leg 7 rests on and the frame is re-derived rather than patched.
- **A macro-keyed house playbook lands in `docs/plans/trade-playbooks.md` before 2026-12-01.** The
  stand-aside is partly an absence-of-instrument argument; a macro-keyed playbook makes it live.

**Registered predictions** (zero capital by design, scored from re-run data, never from memory):

- `FT-intl-transactions-q3-2026-12-18-1` — the release **publishes on 2026-12-18**. Registered
  despite a 29-of-30 base rate precisely because the one miss is the same slot one year earlier and a
  funding cliff sits seven days ahead of it; this is the canary reading itself, not a formality.
  Score by 2026-12-18.
- `FT-intl-transactions-q3-2026-12-18-2` — **SPY's 2026-12-18 high-low range is smaller than the
  median of its trailing 20 sessions** (each as a percentage of the prior close). Score by
  2026-12-19.
- `FT-intl-transactions-q3-2026-12-18-3` — **12-18 and 12-23 share a fate**: either both BEA releases
  publish on their scheduled dates or neither does. This tests the canary's validity rather than its
  outcome, and it is the claim the parent lane's leg 8 depends on. Score by 2026-12-23.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-05 | D-104 | **Initial research. The canary is real but narrower than the filing claimed, and this exact slot has already failed a lapse test once.** Date **promoted `estimate` → `confirmed`** on `bea.gov/news/schedule` (HTTP 200, 75,122 bytes, verbatim "December 18 \| 8:30 AM \| News \| U.S. International Transactions and Investment Position, 3rd Quarter 2026") plus `/news/schedule/full`: `BEA:` is a confirmed-tier prefix, the release is BEA-only (no joint-publisher objection), and the entry reserved the confirming re-read for this lane. **Leg 1 SUPPORTED with a correction:** the December block runs 12-02, 12-08, **12-10**, **12-18**, 12-23, 12-23 — nothing between 12-10 and 12-18, so this is the first post-cliff BEA release; but it is **seven** days after 12-11, not six (six days into a lapse beginning 00:00 12-12). Entry amended. **The central finding — BEA's 2025 plan PDF (published 2024-09, 202,771 bytes, streams inflated) scheduled the Q3-2025 edition for "December 18, Thu, 8:30 a.m."; it published 2026-01-14, +27 days** — the only miss in **30 Q3 vintages, 1996–2025**, from a **117-release archive (1996-09-10 → 2026-03-25, 8 archive pages)** with **zero deletions** and a **78-day** median quarter-end lag (min 70, max 106; this edition is 79). **And the cause was not the lapse window (REFUTED):** the 43-day 2025 lapse ended 11-12, five weeks before the slot; what moved it was the input backlog — the Sept-2025 FT-900 slipped to **2025-12-11** and the ITA followed **34 days** later against a normal **44** (Sept-2026 FT-900 11-04 → 12-18). **That closes the backlog channel here** (Jul–Sep 2026 inputs all publish pre-cliff) and leaves 12-18 and 12-23 sharing exactly one channel: BEA dark on the morning. **Leg 4 — that channel is all-or-nothing**, parsed from BEA's as-published 2025 calendar *with link presence*: one release scheduled inside the window (10-30 Q3 advance GDP) and **never released**, nothing published 09-29 → 11-19, resumption **seven days** after funding returned. The same rows show BEA's deletion mode (10-30 advance absorbed into "Q3 2025 Initial Estimate" 12-23), converging from schedule pages with the parent lane's BLS-side finding and with `government-funding-deadline-2026-12-11`'s PCE case. **Leg 5 — recovery is one edition, not six:** Q4-2025 published 2026-03-25 at an 84-day lag vs 79/81 for 2024/2023, against the FT-900's six-edition ladder. **Leg 6 REFUTED — no nowcast channel at all:** the Atlanta Fed's `GDPNowcastDataReleaseDates.xlsx` (16,944 bytes, both sheets) has **no 2026-12-18 row**; postings on 12-16, 12-17, 12-23 bracket it. Do not inherit the FT-900 siblings' 0.10pp framing. **Leg 7 — the tape:** SPY 6,709 sessions since 2000; ITA days ex-opex (n=94) gap **0.210%** vs 0.290% (p=0.040) and range 1.200% vs 1.046% (p=0.068), tightening in 2010+ (n=63, p=0.034/0.033) — but **QQQ reproduces nothing** (p=0.43/0.35), so the class is inert and the SPY split reads as expiration-week clustering. December quarterly opex (n=26): range **0.869%** vs 1.046% baseline (p=0.27) — triple witching is *not* a wide session; the quarterly signature is the **open** (ex-December gap 0.380% vs 0.290%, p=0.039; 2010+ **0.443%** vs 0.285%, **p=0.007**, range unchanged). Only **8** of 117 releases ever landed on a quarterly expiration, **2** in December (2005-12-16, 2020-12-18) — 2026-12-18 is the third. **Adjacency sweep — peers:** n/a, `symbols: []`. **Macro:** FOMC 12-09, CPI 12-10 precede the cliff; PPI 12-15, retail sales 12-16, import/export prices 12-17 follow it; 12-23 carries GDP third + PCE + durable goods. **Volatility:** VIX **14.53** (2026-09-04 close) — baseline, matching the 09-05 sibling ledgers, nothing to diff against yet. **Geopolitical:** the 12-11 cliff is carried press-grade from `cr-expiry-2026-12-11` / `government-funding-deadline-2026-12-11`, not re-verified; G20 Miami 12-14, ECB 12-17, BoJ 12-18. **Event tape:** last published readings — current account **−$226.8B** (Q1 2026, widened 2.6% from −$221.1B), NIIP **−$21.27T** (from −$21.87T); Q2 2026 prints **2026-09-24**, 19 days out, and sets the Q3 base. No Q3 consensus exists. **No new dated event proposed.** Two were considered and declined: the **2026-09-24** Q2 edition of this same series (dated on the BEA primary, but `low`/`symbols: []` with no cliff adjacency — it would spend a session to observe what this ledger's 09-24 watch line already covers) and the **2026-12-10** state-PCE release (the last pre-cliff BEA item, load-bearing as this leg's boundary marker but carrying no market read of its own). **Three forward tests registered:** `-1` (publishes on 12-18 — the canary reading), `-2` (SPY 12-18 range below its trailing-20 median), `-3` (12-18 and 12-23 share a fate — the canary's validity, which is what the parent lane's leg 8 rests on). | **Initial stance set: stand aside; date promoted to `confirmed`, the canary re-scoped to the one channel 12-18 and 12-23 actually share, the failure mode measured as delay-not-deletion (0 of 117), and the FT-900 siblings' nowcast framing refuted as inapplicable.** | 2026-10-05 (low, 15+ band: every 30d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new `src/domain/market-events/<id>.json`
(`status: "estimate"`) in the same PR. Close-out fills `## Outcome` below from re-run instrument
data (cache busted first), never from memory — after which this doc goes quiet.
