# Construction Spending — Value of Construction Put in Place (Oct 2026 data) — construction-spending-2026-12-01

**Kind:** macro-print · **Date:** 2026-12-01 (confirmed, CENSUS: two primaries fetched direct 2026-09-06 — `economic-indicators/calendar-listview.html` row "Construction Spending (Construction Put in Place) | December 1, 2026 | 10:00 AM | October 2026", code `A202612011000`, reference `A202610`; and the C30 program's own `construction/c30/release.html` schedule table, final row "October | December 1 | 10:00 a.m.") · **Impact:** low
**Last assessed:** 2026-09-06
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"low:15+","adjacentIds":["adp-employment-2026-12-02","advance-economic-indicators-2026-11-27","aws-reinvent-2026","chicago-pmi-2026-11-30","dallas-fed-mfg-2026-11-30","dallas-fed-tssos-2026-12-01","fomc-blackout-start-2026-11-28","georgia-senate-runoff-2026-12-01","ism-manufacturing-2026-12-01","ism-services-2026-12-03","japan-cpi-tokyo-flash-2026-11-27","jobs-2026-12-04","jolts-2026-12-01","m3-full-report-2026-12-03","thanksgiving-half-day-2026-11-27"],"screenStreak":0,"blocked":[{"url":"https://alfred.stlouisfed.org/graph/fredgraph.csv?id=TTLCONS&vintage_date=2026-09-01","status":"404","at":"2026-09-06"},{"url":"https://alfred.stlouisfed.org/series/downloaddata?seid=TTLCONS","status":"200-html-shell","at":"2026-09-06"}]} -->

## At a glance

**TL;DR.** **This is the print the sibling lane went looking for — a release the nowcast genuinely
reads — and reading it is still not a reason to do anything.** The `m3-full-report-2026-12-03`
ledger proposed this row on the inverse of its own finding: M3-2 sits in the Atlanta Fed's "other
releases" column and drew a posted GDPNow update on 2 of 13 editions in 2026, while Construction
Spending is a **trigger** and drew one on **14 of 14**. That holds, and the size of the footprint is
larger than anything measured in this family: isolating vintages whose own `Data releases` text names
construction spending and nothing else (**n=9**), GDPNow moves \|Δ structures\| **0.0438pp** against a
**0.0006pp** baseline — a **73×** ratio, permutation **p<0.0001** — and \|Δ residential\| **0.0632pp**
vs **0.0060pp** (**p=0.0046**). **91.1%** of construction vintages clear the baseline's structures
p90. Two things stop that becoming a call. First, **the move does not reach the headline**: the same
n=9 class moves \|Δ GDP\| **0.0977pp** against **0.0833pp**, **p=0.77** — the print reallocates inside
the investment lines and leaves the total alone. Second, **the number it moves is one Census itself
flags as noise**: the headline m/m is marked not statistically distinguishable from zero in **27 of 29**
measured editions (median move **0.30%**, median margin of error **±0.80%**), and the one-month-later
revision to the level runs a median **0.74%** — **larger than the first print's own move in 14 of 19
pairs**. The tape claim is not made at all, because it cannot be: **72 of 81** release dates are the
first trading day of the month, shared with ISM Manufacturing, and the only 5 off-cycle sessions since
2021 sit inside the post-lapse catch-up window. Date is now **confirmed** on two Census primaries;
`symbols: []`. Stand aside — and if the October number matters to a reader, read it on **2027-01-04**,
not on 12-01.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-86) | **Stand aside** | High | `symbols: []`, D-86, no October data in existence, and a re-grep of `trade-playbooks.md` and `multi-symbol-sweep.md` for any macro/construction/Census keying returns **0 hits** today. The measured footprint is on the Atlanta Fed's model, not on a price, and no instrument attaches to this event on any date — the `confirmed` flip changes the honesty label on the date and nothing else. | A macro-keyed house playbook landing in `docs/plans/trade-playbooks.md` before **2026-12-01** — none exists today |
| This week | **Stand aside — the series has nothing in the week, and the newest edition is five days old** | High | The current release is **CB26-140**, published **2026-09-01** with July 2026 data: total **$2,157.6B** SAAR, **−0.5% (±0.8%)\*** m/m, **−3.8%** y/y; private residential **$859.0B** (−1.3%\*), private nonresidential **$755.2B** (+0.4%), public **$543.4B** (−0.2%\*). The asterisk is Census's own — the headline is not statistically distinguishable from zero. The next edition is the August-data print on **2026-10-01**. VIX **14.53** (2026-09-04 close). | Census moving or suspending the **2026-10-01** slot before that date — unprecedented on an 84/84 record across seven calendars |
| This month | **Do not read this print on its release day — read it a month late, or read its components instead of its headline** | High | The revision, not the release, carries the information. Across **19 first→revised pairs** harvested from Census's own press releases, the one-month-later revision to the headline level runs **mean 0.96%, median 0.74%, max 2.74%**, is **larger than the first print's own m/m in 14 of 19 (73.7%)**, and moved *against* the first print's direction in **9 of 19**. Set beside a median first-print move of **0.30%** against a median stated margin of error of **±0.80%**, the day-one headline is a number Census declines to call different from zero and the next month usually overwrites by more than its own size. | A 2026-12-01 headline whose \|m/m\| clears its own stated margin of error — **2 of 29** measured editions did (April and May 2023), so this is a real if uncommon outcome, observed on the release itself |
| This quarter | **Track the components, not the aggregate — the composition is rotating hard while the total drifts** | Medium | The −3.8% y/y aggregate hides two opposite moves. On FRED SAAR through July 2026: **office construction is at an all-time high, $140.1B, +16.9% y/y** and **power at an all-time high, $181.5B, +5.3%** — the data-centre and grid build — while **manufacturing structures are $169.8B, −21.2% y/y and −32.1% below their Sept-2024 peak of $250.2B**, and residential is **−7.3% y/y, −11.7% off its May-2022 peak**. Medium, not high: this is a composition read on a series whose components carry wider revisions than the total, and the app holds no instrument on either side of the rotation. | Manufacturing structures printing a positive y/y in any edition through **2027-03-31**, or office construction printing a m/m decline of more than 1% — either would break the rotation this call describes |

**Signals & conditions** — the buy/sell/hold triggers:

- **No buy signal and no sell signal exists off this event.** `symbols: []`, no macro-keyed playbook
  (0 hits, re-grepped today), and a nowcast footprint that measures a model rather than a market. The
  date being **confirmed** widens nothing: research is not action.
- **The date is now confirmed, and this session is what promoted it.** Two Census primaries — the
  economic-indicators calendar and the C30 program's own release-schedule table — plus an Atlanta Fed
  corroboration. The no-self-confirm rule binds the sweep that discovered an event, not its own
  initial research.
- **The trigger claim that created this row is SUPPORTED, and it is the family's first one.**
  14 of 14 2026 editions drew a *posted* GDPNow update, against 2 of 13 for the M3-2 proposer. The
  2026-12-01 PostedUpdates row names this print by name, alongside ISM Manufacturing.
- **The line to read first — Δ structures, and expect it to move.** Registered as `-1`: the
  2026-12-01 vintage moves the Q4-2026 structures contribution by **at least 0.02pp**. Base rate
  **82.0%** on the co-release class, **75.4%** pooled.
- **The headline is Census-flagged noise, and that is the stance's backbone.** Registered as `-4`:
  the 2026-12-01 release carries the not-statistically-significant asterisk on its total-construction
  m/m. **27 of 29** measured editions did.
- **The revision is bigger than the signal.** Registered as `-3` at the measured 73.7% rate. A reader
  who waits for the **2027-01-04** edition gets a better October number than the one printed on 12-01.
- **The tape claim is declined, not made.** SPY runs 1.141% vs 0.972% on release days (n=66,
  **p=0.0554**) and XHB 2.185% vs 1.853% (**p=0.0065**) — but 72 of 81 release dates are the month's
  first trading day, shared with ISM Manufacturing, so none of it is attributable. Registered as `-2`
  against the class's own p75 rather than as a finding.
- **Watch (dated)** — August-data print **10-01** · September-data **11-02** · Thanksgiving half day
  **11-27** · FOMC blackout from **11-28** · Chicago PMI and Dallas Fed **11-30** · **this print
  12-01** 10:00, alongside the tracked `high`-tier `ism-manufacturing-2026-12-01`, `jolts-2026-12-01`
  and the `georgia-senate-runoff-2026-12-01` · ADP **12-02** · M3-2 and ISM Services **12-03** ·
  Employment Situation **12-04** · CR expiry **12-11** · November-data successor **2027-01-04**
  (derived, not on any Census primary yet) · new-home sales **11-25** (proposed in this PR).

## Initial research

### The question, plainly

This event exists because the `m3-full-report-2026-12-03` lane's adjacency sweep proposed it, on a
specific and unusually sharp argument: the Atlanta Fed's release workbook splits its inputs into a
**trigger** list that *causes* a posted GDPNow update and an **"Other releases"** list folded in only
when they happen to land on a trigger day. Construction Spending is a trigger. M3-2 — the proposer —
is an other release. And no construction-spending entry existed anywhere in this calendar. The sweep's
words: *"the same corridor tracks the opportunistic half of a GDPNow morning and misses the causal
half."*

**Is the trigger claim right, how big is the footprint, and does any of it reach a price?**

**One-line verdict:** the trigger claim is right and the footprint is the largest this family has
measured — and it still does not license anything, because it lands on the structures line rather
than the headline, the number it lands on is one Census itself declines to call different from zero,
and the market-side question cannot be asked at all on this release's schedule.

### Method

Macro-print mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — `symbols: []`, so
neither `earnings-cycle.mjs` nor `intraday-edges.mjs` applies and the cache-busting rule has no
target. Nine inputs, all fetched direct on 2026-09-06 unless the text says otherwise:

1. **Seven Census release calendars** — `calendar-listview.html` (2026; HTTP 200, 91,396 bytes, 178
   rows) plus `calendar-listview-2020…2025.html`, all HTTP 200, parsed row-wise into
   `(indicator, release date, time, reference month, release code)` — **1,128 unique rows**, giving
   **84 Construction Spending releases, reference months 2019-11 → 2026-10, zero gaps**.
2. **`census.gov/construction/c30/release.html`** (HTTP 200, 48,117 bytes) — the C30 program's own
   release-schedule table, the second primary on this date.
3. **`census.gov/construction/c30/current/index.html`** (HTTP 200, 115,201 bytes) — the current
   release, **CB26-140**.
4. **`census.gov/construction/c30/c30index.html`** (HTTP 200, 549,021 bytes) — the program page and
   its announcements block.
5. **`GDPNowcastDataReleaseDates.xlsx`** (Atlanta Fed, HTTP 200, 16,944 bytes) — both sheets:
   `PostedUpdates` (82 dated rows, 2025-12-23 → 2026-12-23), `InternalUpdates` (56 rows), and the two
   legend columns that define what triggers a public post.
6. **`GDPTrackingModelDataAndForecasts.xlsx`** (Atlanta Fed, HTTP 200, 10,875,424 bytes) —
   `ContribArchives`, **1,871 vintages 2014-05-01 → 2026-07-28 = 1,822 same-quarter deltas**, joined
   to input 1 on release date and classified by the sheet's own free-text `Data releases` column.
   20,000-iteration permutation tests on medians throughout.
7. **FRED CSV series** — `TTLCONS`, `TLRESCONS`, `TLNRESCONS`, `TLMFGCONS`, `TLOFCONS`, `TLPWRCONS`,
   `TLPRVCONS`, `TLPBLCONS`, `PRRESCONS`, `PNRESCONS`, all HTTP 200. FRED is reachable from this
   runner, which is a change from the `m3-full-report-2026-12-03` session's environment and is why
   the level work below is derived rather than carried.
8. **Wayback captures of `census.gov/construction/c30/current/index.html`** — the CDX API returned
   **37 captures 2022→2026**, all retrieved, **32 parsed** into press-release fields (**29 unique
   editions**, **19 complete first→revised pairs**). Archived *primary* documents, used because
   ALFRED is unreachable from this runner.
9. **Yahoo daily bars** — SPY, QQQ, `^VIX`, plus **ITB** and **XHB** as the two homebuilder/
   construction sector ETFs a construction print would most plausibly key, 2015→2026-09-04, with
   **1,425** sessions used from 2021-01-01.

**Two fetch failures are recorded in `probe-ref.blocked` rather than papered over.** ALFRED's
`fredgraph.csv` vintage endpoint returns **404** from this runner and `alfred.stlouisfed.org/series/
downloaddata` returns an HTML shell rather than data, so **no vintage series was obtainable** — every
revision figure in Leg 5 comes from Census's own archived press releases instead, and the source
prefix on that leg is the archive's, never ALFRED's. Yahoo also 429'd on a first unheadered request
and served normally with a contactable User-Agent; that is a client error, not a blocked source, and
is not recorded as one.

### Leg 1 — the release exists on 2026-12-01 · **SUPPORTED**, on two primaries, and promoted to `confirmed`

Census lists `A202612011000`, reference `A202610`, 10:00 a.m., and the C30 program's own release
schedule independently reads `October | December 1 | 10:00 a.m.` — its final row, which is also why
the November-2026 successor is **not proposable** (no primary carries it yet; the derived
2027-01-04 date in the watch list is stated as derived).

Status moves `estimate` → **`confirmed`**, on the precedent the `m3-full-report-2026-12-03` lane set
one week's work earlier: the "the lane may not self-confirm an event it discovered in-sweep"
convention binds the *discovering* sweep, and this is the independent second look. The suspension
caveat does not transfer either. Across the seven calendars, **no Construction Spending row has ever
been suspended** — the `Suspended` entries belong to the Advance Economic Indicators Report (5
reference months), Preliminary Steel Imports (5) and the Advance Services Report (1). The family's
standing generalization holds here in its cleanest form yet: **Census cancels the releases with no
independent survey behind them, and keeps the ones that have one.**

### Leg 2 — this print is a GDPNow trigger, and the proposer's framing is exactly right · **SUPPORTED**

`GDPNowcastDataReleaseDates.xlsx` names eight trigger inputs — construction spending · ISM
Manufacturing · international trade (full report) · wholesale trade · retail sales + inventories ·
housing starts · advance Census manufacturing (M3-1) · personal income and outlays — against ten
"other releases … incorporated when they are released on the same day as the releases in column J."

Mapped against the 14 Construction Spending editions on the 2026 Census calendar:

| 2026 construction-spending editions | Count |
|---|---|
| Drew a **posted** GDPNow update | **14 of 14 (100%)** |
| Appeared only as an internal update | **0** |

The proposer, M3-2, drew **2 of 13**. And the row for the edition this ledger is about is explicit:
`PostedUpdates`, **2026-12-01, 10:00**, `Construction spending, ISM Manufacturing Index`. The Atlanta
Fed intends to publish a GDPNow vintage that morning and names this print as one of its two causes.

### Leg 3 — the footprint is real, isolable, and the largest in this family · **SUPPORTED**, at 73×

`ContribArchives` gives 1,822 same-quarter deltas. Classifying each vintage by its own `Data
releases` free text:

| Vintage class | n | \|Δ Structures\| | \|Δ Residential\| | \|Δ GDP\| |
|---|---|---|---|---|
| **Construction spending named ALONE** | **9** | **0.0438pp** | **0.0632pp** | 0.0977pp |
| Construction spending **+ ISM Manufacturing** | 109 | 0.0668pp | 0.0619pp | 0.3653pp |
| Construction spending + something else | 6 | 0.0556pp | 0.0697pp | 0.4277pp |
| Every vintage naming no construction spending | 1,698 | **0.0006pp** | 0.0060pp | 0.0833pp |

| Comparison (20,000-iteration permutation on medians) | \|Δ Struct\| | \|Δ Resid\| | \|Δ GDP\| |
|---|---|---|---|---|
| CS alone vs. vintages naming no CS | **p<0.0001** | **p=0.0046** | **p=0.77** |
| CS + ISM vs. vintages naming no CS | **p<0.0001** | **p<0.0001** | **p<0.0001** |
| **CS + ISM vs. ISM without CS (n=23)** | **p=0.0013** | **p=0.0067** | **p=0.0122** |

Three readings, in descending order of strength.

**The identification is nearly deterministic.** **91.1% (113 of 124)** of construction-spending
vintages clear the *baseline's* structures p90 of 0.0127pp. Only **7.3%** of them move structures by
less than 0.01pp, against **87.9%** of the baseline. You can very nearly read the release calendar
off the structures column alone.

**It survives its co-release, which the tape work below does not.** 2026-12-01 is a CS+ISM day, and
that class is not merely "loud because ISM is loud": against the 23 vintages naming ISM
Manufacturing *without* construction spending, adding this print moves structures **0.0668pp vs
0.0066pp** (p=0.0013) and residential **0.0619pp vs 0.0217pp** (p=0.0067). The marginal contribution
is measurable on the exact day-shape this event has.

**And it stops at the investment lines.** The n=9 isolated class moves \|Δ GDP\| **0.0977pp** against
a **0.0833pp** baseline, **p=0.77**. A construction print rearranges structures and residential
investment and leaves the headline nowcast where it found it. That single p-value is the difference
between "the model reads this" and "this moves the number anyone quotes."

One observation is recorded rather than leaned on. All **10 December-dated construction vintages**
in the archive moved structures by at least **0.059pp** — 10 of 10, against 51.4% pooled. The obvious
explanation, that a December edition is the first hard construction datapoint of the Q4 nowcast, was
tested and **failed**: first-of-forecast-quarter construction vintages (n=49) move structures
**0.0547pp** against **0.0510pp** for later ones (n=89), **p=0.869**, and clear 0.05pp on 53.1% vs
50.6%. With no mechanism surviving, the December run is treated as small-n and `-1` is registered at
the pooled bar.

### Leg 4 — the tape reads this print · **NOT SEPARABLE**, and the claim is declined rather than made

Uncontrolled, the release day looks like something, especially in the sector:

| Class (session high-low range, % of close, since 2021-01-01) | n | Median | Baseline | p |
|---|---|---|---|---|
| **XHB** on construction-spending days | 66 | **2.185%** | 1.853% | **0.0065** |
| **ITB** on construction-spending days | 66 | **2.255%** | 2.001% | **0.0438** |
| **SPY** on construction-spending days | 66 | 1.141% | 0.972% | 0.0554 |
| **QQQ** on construction-spending days | 66 | 1.483% | 1.367% | 0.2797 |

None of it is attributable, and the reason is structural. **72 of 81 release dates since 2020 are
the first trading day of the month**, which is also ISM Manufacturing's 10:00 slot. The control that
would separate them — construction days versus first-trading-days without construction — has **n=7**
and discriminates nothing (SPY p=0.4469, ITB p=0.6167, XHB p=0.3816). The reverse control is
underpowered in the other direction: first-trading-day sessions *in general* are not significantly
wider than others (SPY p=0.2259, ITB p=0.3026, XHB p=0.0789, QQQ p=0.6083), so the elevation is not
a pure turn-of-month artifact either — it simply cannot be assigned.

The remaining sample is worse than small, it is contaminated. Only **five** construction release days
since 2021 fall off the first trading day: **2025-11-17, 2026-01-21, 2026-02-27, 2026-03-23,
2026-05-07** — every one of them a post-lapse catch-up date, in a window where a data blackout was
ending. They read wide (SPY 1.324%, ITB 3.114%, XHB 2.807%) and that says nothing about this print.

This is the mirror image of the `m3-full-report-2026-12-03` result, and the inversion is worth
stating for the next lane: **M3-2 was separable on the tape (69 of 84 days carried no other Census
release) and inert on the nowcast; construction spending is separable on the nowcast (9 isolated
vintages) and unmeasurable on the tape.** The methodological correction is that *Census-solo* is the
wrong separability test for this print — 81 of 84 construction days carry no other Census release,
and it does not help at all, because the binding co-release is **not a Census release**.

Two smaller readings, for the record. Absolute close-to-close moves show nothing on SPY (0.560% vs
0.557%, p=0.9688) and only leans in the sector (ITB 1.347% vs 1.062%, p=0.0934; XHB 1.281% vs
1.016%, p=0.1115). The four December editions since 2021 read SPY 3.192% / 1.289% / 0.978% / 0.306%
— one of four above the class p75 of 1.734%, which is what `-2` is registered against.

### Leg 5 — the number the trigger fires on · **REFUTED as a reading**, on Census's own arithmetic

Two facts from 29 unique editions parsed out of the Wayback captures, both stated by Census itself.

**The headline is flagged as not statistically significant in 27 of 29 editions (93.1%).** Census
appends an asterisk — *"the change is not statistically significant"* — to the total-construction
m/m in every edition measured except **April 2023 (+1.2%)** and **May 2023 (+0.9%)**. The median
absolute headline move is **0.30%**; the median stated margin of error is **±0.80%**. The move clears
its own error bar in **2 of 29**.

**And the revision is usually larger than the move.** Each release restates the prior month on the
revised basis, so pairing a month's first-published level with the next release's restatement of it
isolates exactly what one month of revision does:

| Reference month | First published | Revised one month later | Revision |
|---|---|---|---|
| Oct 2022 | $1,794.9B | $1,803.2B | +0.46% |
| Feb 2023 | $1,844.1B | $1,829.6B | −0.79% |
| **Mar 2023** | **$1,834.7B** | **$1,885.0B** | **+2.74%** |
| Apr 2023 | $1,908.4B | $1,909.0B | +0.03% |
| Aug 2023 | $1,983.5B | $1,988.3B | +0.24% |
| Apr 2024 | $2,099.0B | $2,142.1B | +2.05% |
| May 2024 | $2,139.8B | $2,154.8B | +0.70% |
| Jun 2024 | $2,148.4B | $2,169.0B | +0.96% |
| Jul 2024 | $2,162.7B | $2,133.9B | −1.33% |
| Aug 2024 | $2,131.9B | $2,146.0B | +0.66% |
| Sep 2024 | $2,148.8B | $2,164.7B | +0.74% |
| Jan 2025 | $2,192.5B | $2,179.9B | −0.57% |
| Feb 2025 | $2,195.8B | $2,206.9B | +0.51% |
| Mar 2025 | $2,196.1B | $2,162.0B | −1.55% |
| Jun 2025 | $2,136.2B | $2,140.5B | +0.20% |
| Jul 2025 | $2,139.1B | $2,165.0B | +1.21% |
| Apr 2026 | $2,172.4B | $2,207.1B | +1.60% |
| May 2026 | $2,210.2B | $2,168.5B | −1.89% |
| Jun 2026 | $2,166.5B | $2,167.7B | +0.06% |

**n=19 · mean \|revision\| 0.96% · median 0.74% · max 2.74% · p75 1.33% · p90 1.89% · larger than the
first print's own m/m in 14 of 19 (73.7%) · 14 up-revisions to 5 down · opposite in sign to the first
print's direction in 9 of 19.** A reader who acts on the day-one headline is acting on a move of
median 0.30% inside an error bar of ±0.80% that will, more likely than not, be overwritten next month
by more than its own size. This is the leg the stance rests on, and it is arithmetic rather than
interpretation.

### Leg 6 — the schedule survived the lapse intact, in the family's most disrupted form · **SUPPORTED**

**84 reference months, 2019-11 through 2026-10, zero missing and zero deleted.** Median
reference-month-end → release lag **32 days** (min 29, max 113, n=84). The lapse catch-up is the most
violent in the family and, unlike M3's, it *doubled up* rather than queueing:

| Reference month | Released | Lag |
|---|---|---|
| Jul 2025 | 2025-09-02 | 33d |
| Aug 2025 | **2025-11-17** | **78d** |
| Sep 2025 | **2026-01-21** | **113d** |
| Oct 2025 | **2026-01-21** | 82d |
| Nov 2025 | **2026-02-27** | 89d |
| Dec 2025 | **2026-02-27** | 58d |
| Jan 2026 | 2026-03-23 | 51d |
| Feb 2026 | **2026-05-07** | 68d |
| Mar 2026 | **2026-05-07** | 37d |
| Apr 2026 | 2026-06-01 | 32d |
| May 2026 | 2026-07-01 | 31d |
| Jun 2026 | 2026-08-03 | 34d |
| Jul 2026 | 2026-09-01 | 32d |

Three release dates carried **two reference months each** (2026-01-21, 2026-02-27, 2026-05-07) — the
mechanism by which Census cleared a four-month backlog without deleting a month. Normal cadence
resumed with the **2026-06-01** edition; **2026-12-01 would be the seventh consecutive on-schedule
release, at a 31-day lag.** For completeness, `cr-expiry-2026-12-11` sits **ten days after** this
print, so the funding branch that dominates the December MTIS ledger does not reach this date.

### Primary content read — what the newest edition says, and what it hides

**CB26-140** (released 2026-09-01, July 2026 data): total construction **$2,157.6B** SAAR, **0.5%
(±0.8%)\* below** the revised June estimate of $2,167.7B and **3.8% (±1.5%) below** July 2025's
$2,242.6B; private **$1,614.2B** (−0.5% ±0.3%); private residential **$859.0B** (−1.3% ±1.3%\*);
private nonresidential **$755.2B** (+0.4% ±0.3%); public **$543.4B** (−0.2% ±1.6%\*), of which
educational $112.3B and highway $150.3B. Year to date, $1,244.6B against $1,289.7B, −3.5%.

The aggregate is a drift; the composition is not. On FRED's SAAR series through the same month:

| Component | Level (Jul 2026) | y/y | Distance from its own peak |
|---|---|---|---|
| **Office** | **$140.1B** | **+16.9%** | **all-time high** |
| **Power** | **$181.5B** | **+5.3%** | **all-time high** |
| Public, total | $543.4B | +1.7% | −0.2% (Jun 2026) |
| Total | $2,157.6B | −3.8% | −4.8% (Feb 2025) |
| Residential | $871.2B | −7.3% | −11.7% (May 2022) |
| **Manufacturing** | **$169.8B** | **−21.2%** | **−32.1% (Sep 2024)** |

The rotation is the story: the CHIPS-era factory build has given back a third of its peak while the
data-centre and grid build sit at all-time highs, and the two roughly cancel inside a headline that
has printed negative y/y for eight consecutive months. That is a composition read this app has no
instrument on — which is why it is the `This quarter` call and not a position.

### The adjacency sweep

- **Peer prints** — n/a, `symbols: []`.
- **Macro surprises** — none since the last row; there is no last row. Within the corridor: Advance
  Economic Indicators **11-27** (a half-day session), FOMC blackout from **11-28**, Chicago PMI and
  Dallas Fed **11-30**, **this print, ISM Manufacturing, JOLTS and the Georgia Senate runoff 12-01**,
  ADP **12-02**, M3-2 and ISM Services **12-03**, Employment Situation **12-04**, CR expiry **12-11**.
- **Volatility regime** — VIX **14.53**, SPY **770.19**, QQQ **718.96**, ITB **93.91**, XHB **103.25**
  (2026-09-04 closes, Yahoo daily bars). Baseline reading; nothing to diff against yet.
- **Geopolitical / policy** — PL 119-103 funds through 2026-12-11 (carried from the sibling ledgers),
  ten days *after* this print. Tariff policy reaches construction through input costs rather than
  through this statistic's publication, and no channel to a series with no symbols.
- **Event tape** — no October consensus exists at D-86 and none will before the **11-02**
  September-data edition sets the base. Every October-content statement here is a base rate.
- **One dated event proposed in this PR**, its own file owned by this lane:
  **`new-home-sales-2026-11-25`** — Census's New Residential Sales, 10:00, October 2026 data, 84
  editions with zero gaps on the same seven calendars, named in the Atlanta Fed's "other releases"
  and folded into the posted 11-25 vintage. It reports **the same reference month as this print**
  from the demand side, and the residential leg it speaks to is 40.4% of this print's aggregate and
  the fastest-falling part of it. The calendar tracks the resale side (`existing-home-sales-*`,
  `pending-home-sales-*`) and the residential supply side (`housing-starts-2026-12-17`, currently a
  proposal) and has no new-home demand entry at all.
- **Two considered and declined**, so their absence reads as a decision: the **November-2026
  successor edition** is not proposable — the C30 schedule table ends at the October row and no 2027
  Census calendar has been published (`calendar-listview-2027.html` returns HTTP 200 with zero
  indicator rows), so the 2027-01-04 date in the watch list is derived and stays out of the calendar;
  and **ISM Manufacturing 12-01**, this print's co-release, is already tracked as
  `ism-manufacturing-2026-12-01`.

### Honest limits

- **The isolated class is n=9.** Leg 3's cleanest result rests on nine vintages over twelve years in
  which the Atlanta Fed's free text names construction spending and nothing else. The effect is
  enormous (73× on medians, p<0.0001) and the co-release marginal test (n=109 vs 23) points the same
  way, but nine is nine.
- **The GDP null is a failure to reject, on that same n=9.** "The print does not move the headline
  nowcast" is p=0.77 against a baseline, not a demonstration of zero. It is the load-bearing
  qualifier on the whole stance and it is the weakest measurement in the ledger.
- **The classifier is free text.** `ContribArchives`'s `Data releases` column spells this input
  "Construction spending" and "Construction Spending" across the decade; the split is case-normalised
  and comma-tokenised but not otherwise cleaned. A vintage whose text silently omits the release
  would be misfiled into the baseline, biasing every test **toward** finding no difference.
- **All the nowcast work measures a model, not a market.** Every Δ describes the Atlanta Fed's
  estimate of GDP. `ContribArchives` ends 2026-07-28 and carries no Q4-2026 vintages, so `-1`'s class
  priors are out-of-sample for the quarter being nowcast.
- **The tape leg answers nothing and says so.** With 72 of 81 release dates sitting on ISM
  Manufacturing's slot and the only 5 off-cycle sessions drawn from a post-lapse catch-up, no
  construction-attributable market claim is available on this schedule, in either direction. `-2` is
  registered against the class's own p75 for exactly that reason.
- **The revision series is 19 pairs, archive-sourced, and not a clean difference.** The restated
  figure is the value as of the *next* release, which incorporates one month of survey revision **and**
  any seasonal or benchmark revision landing in between. Coverage is 2022–2026 with gaps, from the 32
  of 37 Wayback captures that parsed — a set determined by what the archive holds, not by sampling.
  Both facts widen the true revision distribution rather than narrowing it. **No ALFRED vintage data
  was obtainable** (404 from this runner, recorded in `probe-ref.blocked`), so this could not be
  cross-checked against a vintage series.
- **The component read is on revised data.** The office/power/manufacturing figures come from FRED's
  current SAAR series, which is the *revised* basis — the same basis the day-one headline is not on.
  Component revisions are wider than the total's, so the rotation is more certain in direction than
  in magnitude.
- **`symbols: []` is doing real work.** Even were every measurement twice as strong, this event has no
  instrument attached and no macro-keyed house playbook. ITB and XHB were measured because they are
  the obvious candidates, not because anything holds them.

## Stance & kill switches

**Stance (date is `confirmed`).** Stand aside on 2026-12-01 and on every edition of this report. Hold
four frames. **On identity:** the proposal is right, and this is the first release in this family with
a measured, isolable footprint on the Atlanta Fed's model — 0.0438pp on structures against a 0.0006pp
baseline in the n=9 isolated class, p<0.0001, with 91.1% of construction vintages clearing the
baseline's p90 and a marginal effect that survives the ISM co-release (p=0.0013). **On what that
footprint is worth:** it stops at the investment lines. The same class moves the headline GDP nowcast
0.0977pp against 0.0833pp, p=0.77. The model reads this print; the number anyone quotes does not move.
**On the print itself:** the trigger fires on a statistic Census marks as not statistically
distinguishable from zero in 27 of 29 measured editions — median move 0.30% against a median stated
error of ±0.80% — and whose one-month revision runs a median 0.74%, larger than the first print's own
move in 14 of 19 pairs and opposite in sign in 9 of 19. The October number is better read on
2027-01-04 than on 12-01. **On the tape:** no claim is made, because none is available. 72 of 81
release dates share ISM Manufacturing's first-trading-day 10:00 slot, the n=7 control discriminates
nothing, and the only 5 off-cycle sessions are post-lapse catch-up dates. The apparent XHB elevation
(2.185% vs 1.853%, p=0.0065) is reported and explicitly not attributed. Nothing here licenses an
entry, and there is no instrument to enter.

**Kill switches** — any one of these ends the stance above and earns a ledger row:

- **A GDPNow vintage naming construction spending alone moves \|Δ GDP\| by ≥0.30pp.** That is ~3× the
  isolated class median and above the no-CS baseline p75; it would mean the headline null of Leg 3 is
  an artifact of n=9 rather than a fact about where this print lands, and the `This month` call
  changes from "read the components" to "read the print."
- **The 2026-12-01 headline m/m clears its own stated margin of error.** 2 of 29 measured editions
  did. A statistically significant October move makes this a reading rather than a noise print, and
  Leg 5's whole arithmetic gets re-derived on a longer archive rather than patched.
- **The 2027-01-04 revision to the October total is under 0.30% in absolute value** — smaller than the
  median first-print move. One observation would not overturn a 19-pair median of 0.74%, but it is the
  dated, checkable form of "the revision is bigger than the signal," and a run of them would kill the
  `This month` call outright.
- **A construction-spending release lands off the first trading day for a non-catch-up reason** —
  which would begin building the uncontaminated sample Leg 4 could not assemble, and would make the
  XHB result testable rather than merely reported.
- **The October-2026 reference month is deleted rather than delayed** — a `Suspended` row where a date
  belongs on the Census 2027 calendar. 84/84 becomes 84/85 and Leg 6's record argument is overturned.
- **A macro-keyed house playbook lands in `docs/plans/trade-playbooks.md` before 2026-12-01.** The
  stand-aside is partly an absence-of-instrument argument; a macro-keyed playbook makes it a live
  question, and this is the one release in the family whose model footprint would then be worth
  arguing about.

**Registered predictions** (zero capital by design, scored from re-run data, never from memory):

- `FT-construction-spending-2026-12-01-1` — the **2026-12-01 GDPNow vintage moves the Q4-2026
  structures contribution by at least 0.02pp**. Score by 2026-12-07.
- `FT-construction-spending-2026-12-01-2` — **SPY's 2026-12-01 session high-low range is below 1.734%**
  of its close (the construction-day p75 since 2021). Score by 2026-12-07.
- `FT-construction-spending-2026-12-01-3` — the **one-month revision to the October 2026 total, as
  restated by the 2027-01-04 edition, is larger in absolute value than the m/m move the 2026-12-01
  release itself reports**. Score by 2027-01-08.
- `FT-construction-spending-2026-12-01-4` — the **2026-12-01 release carries Census's
  not-statistically-significant asterisk on its total-construction m/m**. Score by 2026-12-07.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-06 | D-86 | **Initial research on an id that existed only as a proposal. The proposal's trigger claim is SUPPORTED and produces the largest nowcast footprint this family has measured — and the stance is still stand aside, on two measurements that bound what the footprint is worth.** Canonical `src/domain/market-events/construction-spending-2026-12-01.json` written this session after reading the single proposal (`from-m3-full-report-2026-12-03`), now shadowed. **Leg 1 — date promoted `estimate` → `confirmed`** on two Census primaries fetched today: `calendar-listview.html` (`A202612011000`, period `A202610`, 10:00) and the C30 program's own `construction/c30/release.html` schedule table, final row `October | December 1 | 10:00 a.m.`. The no-self-confirm convention binds the discovering sweep, not the independent second look; no Construction Spending row has ever been suspended (the suspensions across seven calendars belong to the Advance Economic Indicators Report (5), Preliminary Steel Imports (5) and the Advance Services Report (1)). **Leg 2 — the trigger claim holds outright:** `GDPNowcastDataReleaseDates.xlsx` puts construction spending in the **trigger** column, and **14 of 14** 2026 editions drew a *posted* GDPNow update against **2 of 13** for the M3-2 proposer; the `PostedUpdates` row for **2026-12-01 10:00** reads `Construction spending, ISM Manufacturing Index`. **Leg 3 — the footprint, measured on 1,822 same-quarter deltas from `ContribArchives` (1,871 vintages 2014-05-01 → 2026-07-28):** vintages naming construction spending ALONE (**n=9**) move \|Δ structures\| **0.0438pp** vs a **0.0006pp** baseline (**p<0.0001**, 73×) and \|Δ residential\| **0.0632pp** vs 0.0060pp (**p=0.0046**); **91.1% (113/124)** of construction vintages clear the baseline structures p90 of 0.0127pp and only **7.3%** move it under 0.01pp against **87.9%** of baseline. It survives the co-release: CS+ISM (n=109) vs **ISM-without-CS (n=23)** reads structures **0.0668pp vs 0.0066pp, p=0.0013** and residential 0.0619 vs 0.0217, p=0.0067. **But it stops short of the headline — the same n=9 class moves \|Δ GDP\| 0.0977pp against 0.0833pp, p=0.77.** All **10** December-dated construction vintages moved structures ≥0.059pp; the obvious explanation (first Q4 datapoint) was tested and **failed** (first-of-quarter n=49 0.0547pp vs later n=89 0.0510pp, **p=0.869**), so `-1` is registered at the pooled bar rather than the December run. **Leg 4 — the tape claim is DECLINED, not made:** uncontrolled, XHB runs **2.185% vs 1.853% (p=0.0065)**, ITB 2.255 vs 2.001 (p=0.0438), SPY 1.141 vs 0.972 (p=0.0554), QQQ p=0.2797 — but **72 of 81 release dates are the month's first trading day**, sharing ISM Manufacturing's 10:00 slot; the separating control has **n=7** and discriminates nothing (p=0.45/0.62/0.38), first-trading-days in general are not wider (SPY p=0.2259, XHB p=0.0789), and the only **5** off-cycle sessions since 2021 (2025-11-17, 2026-01-21, 02-27, 03-23, 05-07) are all post-lapse catch-up dates. **The inversion of the sibling is worth banking: M3-2 was separable on the tape and inert on the nowcast; this print is separable on the nowcast and unmeasurable on the tape — and *Census-solo* (81/84 here) is the wrong separability test, because the binding co-release is not a Census release.** **Leg 5 — the number the trigger fires on, from 32 of 37 Wayback captures of Census's own release page (29 unique editions):** the total-construction m/m is flagged **not statistically significant in 27 of 29 (93.1%)** editions — median move **0.30%** against a median stated MoE of **±0.80%**, clearing its own error bar **2 of 29** (Apr-23 +1.2%, May-23 +0.9%) — and across **19 first→revised pairs** the one-month revision runs **mean 0.96%, median 0.74%, max 2.74% (Mar-2023 +2.74%)**, is **larger than the first print's own m/m in 14 of 19 (73.7%)**, runs **14 up to 5 down**, and moves opposite the first print's direction in **9 of 19**. **Leg 6 — schedule intact through the worst catch-up in the family:** **84 reference months 2019-11 → 2026-10, zero missing, zero deleted**, median lag **32d** (29–113); three dates carried **two** reference months each (2026-01-21, 02-27, 05-07) to clear a four-month backlog without dropping one; normal cadence resumed 2026-06-01 and 12-01 would be the **7th consecutive on-schedule edition** at a 31d lag. `cr-expiry-2026-12-11` sits ten days AFTER this print. **Primary content — CB26-140 (2026-09-01, July data):** total **$2,157.6B** SAAR, **−0.5% (±0.8%)\*** m/m, **−3.8%** y/y; private residential **$859.0B** (−1.3%\*), private nonres **$755.2B** (+0.4%), public **$543.4B** (−0.2%\*). FRED SAAR components tell the real story: **office $140.1B +16.9% y/y at an ALL-TIME HIGH** and **power $181.5B +5.3% at an all-time high**, against **manufacturing $169.8B −21.2% y/y and −32.1% off its Sep-2024 $250.2B peak** and residential −7.3% y/y, −11.7% off its May-2022 peak — a data-centre-and-grid build cancelling a collapsing factory build inside a headline that has printed negative y/y for eight straight months. **Adjacency sweep — peers:** n/a, `symbols: []`. **Macro:** AEIR 11-27, FOMC blackout from 11-28, Chicago PMI + Dallas Fed 11-30, **this print + tracked `high`-tier ISM Manufacturing + JOLTS + Georgia runoff 12-01**, ADP 12-02, M3-2 + ISM Services 12-03, **Employment Situation 12-04**, CR expiry 12-11. **Volatility:** VIX **14.53**, SPY **770.19**, QQQ **718.96**, ITB **93.91**, XHB **103.25** (2026-09-04 closes) — baseline, nothing to diff against yet. **Geopolitical:** PL 119-103 through 12-11 (carried); no channel to a series with no symbols. **Event tape:** no October consensus at D-86; the 11-02 September-data edition sets the base. **One dated event proposed** (own file, `estimate`): **`new-home-sales-2026-11-25`** — Census New Residential Sales, 10:00, the SAME October reference month read from the demand side, 84 editions with zero gaps, named in the Atlanta Fed's "other releases" and folded into the posted 11-25 vintage; the calendar tracks resale and residential supply and has no new-home demand entry at all. **Two declined on the record:** the November-data successor is **not proposable** (the C30 table ends at the October row and `calendar-listview-2027.html` returns HTTP 200 with zero indicator rows — the 2027-01-04 watch date is derived and stays out of the calendar), and ISM Manufacturing 12-01 is already tracked. **Two fetch failures recorded in `probe-ref.blocked`, never substituted silently:** ALFRED's `fredgraph.csv` vintage endpoint 404s from this runner and `alfred.stlouisfed.org/series/downloaddata` serves an HTML shell, so every revision figure comes from Census's own archived press releases rather than a vintage series. FRED itself **is** reachable here, unlike the M3-2 session's runner, which is why the component levels are derived rather than carried. **Four forward tests registered:** `-1` (12-01 vintage moves structures ≥0.02pp, 82.0% base rate on the co-release class), `-2` (SPY 12-01 range below the 1.734% construction-day p75), `-3` (the 2027-01-04 revision to October exceeds the m/m the 12-01 release reports, 73.7%), `-4` (the 12-01 headline carries Census's not-significant asterisk, 27 of 29). | **Initial stance set: stand aside; the date is promoted to `confirmed` on two Census primaries, and the proposal's trigger claim is confirmed with the largest measured nowcast footprint in this family — bounded by a headline-GDP null (p=0.77) and by the fact that the statistic it moves is one Census marks as indistinguishable from zero in 27 of 29 editions and revises by more than its own size in 14 of 19.** | 2026-10-06 (low, 15+ band: every 30d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-construction-spending-2026-12-01.json`
(`status: "estimate"`) in the same PR — your own file, never another event's canonical one (#1717).
Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from
memory — after which this doc goes quiet.
