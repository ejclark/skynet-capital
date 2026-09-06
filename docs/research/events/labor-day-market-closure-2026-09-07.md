# US markets closed — Labor Day (compresses the September coupon block into a four-session week) — labor-day-market-closure-2026-09-07

**Kind:** sector · **Date:** 2026-09-07 (estimate — NEWS: NYSE `nyse.com/markets/hours-calendars` 2026 holiday table + SIFMA full bond close, reproduced by 5 U.S.C. 6103 and by Treasury moving its whole Monday bill slate to Tuesday 09-08; the `estimate` label is a taxonomy gap, not a doubt about the date) · **Impact:** low
**Last assessed:** 2026-09-06
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"low:0+","adjacentIds":["adp-employment-2026-09-02","beige-book-2026-09-02","challenger-job-cuts-2026-09-03","fed-waller-outlook-2026-09-03","hammack-remarks-2026-09-03","ism-services-2026-09-03","treasury-coupon-announcement-2026-09-03","waller-economic-outlook-2026-09-03","jobs-2026-09-04","sp-rebalance-proforma-2026-09-04","fomc-blackout-start-2026-09-05","opec-plus-meeting-2026-09-06","missouri-map-ballot-deadline-2026-09-08","treasury-3y-note-2026-09-08","aapl-iphone-18-launch-2026-09-09","eia-steo-2026-09-09","treasury-10y-note-2026-09-09","treasury-buyback-increase-2026-09-09","ecb-decision-2026-09-10","ppi-2026-09-10","treasury-30y-bond-2026-09-10","treasury-buyback-10y20y-2026-09-10","treasury-coupon-announcement-2026-09-10","cpi-2026-09-11","iea-omr-2026-09-11","mts-august-2026-09-11","sp-rebalance-proforma-capped-2026-09-11","umich-sentiment-prelim-2026-09-11","buyback-blackout-start-2026-09-12"],"screenStreak":0} -->

## At a glance

**TL;DR.** **Stand aside — and cut the seeding thesis in half, because the measurable part is on the
rates side and the alarming part is not there at all.** This entry was filed on the claim that the
holiday compresses the September coupon block into four sessions, stacking ~$304B of Tuesday supply
on top of the 3Y note. The supply number is real and re-verified from Treasury's own API — $304B
ranks in the **top 0.8% of all auction days since 2023** (6 of 728 above it). What does **not**
follow is stress. This structure is **not rare — it recurs whenever Labor Day falls on Sep 6 or 7,
6 of the 18 years since the 3Y went monthly** (2009, 2010, 2015, 2020, 2021, 2026) — and across its
5 scored prior instances the coupon block's own demand is, if anything, *better*: September 10Y
excess bid-to-cover vs its own trailing-12 runs **+0.183 in compressed years vs +0.031 in normal
ones** (and the gap is entirely 2009–2010 flight-to-quality; drop those two and it is +0.050 vs
+0.031, i.e. nothing). The compressed week also carries **less** net rates risk, not more —
mean |net 10Y move| **6.3bp vs 11.8bp**. What survives is relocation, not creation: the
Tuesday-after-Labor-Day reopen is a genuinely outsized rates session — mean |Δ10Y| **6.50bp against
3.77bp for an ordinary Friday→Monday** (n=33, 1.7×) — and implied vol is marked down into the
holiday Friday and rebounds on reopen **27 of 33 times (82%)**, the strongest of any Monday-holiday
cohort. **New this session, and the correction the sibling ledger could not make:** most of that
rebound is a *weekend* effect, not a *holiday* effect — an ordinary weekend at VIX<15 already
reopens higher 68% of the time against 50% for any session; the extra holiday day adds ~14pp on top,
not the whole thing. Nothing here is tradeable: `symbols: []`, `impact: low`, date is `estimate`,
and a grep of both house playbook docs for holiday/closure keying returns **zero hits**, re-run today.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — the session on the date is closed and there is nothing to size | High | D-1; `symbols: []`, `impact: low`, and `grep -icE 'holiday\|labor day\|closure\|half-day\|early close'` over `trade-playbooks.md` + `multi-symbol-sweep.md` returns **0 and 0**, run this session | A house playbook keyed on holiday-adjacent sessions written and back-tested before **2026-09-07** — the "nothing is calendar-keyed" leg dies and this sheet is rebuilt on measured data |
| This week | **Do not carry short vol across the reopen, and treat Tue 09-08 as an attribution sink** | High | VIX is up on the Labor Day reopen **27/33 (82%)**, median **+0.680** vs **+0.240** for an ordinary weekend; the decay is marked out at the Friday close (mean ΔVIX on that Friday **−0.233**) and paid back Tuesday. Separately, 09-08 carries the 3Y note + $304B of displaced bills + two calendar days of unpriced weekend news at once | VIX closing at or below its **2026-09-04** close of **14.53** on **2026-09-08**. Registered as **FT-labor-day-market-closure-2026-09-07-1** |
| This month | **Do not build a supply-stress thesis on the compression — it has no measured footprint** | Medium | Across the 5 prior compressed Septembers the 10Y/3Y/30Y excess bid-to-cover is **+0.183 / −0.024 / +0.126** against **+0.031 / −0.003 / +0.036** in normal Septembers — never worse, and the 10Y edge is 2009–2010 alone. n=5; the honest reading is "no effect detected," not "an advantage" | The **2026-09-09** 10Y reopening printing bid-to-cover **below 2.35** (trailing-12 mean 2.451, sd 0.098, min 2.30) — the first compressed instance to show the degradation the thesis predicts. Registered as **FT-labor-day-market-closure-2026-09-07-2** |
| This quarter | **Watch the promotion and the recurrence, not the tape** | Medium | The date is quadruple-sourced (NYSE, SIFMA, 5 U.S.C. 6103, and Treasury's own Monday→Tuesday bill shift) and still `estimate` purely because the prefix taxonomy has no slot for an exchange calendar. The structure returns on the same rule — Labor Day on Sep 6 or 7 — next in **2031** and **2032** | A `NYSE:`-class prefix added to the source taxonomy before **2026-12-31** — the entry promotes to `confirmed` and this call retires |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never on the date itself.** No entry, exit or hedge keys to 2026-09-07: it is a closed session,
  and the entry is `estimate`, which licenses nothing regardless.
- **The trap, stated so it is not re-derived as an opportunity:** implied vol is marked down into
  Friday **2026-09-04** and rebounds Tuesday **2026-09-08** (82%, n=33). Short vol carried across
  the gap collects the already-priced decay and pays the rebound.
- **Size the rebound claim to what it actually measures:** an ordinary weekend at VIX<15 already
  reopens higher **68%** of the time vs **50%** for any session. Most of the effect is the weekend.
- **Attribution guard for Tue 2026-09-08** — a move that day has a three-day-weekend explanation, a
  $304B-single-session-supply explanation and a 3Y-auction explanation before it has any one of them.
- **No cross-asset schedule asymmetry.** SIFMA recommends a **full** fixed-income close on 09-07
  with no flanking early close; equities and bonds shut and reopen together.
- **The offset nobody counts:** Treasury is *buying back* inside the same compressed week
  (`treasury-buyback-increase-2026-09-09`, `treasury-buyback-10y20y-2026-09-10`, both tracked) —
  gross supply is not net supply, and the compression argument ignores this side entirely.

## Initial research

### The question

The calendar entry was minted during the `treasury-10y-note-2026-09-09` adjacency sweep on a
three-part structural claim: the holiday removes the week's spare session, so (a) Tuesday 09-08 is
the *only* pre-auction demand read before the 10Y reopening, (b) that one session absorbs ~$304B of
displaced bill supply on top of the 3Y note, and (c) two calendar days of news price for the first
time into the same compressed session. Is any of that measurable, and does a day the market is shut
earn a research row at all?

**One-line verdict:** the arithmetic is right and the *consequence* is wrong — the compression
**relocates** risk into the reopen session rather than creating any, so the supply-stress reading
the entry implies is unsupported across its own five prior instances, while the one real,
mechanism-backed finding (an outsized Tuesday for rates, and a pre-marked/rebounding vol gap) sits
on the other side of the ledger entirely.

### Method

Macro / market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — no
symbol-keyed instrument applies (`symbols: []`). Nothing in the seeding note was taken on faith;
every count was recomputed and every prior instance was measured rather than recalled.

- **Treasury auction data, primary:** `api.fiscaldata.treasury.gov` `auctions_query` and
  `upcoming_auctions`, fetched direct 2026-09-06 (HTTP 200). Used for the 09-08 → 09-10 slate, for
  every September 3Y/10Y/30Y auction 2009 → 2025 with bid-to-cover and bidder allotment, and for
  the single-day offering-total distribution (728 auction days, 2023-01-01 → 2026-09-04).
- **Yahoo split/dividend-adjusted daily bars** via this repo's `scripts/research/market-data.mjs`
  (**instrument cache busted first** per the process doc): `SPY` 8,458 bars 1993-01-29 → 2026-09-04,
  `^VIX` 9,238 bars, `^GSPC` 9,237, `^TNX` 9,206. Every long-weekend and coupon-week statistic below
  is computed from those bars, never recalled.
- **Computed, not sourced:** all Labor Day dates 1990–2026 by first-Monday arithmetic; all week and
  session counts.
- **Re-grepped this session:** `docs/plans/trade-playbooks.md` and
  `docs/research/multi-symbol-sweep.md` for holiday/closure keying.
- **Web, aggregator-sourced and labelled as such:** September IG issuance expectations and the
  post-print FOMC odds (leg 7). No primary was obtained for either.
- **Not re-fetched, and therefore inherited rather than verified:** the NYSE holiday-table and SIFMA
  reads in the calendar entry's own `source` field, both of which sibling closure ledgers fetched
  independently within the last 48 hours.

### Conviction legs, tested

1. **The 09-08 slate is exactly as filed — SUPPORTED, re-read from the primary API.** Tuesday
   2026-09-08 carries 13-week `912797VG9` **$92B**, 26-week `912797WK9` **$79B**, 6-week
   `912797UL9` **$75B** and the 3-Year note `91282CRL7` **$58B** = **$304B**, all issuing 09-10 or
   09-15. Wednesday 09-09 adds the 17-week bill and the 10Y reopening `91282CRF0` **$39B**;
   Thursday 09-10 adds 4-week/8-week bills and the 30Y reopening `912810UW6` **$22B**. The
   Monday→Tuesday shift is independently visible in the 13-week series: ten consecutive Monday
   auctions through 2026-08-31, then 2026-09-08, a Tuesday. Treasury moved the slate because the
   market is shut — a fully primary confirmation of the closure that depends on no holiday calendar.

2. **$304B in one session is genuinely large — SUPPORTED, and quantified rather than asserted.**
   Against every auction day 2023-01-01 → 2026-09-04 (n=728): median **$134B**, p90 **$210B**,
   p95 **$232B**, max **$335B**. Only **6 days (0.8%)** sat at or above $304B. So the seeding
   note's headline number is not rhetorical — it is a top-percentile single session.

3. **But the structure is NOT rare — REFUTED as a novelty claim.** The mid-month coupon block lands
   inside the Labor Day week exactly when Labor Day falls on Sep 6 or 7. Across the 18 Septembers
   since the 3Y went monthly (2009 → 2026), that is **6: 2009, 2010, 2015, 2020, 2021, 2026** — a
   one-in-three structure, not an anomaly. It recurs next in **2031** and **2032**. Any thesis built
   on it therefore has five scored prior instances and no excuse for being untested.

4. **Compression does not degrade auction demand — REFUTED, the load-bearing find.** Measuring each
   September auction's bid-to-cover as an **excess over its own trailing-12 same-tenor auctions**
   (so era and size are controlled, not ignored):

   | Tenor | Compressed Septembers | Normal Septembers |
   |---|---|---|
   | 10Y | **+0.183** (n=5) | +0.031 (n=12) |
   | 3Y | −0.024 (n=4) | −0.003 (n=12) |
   | 30Y | **+0.126** (n=4) | +0.036 (n=12) |

   Never worse, in any tenor. And the 10Y gap is **entirely 2009 (+0.394) and 2010 (+0.369)**, the
   post-GFC flight-to-quality years — excluding them leaves **+0.050 vs +0.031**, indistinguishable.
   Indirect-bidder share tells the same story (compressed 10Y +10.3pp vs +4.6pp excess, again 2009
   -driven). **The honest statement is "no effect detected at n=5," not "compression helps."** What
   it does rule out is the reading the calendar note invites — that stacking supply into one session
   strains the block's own demand.

5. **The compressed week carries LESS net rates risk, not more — REFUTED.** Measuring the coupon
   week itself (prior close → Friday close) across 2009–2025:

   | | n | mean SPY | mean net Δ10Y | mean \|net Δ10Y\| | mean \|daily SPY\| |
   |---|---|---|---|---|---|
   | Compressed (4 sessions) | 5 | +0.23% | +0.2bp | **6.3bp** | 0.925% |
   | Normal (5 sessions) | 12 | +1.11% | +9.7bp | **11.8bp** | 0.630% |

   The equity realized-vol column looks like the opposite until it is decomposed: it is carried by
   **2020 (1.62%, COVID-era) and 2015 (1.21%, post-devaluation)**. The other three compressed years
   average **0.60%**, sitting on top of the 0.630% normal-week figure. So that column is era, not
   structure, and is reported as such rather than as a finding.

6. **The reopen session itself IS outsized for rates — SUPPORTED, and this is what actually
   survives.** The Friday-close → Tuesday-close move in the 10Y yield across all 33 Labor Days
   1993–2025: mean **|Δ| 6.50bp**, median **5.40bp**, against **3.77bp / 2.80bp** for an ordinary
   Friday→Monday (n=1,650) and **4.34bp / 3.40bp** for any session (n=8,437). That is **1.7×** an
   ordinary weekend. Direction is a coin flip (19 up / 33, mean signed +1.19bp) — this is a
   magnitude finding, not a directional one, and legs 4 and 5 say where the magnitude comes from:
   relocation into the reopen, not extra risk over the week.

7. **The vol gap is pre-marked and rebounds — SUPPORTED on the Labor Day cut, with the sibling's
   framing corrected.** Friday→next-session, SPY/VIX bars 1993 → 2026-09-04:

   | Friday → next session | n | med \|open gap\| | med \|Fri→close\| | med ΔVIX | VIX up on reopen | mean ΔVIX on the Friday |
   |---|---|---|---|---|---|---|
   | Ordinary weekend (→ Mon) | 1,529 | 0.273% | 0.503% | +0.240 | **61%** | −0.183 |
   | Any Monday holiday (→ Tue) | 161 | 0.354% | 0.646% | +0.590 | **75%** | −0.272 |
   | **Labor Day only** | 33 | 0.319% | 0.674% | **+0.680** | **82% (27/33)** | −0.233 |
   | Monday holiday, non-Labor | 128 | 0.363% | 0.633% | +0.575 | 73% | −0.282 |

   Labor Day is the strongest cohort on the rebound metric, but 82% vs 73% at n=33 vs 128 is inside
   noise and is **not** claimed as a Labor-Day-specific effect. **The correction this session adds,
   which the [presidents-day sibling](presidents-day-market-closure-2027-02-15.md) could not make
   because it lacked the control:** conditioned on Friday VIX < 15 (today's regime — 14.53), an
   **ordinary** weekend already reopens higher **68% (353/521)** of the time, against **50%
   (1,492/2,956)** for any session at VIX<15. Monday holidays give **82% (53/65)**, Labor Days
   **91% (10/11)**. So the *weekend* carries roughly 18pp of the effect and the extra holiday day
   adds ~14pp — the sibling's holiday-vs-ordinary-weekend comparison was measuring the smaller half.

8. **A fourth compression channel the seeding note did not name — recorded, aggregator-sourced.**
   The week after Labor Day is conventionally the year's heaviest US investment-grade issuance
   window ("little, if any, activity in late August before a fresh burst … after the Labor Day
   holiday"), with September 2026 expectations quoted in a **$175–250B** range against a
   record ~$1.4tn YTD. If true, corporate and Treasury supply land in the same four sessions. **No
   primary was obtained** — this is search-aggregated commentary and is banked as a hypothesis for
   the close-out to check, not as evidence for anything above.

9. **Nothing in the house system is calendar-keyed — SUPPORTED, re-verified not inherited.**
   `grep -icE 'holiday|labor day|closure|half-day|early close'` over `docs/plans/trade-playbooks.md`
   and `docs/research/multi-symbol-sweep.md` returns **0 and 0**, run this session. No playbook can
   fire on this date in either direction.

10. **The corridor is the densest on the tracked calendar — SUPPORTED, and it is the reason every
    call above is a refusal.** **29 other tracked events** sit within ±5 days of 2026-09-07,
    including `jobs-2026-09-04` (printed), `ism-services-2026-09-03`, the full coupon block, ECB on
    09-10, PPI 09-10, **CPI 09-11**, and the 09-05 → 09-17 FOMC blackout enclosing all of it. Every
    one of them is a better explanation for any move in this window than a closed Monday.

### What plays the conditions support

None. A closed session cannot be traded, `symbols` is empty, impact is `low`, and the date is
`estimate`. The supported outputs are the six lines in the signals list — chiefly the short-vol
carry trap, the correctly-sized version of it (the weekend does most of the work), the Tuesday
attribution guard, and the buyback offset the compression argument omits.

### Honest limits

- **n=5 is not a sample.** Legs 4 and 5 measure five prior compressed Septembers. They are
  sufficient to say *no degradation has been observed* and insufficient to say *compression is
  benign*. Both are stated that way above, and neither is promoted to a mechanism.
- **The compressed/normal cohorts are era-confounded by construction.** 2009, 2010, 2015, 2020 and
  2021 are a specific run of years; the trailing-12 excess controls for auction-size and regime
  drift but not for everything. Leg 4 names the 2009–2010 dependence explicitly rather than
  reporting the headline number alone.
- **^VIX is an index, not a tradeable.** Every vol figure is spot-VIX close-to-close. It supports
  "implied vol is pre-marked and rebounds"; it prices no option, spread or futures roll, and no
  such number is asserted.
- **^TNX is a yield proxy series, not the cash 10Y.** Leg 6's basis-point figures are good for a
  relative comparison across 33 identically-constructed windows; they are not an execution price.
- **Leg 8 has no primary.** IG issuance is the one leg resting on search aggregation, and it is
  labelled rather than folded into the argument.
- **The jobs print's own numbers are in dispute across aggregators** — the sibling
  `meta-connect-2026-09-23` ledger recorded **+162k vs +53k consensus** on 09-04, while this
  session's reads returned **~100k vs ~56k**. The direction (a beat, hike odds up from ~50% to
  ~58–65% for 09-16) is consistent; the level is not, and no figure is asserted here.
- **The event is `estimate`,** as are 3Y 09-08, ECB 09-10 and both buyback entries in the same
  corridor. Estimates widen caution and license nothing.

## Stance & kill switches

**Stance (2026-09-06):** stand aside, permanently and structurally — this row exists to split a
correct arithmetic claim from an incorrect consequence, not to hold a view. Concretely: (a) the
supply number is real and top-percentile (**$304B**, 6 of 728 auction days above it since 2023), but
**the compression has no measured footprint on the coupon block's demand** — across its five prior
instances the 10Y/3Y/30Y excess bid-to-cover is never worse than a normal September, and the
compressed week's net rates risk is *smaller* (6.3bp vs 11.8bp). (b) The structure is **not rare**:
it recurs whenever Labor Day falls on Sep 6 or 7, **6 of 18 years**, next in 2031. (c) What is real
is **relocation** — the Tuesday reopen is a 1.7× rates session (6.50bp vs 3.77bp, n=33) and implied
vol is marked down into the holiday Friday and rebounds 82% of the time, so short vol carried across
the gap is a cost. (d) **That rebound is mostly a weekend effect, not a holiday effect** — 68% of
ordinary weekends at VIX<15 already reopen higher against 50% of all sessions — and the sibling
ledger's framing is corrected accordingly. Every statement carries the event's **`estimate`** label.

**Kill switches:**

- **The vol rebound fails to appear** — VIX closes at or below its 2026-09-04 close of **14.53** on
  Tuesday **2026-09-08**. Leg 7 loses its live instance and the headline caution weakens to a
  historical base rate. Registered as **FT-labor-day-market-closure-2026-09-07-1**, score by
  2026-09-09.
- **The 10Y reopening shows the degradation the compression thesis predicts** — bid-to-cover on
  **2026-09-09** below **2.35** (trailing-12 mean 2.451, sd 0.098, min 2.30). Leg 4's "no effect
  detected" acquires its first counter-instance and this stance is re-argued, not patched.
  Registered as **FT-labor-day-market-closure-2026-09-07-2**, score by 2026-09-10.
- **A house playbook that keys on holiday-adjacent sessions is written and back-tested** — leg 9
  goes stale and the stand-aside is re-argued on measured data rather than on absence.
- **A `NYSE:`-class prefix is added to the source taxonomy** — the entry promotes to `confirmed`
  and the "This quarter" call retires.
- **Treasury re-announces the 09-08 slate** (size change, postponement, or a CMB added) — legs 1
  and 2 re-date and the $304B figure must be recomputed before it is quoted again.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-06 | 1 | **Initial research.** Seeding thesis split: arithmetic SUPPORTED, consequence REFUTED. Slate re-read from `fiscaldata` (09-08 = 13W $92B + 26W $79B + 6W $75B + 3Y $58B = **$304B**, top **0.8%** of 728 auction days since 2023); the Monday→Tuesday bill shift is itself a primary confirmation of the closure. **Structure is 1-in-3, not rare** — compressed whenever Labor Day ≥ Sep 6: 2009/2010/2015/2020/2021/2026, next 2031. **No demand degradation** in the 5 priors — September excess bid-to-cover vs trailing-12 runs **10Y +0.183 / 3Y −0.024 / 30Y +0.126** (compressed) vs **+0.031 / −0.003 / +0.036** (normal), and the 10Y edge is 2009–2010 alone (+0.050 ex-those). Compressed week carries **less** net rates risk (mean \|net Δ10Y\| **6.3 vs 11.8bp**); its higher equity RV is 2020+2015, the other three average 0.60% vs 0.630%. **What survives is relocation:** Tue-after-Labor-Day mean \|Δ10Y\| **6.50bp vs 3.77bp** ordinary Fri→Mon (n=33, 1.7×); VIX up on reopen **27/33 (82%)**, median **+0.680 vs +0.240**. **Sibling correction:** at VIX<15 an *ordinary* weekend already reopens higher **68%** vs **50%** all sessions — the weekend does most of the work, the holiday adds ~14pp. Adjacency — peers: n/a (`symbols: []`); macro: Aug jobs beat 09-04 (level disputed across aggregators, +162k vs ~100k), 09-16 hike odds ~58–65%, PPI 09-10 + **CPI 09-11** in the same 4 sessions, FOMC blackout 09-05→09-17; VIX **14.53** (09-04 close), SPY **770.19**, ^TNX **4.78**; geopolitical: OPEC+ 09-06, Brent ~$95, Hormuz — no channel specific to a closed US session; tape: **29** tracked ids within ±5d, the densest corridor on the calendar, incl. two Treasury **buybacks** (09-09, 09-10) the compression argument omits. IG issuance surge banked as aggregator-only (leg 8). Playbook grep **0/0**. **No new dated adjacent event found** — no calendar proposal; ORCL/ADBE 09-10 are earnings and excluded by table rule. | Initial stance set: **stand aside** (structural row only). Registers **FT-…-1** and **FT-…-2**. | 2026-09-08 (close-out) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new `src/domain/market-events/<id>.json`
(`status: "estimate"`) in the same PR. Close-out fills `## Outcome` below from re-run instrument
data (cache busted first), never from memory — after which this doc goes quiet.
