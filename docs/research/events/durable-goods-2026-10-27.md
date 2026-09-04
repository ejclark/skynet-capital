# Advance Durable Goods Orders (Sep 2026 data) — durable-goods-2026-10-27

**Kind:** macro-print · **Date:** 2026-10-27 (confirmed, CENSUS: m3/release_schedule.html lists "September 2026 | 10/27/2026" and economic-indicators/calendar-listview.html lists "Advance Report on Durable Goods… | October 27, 2026 | 8:30 AM | September 2026", both fetched direct 2026-09-04) · **Impact:** medium
**Last assessed:** 2026-09-04
<!-- probe-ref: {"symbols":{},"vix":14.32,"daysBand":"medium:31+","adjacentIds":["consumer-confidence-2026-10-27","fomc-2026-10-28","gdp-q3-2026-advance-2026-10-29","pce-2026-10-29"],"screenStreak":0} -->

## At a glance

**TL;DR.** **The reason this event was given its own calendar row is already gone.** It was filed on
2026-09-01 because a funding lapse would, on this series' own 2025 precedent, have slipped it ~27–29 days
past the Oct 27–28 FOMC. **H.R. 6500 was signed into law on 2026-09-02** (whitehouse.gov; House 370–48 on
09-01), funding the government **through 2026-12-11** — so the predecessor's kill switch ("a CR signed on
or before 2026-09-30") fired **28 days early**, and this print is now unconditionally safe. The delay risk
did not disappear, it **migrated** to `durable-goods-2026-12-23` (November data), which lands 12 days past
the CR's expiry — filed as an `estimate` in this PR. What survives here is not the report's content but
its **address**: 08:30 ET on the **first morning of the FOMC's two-day meeting**, in the middle of the
Oct 27–29 mega-cap cluster. So this doc's own measurement asks what kind of session that is, and the
answer sharpens the refusal rather than softening it — **across 16 FOMC day-1 sessions the intraday range
runs ~17% (SPY) / ~19% (QQQ) narrower than an ordinary session, while the overnight gap is completely
ordinary.** The market spends day-1 waiting. Read the ex-transportation core, ignore the headline, and do
not trade the morning. Date is **confirmed**; nothing here licenses an entry.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-53) | **Stand aside** | High | `symbols: []`, D-53, no September-data consensus exists, and no house playbook (S1/S2/E1/S3/S4 + G1) is macro-keyed. There is nothing here to act on for seven weeks. | A published September-data street consensus appearing before **2026-10-20** — none has appeared earlier than release week anywhere in the 2025–26 sample |
| This week | **Stand aside — and mark the funding branch closed** | High | The load-bearing question about this print was existence, and it was answered by signature on **2026-09-02**, not by anything on the tape. This week's forks (payrolls **09-04**, the **09-05** blackout start) belong to the September FOMC, not here. | A rescission, court injunction or lapse-triggering action against **H.R. 6500** before **2026-09-30**, which would reopen the delay branch this doc just closed |
| This month | **Watch the successor's date, not this print** | Medium | Nothing about a September-reference-month orders survey is knowable in September. What *is* actionable this month is the calendar: the CR expiry **2026-12-11** now sits upstream of **`durable-goods-2026-12-23`**, and that is where the delay precedent applies. | Census moving the **2026-10-27** slot on its own schedule page before **2026-09-30** — an ordinary re-dating unrelated to funding, which would make the `confirmed` flip premature |
| This quarter | **Treat 10-27 as the quiet front edge of a loud window — never as its own event** | High | The Oct 27–29 corridor's variance belongs to five mega-cap prints and a live-hike statement, all with their own ledgers and playbooks. Measured: FOMC day-1's session range is *compressed* (SPY median p36, 6/16 above median). | SPY's **2026-10-27** intraday range printing **above 0.876%** (its trailing two-year median) — that kills the day-1 compression read and is registered as `FT-durable-goods-2026-10-27-1` |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never initiate on this print.** `symbols: []`, no macro-keyed playbook, and two independent measurements
  now say the morning is inert — the predecessor's 12-release gap null (p46 SPY / p45 QQQ) and this doc's
  FOMC-day-1 session-compression finding.
- **The number to read first** — **ex-transportation** new orders (σ 0.34, positive 7/7 in 2026), then
  **nondefense capital-goods shipments**. The headline is read last or not at all (σ 3.74 — a 10.9× split).
- **This edition's shipments line matters more than the last one's** — September is the **third month of
  Q3**, and it prints **two days before** the Q3 GDP advance on **2026-10-29**. That is the one channel
  where the report is genuinely load-bearing.
- **The headline's swing factor is knowable ~18 days early** — Boeing publishes monthly orders around the
  9th of the following month, so September aircraft orders should be public ~**2026-10-09**. Mechanism only;
  the mapping to the headline is **not measured** in this repo.
- **What this release still cannot tell you** — semiconductor **new orders** are excluded outright ("Figures
  on new and unfilled orders exclude data for semiconductor manufacturing"), and the report is **nominal**.
  Census also disclaims measurable statistical significance: M3 is not a probability sample.
- **The funding branch is closed for this print, and open for the next one** — CR signed **2026-09-02**
  through **2026-12-11**; `durable-goods-2026-12-23` (estimate, filed in this PR) is the exposed edition.
- **Watch (dated)** — FOMC **09-16** · predecessor print **09-25** · full M3 (Aug data) **10-02** ·
  Boeing September orders ~**10-09** (inferred) · CPI **10-14** · **this print 10-27** 08:30 ET +
  consumer confidence 10:00 + **MSFT** AMC (estimate) · **FOMC statement 10-28** 14:00 + GOOG/META
  (estimate) · **Q3 GDP advance + PCE 10-29** + AMZN/AAPL (estimate) · full M3 (Sep data) **11-03**, which
  is also midterm election day · successor print **11-25** · **CR expiry 12-11** · **12-23** print (estimate).

## Initial research

### The question, plainly

Does the September-2026 advance durable goods report exist on 2026-10-27, does landing at 08:30 on the
first morning of the Oct 27–28 FOMC change what the release is worth, and does anything about it license
an action for a book holding NVDA MRVL AVGO CRWV MSFT GOOG META AAPL AMZN?

**One-line verdict:** yes it exists — the funding branch that justified this row closed by signature on
2026-09-02, three days after the row was filed — and no, the FOMC collision does not make the release
tradeable; it makes it **less** so, because FOMC day-1 is measurably a waiting-room session whose realized
range runs ~17–19% below normal while its open behaves like any other open.

### Method

Macro-print mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — `symbols: []`, so neither
`earnings-cycle.mjs` nor `intraday-edges.mjs` applies and the cache-busting rule has no target. Four
inputs:

1. **Two Census primaries, fetched and parsed directly 2026-09-04** —
   `census.gov/manufacturing/m3/release_schedule.html` (the full advance/full-report grid, decoded to
   rows) and `census.gov/economic-indicators/calendar-listview.html` (which carries the 8:30 AM time and
   the reference month).
2. **The federalreserve.gov FOMC calendar, fetched direct 2026-09-04** — used for the exact two-day
   meeting boundaries for 2024–2026, so the "day-1" definition below is sourced rather than assumed.
   The page's own footer reads "Last Update: August 19, 2026."
3. **A whitehouse.gov primary for the funding question** — the briefing-room notice for H.R. 6500,
   corroborated by dated wire coverage of the 09-01 House vote.
4. **An original measurement, run for this doc.** Yahoo daily bars for SPY/QQQ over two years, reduced to
   two per-session statistics — the **overnight gap** (prior close → open, the window an 08:30 release
   lands in) and the **intraday range** ((high − low) / prior close, the window a day-trade lands in) —
   with every FOMC **day-1** and every FOMC **decision-day** session ranked against those same
   distributions. This extends the [`durable-goods-2026-09-25`](durable-goods-2026-09-25.md) ledger's
   gap method to the session dimension, because the distinguishing fact about *this* edition is which
   session it lands in.

Baseline windows end at the **2026-09-03 close**; the 2026-09-04 bar was dropped as intraday (this
session ran at 14:45 ET with the market open). The 2026 reference-month forecast table, the semiconductor
exclusion and the 2025-lapse slip table are **carried** from the predecessor ledger, not re-fetched.
Genre model: [`nvda-aug-2026-print.md`](../nvda-aug-2026-print.md).

### Conviction legs, tested

1. **The date and time are right, and this doc promotes them to `confirmed` — SUPPORTED, two primaries.**
   The M3 release schedule grid decoded to `September 2026 | 10/27/2026 | 11/3/2026` (advance report, then
   the full report), and the indicator calendar carries `Advance Report on Durable Goods--Manufacturers'
   Shipments, Inventories, and Orders | October 27, 2026 | 8:30 AM | September 2026`, id
   `A202610270830`. Both fetched direct 2026-09-04. The entry was filed `estimate` on 2026-09-01 only
   because this lane never self-confirms an event in the PR that discovers it, and its own initial
   research is the named condition for the flip — the same promotion the predecessor made a week earlier.
   Flipped with a `CENSUS:` prefix. **A stated boundary on that word:** `confirmed` describes the
   *published schedule as of today*, not immunity from a future re-dating. Note also that the **full M3
   report for this reference month is 2026-11-03**, which is midterm election day.

2. **The existence risk this event was created for is already retired — SUPPORTED, and it is this doc's
   most consequential finding.** The predecessor ledger's whole argument for giving 10-27 its own row was
   that a 10-01 lapse would slip it ~27–29 days past the 10-28 vote, and its kill switch read: *"A CR
   signed on or before 2026-09-30 — leg 7's delay branch closes, `durable-goods-2026-10-27` becomes an
   ordinary print."* **That fired on 2026-09-02, 28 days early.** whitehouse.gov's briefing-room notice
   records H.R. 6500, the *Continuing Appropriations and Extensions Act, 2027*, signed **September 2,
   2026**, providing "fiscal year 2027 appropriations to Federal agencies **through December 11, 2026**."
   The House cleared the Senate text **370–48** on **2026-09-01** (NPR, Axios, Military Times, US News,
   all dated 09-01; House Appropriations' own release corroborates). The Senate had passed it 90–6 on
   08-08. So the delay branch is closed for this print on a primary, not on a forecast.

   **Two consequences worth stating precisely.** (a) The [`government-funding-deadline-2026-09-30`](government-funding-deadline-2026-09-30.md)
   ledger is **stale** — last assessed 2026-08-29, three days before the signature, and its whole doc is
   written in the conditional. That is its own event's pulse to run, not this one's, and no edit to it is
   made here. (b) The delay risk **migrated rather than vanished**: the CR expires **2026-12-11**, and
   the next durable-goods release after that is **2026-12-23** (November data, off the same Census grid) —
   12 days past the cliff, and on this series' measured 2025 precedent a lapse would push it into late
   January. That is a dated, non-generic argument, so it is filed (see the adjacency proposal below).

3. **What survives is the address, not the content — SUPPORTED, from the Fed primary.** The FOMC calendar
   lists the October 2026 meeting as **"October 27-28"**, so this 08:30 release lands on **day 1 of a
   two-day meeting**, with the statement at 14:00 the following day. It sits at the front of a corridor
   the [`fomc-2026-10-28`](fomc-2026-10-28.md) ledger already named as one compound-variance window:
   consumer confidence 10:00 and **MSFT** after the close on **10-27**; **GOOG/META** plus the statement on
   **10-28**; **AMZN/AAPL**, the **Q3 GDP advance** and **PCE** on **10-29** (all five prints
   `estimate`-dated off 8-K cadence). That ledger's registered `FT-17` already tests the window's pooled
   variance. Nothing in that list makes an orders survey more informative; it makes it more crowded out.

4. **FOMC day-1 is a waiting-room session, and that is this doc's original contribution — MEASURED.**
   Method above; meeting boundaries from the Fed primary, so all 16 day-1 dates are sourced rather than
   derived. Two-year baselines (2024-09-05 → 2026-09-03): SPY n=501, median |gap| **0.287%**, median range
   **0.876%**; QQQ n=501, median |gap| **0.422%**, median range **1.235%**.

   | Session type | n | Gap: median pctile (above median) | Range: median pctile (above median) | Median absolute range |
   |---|---|---|---|---|
   | **SPY — FOMC day-1** | 16 | **p56** (8/16) | **p36** (6/16) | **0.723%** vs 0.876% baseline |
   | SPY — FOMC decision day | 16 | **p26** (3/16) | **p69** (11/16) | **1.123%** vs 0.876% |
   | **QQQ — FOMC day-1** | 16 | **p54** (10/16) | **p33** (7/16) | **0.998%** vs 1.235% baseline |
   | QQQ — FOMC decision day | 16 | **p26** (4/16) | **p53** (9/16) | 1.282% vs 1.235% |

   **Read the day-1 row first.** The **open is ordinary** — 8/16 above median on SPY is exactly the null,
   and the p56 median percentile is clustering, not signal. The **session is compressed**: the median
   day-1 range sits at the 36th (SPY) / 33rd (QQQ) percentile, **0.723% vs 0.876%** and **0.998% vs
   1.235%** — roughly **17%** and **19%** narrower than an ordinary session, with only 6/16 and 7/16
   above the baseline median.

   **The decision-day row is the internal validity check, and it is why the day-1 result is worth
   believing.** Where the mechanism is known — nothing happens overnight, everything happens at 14:00 —
   the method recovers exactly that, correctly signed and larger: SPY's decision-day gap collapses to p26
   (3/16) while its range expands to p69 (11/16, 1.123% vs 0.876%, **+28%**). A method that finds a real
   effect where one exists, and a *smaller, opposite-signed* effect the day before, is measuring something
   rather than manufacturing it. QQQ's decision-day range effect is much weaker (p53) — reported because
   it cuts against the cleanliness of the story.

5. **No durable-goods release in the measured sample has ever landed on an FOMC day-1 — SUPPORTED, and it
   is the honest limit on legs 3–4.** Cross-checking the predecessor's 12 sourced release dates against
   the 16 day-1 dates returns **zero** overlaps. Exactly one release fell on a **decision day**:
   **2026-04-29** (March-2026 data), which gapped SPY **−0.097%** (p20) and QQQ **+0.164%** (p22) and ran a
   compressed session on both. So **2026-10-27 is the first observation of this configuration**, the
   predecessor's gap null has never been tested inside it, and the two measurements are combined by
   argument rather than by data.

6. **The reading order is inherited unchanged, and its premise re-verified — SUPPORTED (carried).**
   Ex-transportation new orders first, **nondefense capital-goods shipments** second, headline last. The
   justification is the predecessor's measurement, not re-run here: across 2026 reference months σ(headline)
   **3.74** vs σ(core) **0.34** (**10.9×**), mean absolute forecast miss **3.30pp vs 0.44pp** (**7.5×**),
   core positive **7/7**; the 2025 sample is harsher (20× and 15×) with the core's σ **identically 0.34**
   in both years. The definitional constraint carries too: Census's explanatory notes state *"Figures on
   new and unfilled orders exclude data for semiconductor manufacturing"* — M3 is a voluntary survey and
   the large chipmakers do not answer the order questions — so no part of this release is an AI-order-flow
   read. Shipments include semis; orders do not.

7. **This edition's shipments line carries more weight than the predecessor's — SUPPORTED by mechanism.**
   Nondefense capital-goods **shipments** are BEA's monthly source input for equipment investment.
   September is the **third month of Q3**, so this release supplies the final month behind Q3 equipment
   investment and prints **two days before** the
   [Q3 GDP advance estimate on 2026-10-29](gdp-q3-2026-advance-2026-10-29.md). That is the narrow channel
   where the report is genuinely load-bearing — and it is precisely the half of the report leg 6's
   semiconductor exclusion does **not** damage.

8. **The headline's dominant swing factor should be public ~18 days before the print — SUPPORTED as
   mechanism, UNMEASURED as a mapping.** Transportation is what makes the headline a lottery (in July it
   moved +$2.6B / +2.3% and turned a +0.4% ex-transport reading into a +1.1% headline), and civilian
   aircraft is the lumpy part of transportation. Boeing publishes its own monthly orders and deliveries
   file on its corporate site around the **9th of the following month** — one dated comparable: its
   August-2025 file was reported on **2025-09-09**. On that cadence, September-2026 orders land
   ~**2026-10-09**, well before the 10-27 print. **What this is not:** no regression of Boeing gross
   orders onto the Census headline exists in this repo, the Census aircraft line is net of cancellations
   and seasonally adjusted where Boeing's is neither, and the publication date is a cadence inference
   from n=1, not a fetched date. It is a named follow-up, not a claim.

9. **Tracked-name sensitivity is nil directly and unchanged indirectly — SUPPORTED.** `symbols: []`, and
   leg 6 removes the only channel that would have been direct. What remains is inherited and
   estimate-labeled: the **rate path** (weakly — the report is nominal, has no price component, and this
   Fed is pinned to inflation), and **equipment investment via GDP** (leg 7), a quarters-long channel
   reaching every tracked name as a long-duration asset, most sharply CRWV, then NVDA/AVGO/MRVL, then the
   mega-caps. Neither licenses a position. The honest ranking for this corridor is that **MSFT's own
   10-27 print** — a company's actual capex disclosure, hours after this release — outranks a voluntary
   survey that excludes semiconductor orders by construction.

### What the conditions support

**A reading exercise with two independent refusals attached, and one calendar action.** The refusals now
stack: the predecessor measured that the release *morning* is an ordinary overnight (p46 SPY / p45 QQQ
across 12 releases), and this doc measures that the *session* it lands in on 10-27 runs ~17–19% narrower
than normal. When it prints: read ex-transportation, then nondefense capital-goods shipments — which this
quarter feed the GDP advance two days later — and treat the headline as a transportation readout whose
biggest input was probably visible on Boeing's site 18 days earlier. The corridor's actual risk is owned
by [`fomc-2026-10-28`](fomc-2026-10-28.md) and the five mega-cap print ledgers, under S2/E1, and none of
it routes through here. The one calendar action is to move the funding exposure to where it now lives:
**`durable-goods-2026-12-23`**.

### Honest limits

The **day-1 sample is n=16** and covers a single two-year regime; it rules out a large consistent effect
and nothing subtler, and no significance test is applied. It is also **not conditioned on earnings** —
2026-10-27 carries an estimate-dated MSFT print after the close, and the sample's widest day-1 sessions
(2025-01-28, QQQ p88; 2026-06-16, QQQ p83) look like earnings-adjacent weeks. The mechanical argument that
compression survives is that an after-close print puts its variance in **10-28's** session, not 10-27's —
but pre-positioning could widen the day, and that is exactly what
`FT-durable-goods-2026-10-27-1` is registered to find out. The **2026 forecast table and the 2025 slip
table are carried, not re-fetched**, so they inherit the predecessor's single-source (mql5) caveat and its
derived "normal slot" column. **No September-data consensus exists at D-53** and, on the 2025–26 pattern,
none will appear before release week — so this doc has no surprise benchmark and does not pretend to one.
Boeing's publication timing rests on **one dated comparable** and the orders-to-headline mapping is
unmeasured (leg 8). `confirmed` describes the published schedule, not immunity from an unrelated
re-dating (leg 1). And the release itself disclaims measurable statistical significance — Census computes
no confidence interval for any figure this doc or its predecessor quotes.

## Stance & kill switches

**Stance (date `confirmed`, two Census primaries fetched 2026-09-04).** Treat 2026-10-27 08:30 ET as a
**reading exercise, never an event** — no position is opened, closed or sized off it, and no house
playbook targets it. The refusal now rests on two independent measurements: the predecessor's 12-release
overnight-gap null (median percentile 46 SPY / 45 QQQ against 50), and this doc's finding that **FOMC
day-1 sessions run ~17% (SPY) / ~19% (QQQ) narrower than ordinary sessions** while their opens are
statistically ordinary — the market spends the day before a decision waiting. The standing reading order
is unchanged: **ex-transportation first, nondefense capital-goods shipments second, headline last**, and
this edition's shipments line carries extra weight as the third month of Q3, printing two days before the
**2026-10-29** GDP advance. **This release is not an AI-capex read** (new orders exclude semiconductor
manufacturing by construction), and MSFT's own print that same evening is a strictly better capex signal.
**The funding branch that justified this calendar row is closed** — H.R. 6500 signed 2026-09-02 through
2026-12-11 — and the delay risk has migrated to **`durable-goods-2026-12-23`** (`estimate`, filed in this
PR), which sits 12 days past the CR's expiry.

**Kill switches:**

- **SPY's 2026-10-27 intraday range printing at or above 0.876%** (its trailing two-year median) — the
  day-1 compression read does not survive a session carrying an 08:30 print and a mega-cap after-close
  print, and legs 4–5 need re-deriving rather than patching. Registered as
  `FT-durable-goods-2026-10-27-1`.
- **An open gap above the 90th percentile on 2026-10-27 with a session wrap naming this release as the
  cause** — the predecessor's gap null breaks in its first FOMC-day-1 observation and the `medium` impact
  tier is understated.
- **Ex-transportation printing negative on 2026-10-27** — the first negative core month since at least
  January 2025 ends the "slow persistent drift" reading; the order survives, the impact tier goes up.
- **The headline and the core moving together by a similar magnitude on 2026-10-27** — the 10.9×
  dispersion split that justifies ignoring the headline stops holding and the reading order collapses to
  one number.
- **Any action that unwinds H.R. 6500 before 2026-09-30** (rescission, injunction, a lapse-triggering
  vote) — leg 2 reopens, and the ~27–29-day slip precedent applies to this print again.
- **Census moving the 2026-10-27 slot on its own schedule page** — an ordinary re-dating unrelated to
  funding would make leg 1's `confirmed` flip premature and is the honest boundary on that word.
- **Census begins publishing semiconductor new orders** — leg 6's definitional exclusion falls and this
  event's place in the calendar needs re-deriving from scratch.
- **The FOMC moving the October meeting off Oct 27–28** — legs 3–5 are entirely about the address, and a
  moved meeting voids them rather than killing them.

**Registered forward tests** (see [`forward-tests.md`](../forward-tests.md)):
`FT-durable-goods-2026-10-27-1` (day-1 range compression, score by 2026-10-28) and
`FT-durable-goods-2026-10-27-2` (on-schedule publication, score by 2026-10-28).

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-04 | D-53 | Initial research banked (above). **Date promoted `estimate` → `confirmed`** on two Census primaries fetched direct today: the M3 release-schedule grid (`September 2026 | 10/27/2026`, full report 11/3/2026) and the indicator calendar (`October 27, 2026 | 8:30 AM | September 2026`, id A202610270830). **Finding 1 — the reason this row exists is already retired.** The predecessor's kill switch ("a CR signed on or before 2026-09-30") fired **28 days early**: whitehouse.gov records **H.R. 6500**, the Continuing Appropriations and Extensions Act 2027, **signed 2026-09-02**, funding "through December 11, 2026"; the House cleared the Senate text **370–48 on 2026-09-01** (NPR/Axios/Military Times/US News, all dated 09-01). The delay branch is closed for this print on a primary. It **migrated**, not vanished — the CR expires **12-11** and the next release is **12-23** (see the proposal below). Noted, not edited: [`government-funding-deadline-2026-09-30`](government-funding-deadline-2026-09-30.md) is stale at 2026-08-29, written entirely in the conditional; that is its own event's pulse. **Finding 2 — the original measurement.** Fed primary (federalreserve.gov FOMC calendar, fetched today) fixes the meeting as **"October 27-28"**, so this 08:30 print lands on **day 1**. Yahoo daily bars, SPY/QQQ, 2024-09-05 → 2026-09-03 (the 09-04 bar dropped as intraday; SPY n=501 median |gap| 0.287% / median range 0.876%, QQQ n=501 0.422% / 1.235%), with all 16 FOMC day-1 and 16 decision-day sessions ranked against those distributions. **Day-1: the open is ordinary, the session is compressed** — SPY gap p56 (8/16 above median, exactly the null) but range **p36** (6/16), median absolute range **0.723% vs 0.876%** (−17%); QQQ gap p54 (10/16), range **p33** (7/16), **0.998% vs 1.235%** (−19%). **Decision-day is the validity check and recovers the known mechanism correctly signed:** SPY gap collapses to p26 (3/16) while range expands to p69 (11/16, 1.123%, +28%). QQQ's decision-day range effect is weak (p53) and is reported because it cuts against the story. **Finding 3 — the configuration is unprecedented in the sample:** cross-checking the predecessor's 12 sourced release dates against the 16 day-1 dates returns **zero** overlaps; exactly one release fell on a decision day (**2026-04-29**, March data, SPY gap −0.097% p20 / QQQ +0.164% p22, compressed session both). So 10-27 is the first observation of a durable-goods print inside an FOMC meeting's first day, and the two nulls are combined by argument, not by data. **Finding 4 — the shipments channel is tighter here:** September is the third month of Q3, so nondefense capital-goods shipments print **two days before** the [Q3 GDP advance](gdp-q3-2026-advance-2026-10-29.md) on 10-29. **Finding 5 — the headline's swing factor is likely public ~18 days early:** Boeing publishes monthly orders/deliveries ~the 9th (one dated comparable: Aug-2025 file reported 2025-09-09), so September orders should land ~**2026-10-09**; mechanism only, mapping unmeasured, publication date inferred from n=1. **Carried unchanged from the predecessor, not re-fetched:** the 10.9× dispersion split (σ 3.74 vs 0.34; mean |miss| 3.30pp vs 0.44pp; core positive 7/7), the semiconductor exclusion in new and unfilled orders, the nominal-not-real caveat, and the "no measurable statistical significance" disclaimer. **Adjacency sweep.** *Peers:* n/a, `symbols: []`; the corridor's better capex read is **MSFT** AMC on this same date (estimate) — a company's own disclosure hours after the survey. *Macro:* the CR signature (above) is the material one; payrolls print today 09-04 and the FOMC blackout starts 09-05, both belonging to the September meeting, not here. *Volatility regime:* VIX **14.32** at the 2026-09-03 close (own Yahoo pull), SPY **773.17**, QQQ **717.67** — baseline established, nothing to diff against yet. *Geopolitical:* nothing new touching this release; it is nominal, so an oil-driven price effect flatters the dollar figure without changing volumes. *Event tape:* **no September-data consensus exists at D-53** and none will before release week; the 10-27 morning also carries consumer confidence at 10:00. **Adjacency proposal (1, filed in this PR): `durable-goods-2026-12-23`** — the November-data edition, `medium`, `estimate` per the no-self-confirm limit despite the date coming off today's Census grid. It earns its row on the same non-generic argument this event was filed under, now transferred: it lands **12 days after the CR expires on 2026-12-11**, and on this series' own 2025 precedent a lapse slips it ~27–29 days into late January. **Considered and declined, with reasons:** the ordinary successor **`durable-goods-2026-11-25`** (October data) — inside the CR window and its only claim is "a macro print precedes the 12-09 FOMC," which is the generic argument this calendar's bar rejects; named here so its absence reads as a decision, not an oversight. And the **2026-11-03 full M3 report** for this same reference month — a second-order restatement of a release measured as market-neutral, double-counting the reference month, and landing on midterm election day where nothing would attribute to it; the predecessor declined the equivalent 10-02 report on the same grounds. **Forward tests registered:** `FT-durable-goods-2026-10-27-1` (SPY's 10-27 intraday range closes below 0.876%; base rate 10/16 on day-1 vs an unconditional 50%) and `FT-durable-goods-2026-10-27-2` (the release publishes on schedule; near-certain by construction after the CR — registered because it is the predecessor's load-bearing forward claim and someone must score it). | — (stance set) | 2026-09-25 per the `medium:31+` band (every 21d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint notes any
row past ~1,200 chars): it is a note to the next session, not an essay, and a stance *change* earns its
sentence in the Stance section with the row as its receipt. The adjacency sweep (peer prints · macro
surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in every row; a dated
adjacent event found gets proposed to `market-events.ts` as an `estimate` in the same PR. Close-out fills
`## Outcome` below from re-run instrument data (cache busted first), never from memory — after which this
doc goes quiet.
