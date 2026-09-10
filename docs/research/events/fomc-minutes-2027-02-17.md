# FOMC minutes (January 26–27 2027 meeting) — fomc-minutes-2027-02-17

**Kind:** macro-print · **Date:** 2027-02-17 (estimate, EST: federalreserve.gov/monetarypolicy/fomccalendars.htm re-fetched direct 2026-09-10 — HTTP 200, 164,831 bytes, stamp *"Last Update: August 19, 2026"* — states the three-weeks-after-the-decision convention verbatim and its 2027 panel opens *"January 26-27"*; 2027-01-27 is a Wednesday and +21 days = Wednesday 2027-02-17. Held at `estimate` by the same page's *"Each meeting date is tentative until confirmed at the meeting immediately preceding it"* and by its empty 2027 Minutes cells) · **Impact:** medium
**Last assessed:** 2026-09-10
<!-- probe-ref: {"symbols":{},"vix":16.46,"daysBand":"medium:31+","adjacentIds":["survey-of-professional-forecasters-q1-2027-02-12","presidents-day-market-closure-2027-02-15","washingtons-birthday-market-closure-2027-02-15","uk-labour-market-2027-02-16","uk-cpi-2027-02-17","vix-expiration-2027-02-17","tic-monthly-2027-02-18","japan-cpi-2027-02-19","opex-2027-02-19"],"screenStreak":0,"blocked":[{"url":"https://cdn.cboe.com/resources/indices/VRO_History.csv","status":"403","at":"2026-09-10"},{"url":"https://cdn.cboe.com/data/us/futures/market_statistics/final_settlement_prices/VX.csv","status":"403","at":"2026-09-10"},{"url":"https://www.federalreserve.gov/newsevents/2027-february.htm","status":"404","at":"2026-09-10"}]} -->

## At a glance

**TL;DR.** **Read it, do not trade it — and this lane's job was to answer a question a sibling lane could only
record.** The date is safe for the structural reason [`2028-02-16`](fomc-minutes-2028-02-16.md) established:
a January-class release is a Wednesday, the only Board closure it can approach (Washington's Birthday) is
always a Monday, so the displacement gap is quantised to **{+2, −5}** and can never reach the band where
displacements actually happen. **2027-02-17 is a +2 case** — the modal 15-of-18 configuration — with
**2010-02-17, 2016-02-17 and 2021-02-17 as exact date-for-date precedents**. What is new here is the tape
question the [`uk-cpi-2027-02-17`](uk-cpi-2027-02-17.md) lane flagged and could not test:
**`FT-vix-expiration-2027-02-17-2` uses this session as the non-FOMC control** for two sibling FOMC-morning
tests, comparing the ~09:00 ET VRO to the 16:00 ET cash close — and a 14:00 minutes release lands between
them. Measured here on **50 minutes-on-settlement sessions against 185 settlement sessions without**, the
worry **has the sign backwards**: minutes days move *less* open-to-close, not more (mean |path| **3.925% vs
5.574%** of VIX, P = 0.108). A second, opposite bias does show up in the point estimate — a lower close
(**−0.545% vs +0.147%** residualised, P = 0.506), which would push the control toward the **pass** that
*deflates* the siblings' own story. **Neither separates, and neither can:** the minimum detectable effect at
80% power is **2.879% of VIX, 4.2× the observed gap.** The honest verdict is that the control is
**unverified, not cleared** — the row belongs to the vix-expiration lane and this lane does not edit it.
Date is **`estimate`**; nothing here licenses an entry.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D−160) | **Stand aside** — nothing to trade | High | `symbols: []`, no issuer, no rates-keyed house playbook, and the meeting it minutes has not happened | Nothing at this distance; the earliest input that can move the date is the **2026-12-09** meeting ratifying January 26–27, 2027 |
| This week | **No action here; this week's load is elsewhere on the board** | High | A D−160 macro-print with no symbol cannot compete with the September CPI/FOMC block already dated inside a week | A Board announcement before **2026-09-30** changing the 2027 January meeting dates or the three-weeks publication convention — the date rule stops describing 2027-02-17 and this document is rebuilt |
| This month | **Bank the +2 classification, and read it as inherited structure rather than a new finding** | High | Washington's Birthday 2027 is **Monday February 15** on `k8.htm` plus 5 U.S.C. 6103; a Wednesday release two days later cannot enter the `\|gap\| ≤ 1` displacement band | A January-class minutes release, in any year, displaced from D+21 — the structural-immunity claim meets its first counterexample. Registered **FT-fomc-minutes-2027-02-17-1**, score by **2027-02-18** |
| This quarter | **Do not treat the sibling's control as contaminated, and do not treat it as clean — it is untestable at daily resolution** | Medium | The feared direction is *refuted in sign* (minutes-settlement days are calmer, 72.0% inside band vs 48.6%), a second direction is *unresolved*, and the MDE is 4.2× the largest effect measured | **2027-02-17**'s residualised VIX open→close landing outside **±2.879%** — the session is distinguishable from an ordinary settlement day after all and the "undetectable" reading fails. Registered **FT-fomc-minutes-2027-02-17-2**, score by **2027-02-18** |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit, hedge or size is keyed to a minutes release; the date is `estimate` and `estimate` widens caution, never licenses an entry.
- **Do not quote "VIX falls on minutes days" here.** 2027-02-17 is a *settlement* Wednesday, and the family's own split puts the on-settlement half at **50.0% VIX-down** — exactly the universe base rate.
- **Do not quote the January class's calm either.** Matched on window *and* settlement status it is a perfect null (VIX-down P = 1.000, mean |S&P| P = 0.984 against 15 comparable sessions) — the calm is mid-February, not the minutes.
- **The collision is sequential, not simultaneous.** The VIX SOQ prints at the **open**; the minutes drop at **14:00 ET**. Any story with settlement flow reacting to the minutes has the clock backwards.
- **If you cite `FT-vix-expiration-2027-02-17-2`'s result, cite this measurement with it.** A pass there is consistent with a genuine control *and* with a contaminated one; daily bars cannot separate the two.
- **The positioning date in this corridor is 2027-02-19 (est), not 2027-02-17** — the February monthly expiration, two sessions later, and not a quarterly.
- **Read it for exactly three things** — the January 26–27 vote split and dissent count; the **2027 voter rotation** it seats (New York, Chicago, Richmond, Atlanta, San Francisco, per [`fomc-2027-01-27`](fomc-2027-01-27.md)); and the annual reaffirmation of the **Statement on Longer-Run Goals**, which the parent ledger already measured as worth nothing on the tape.
- **Watch (dated)** — FOMC + annual organizational meeting **2027-01-26/27** (est) · Washington's Birthday closure **2027-02-15** (est) · **these minutes 2027-02-17** (est) · VIX February settlement **2027-02-17** (**confirmed**) · February monthly expiration **2027-02-19** (est).
- **Promotion trigger** — the **2026-12-09** meeting ratifying a 2027 calendar whose January meeting is January 26–27. Not a better fetch; the status is a rule, not a sourcing gap.

## Initial research

### The question, plainly

The minutes of the January 26–27, 2027 FOMC should publish at 14:00 ET on **2027-02-17**. Ten sibling
ledgers have settled the family's posture — *read it, do not trade it* — and the last four measured the index
and implied vol against thousands of sessions and refused both. Repeating that is waste, so this document
does it once, briefly, as replication.

One thing is genuinely open, and it is not about this release's own tape. The
[`uk-cpi-2027-02-17`](uk-cpi-2027-02-17.md) lane, which proposed this entry on 2026-09-09, closed its row
with a consequence it recorded and explicitly could not fix:

> `FT-vix-expiration-2027-02-17-2`'s **control** rests on "carries no FOMC" and compares the ~09:00 VRO to
> the 16:00 cash close — the 14:00 minutes fall between them.

That forward test exists to be the **missing control cell** for two sibling FOMC-morning tests
(`FT-vix-expiration-2026-09-16-1`, `FT-vix-expiration-2027-03-17-1`), both of which predict the VRO prints
above the same-day cash close *because* the FOMC-day vol decline lands after the 09:00 settlement. Without a
non-FOMC control, a pass on either is equally consistent with an ordinary settlement-morning artifact. So:
**does a 14:00 minutes release make 2027-02-17 unfit as that control?** Nobody has measured it. This lane owns
the release, so this lane measures it.

**One-line verdict:** the date is inherited-safe (**a +2 January-class release, immune by weekday parity, with
three exact date twins**), and the control question resolves as a **double refusal** — the feared
contamination is *backwards in sign*, an opposite bias is *unresolved*, and at an MDE of **2.879% of VIX
against a 0.692% observed gap** daily bars cannot settle either. Date `estimate`; no directional call at
D−160.

### Method

Macro-print mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — `symbols: []`, so no
symbol-keyed instrument applies; `earnings-cycle.mjs` / `intraday-edges.mjs` have no macro mode and were not
run. Its analog — *re-source, don't recall* — is honoured: every claim the proposal made was re-derived from
primaries rather than inherited.

**Primaries fetched raw and parsed by machine today (2026-09-10):**
`federalreserve.gov/monetarypolicy/fomccalendars.htm` (HTTP 200, **164,831 bytes**, stamp *"Last Update:
August 19, 2026"*) and `fomchistorical2007.htm` … `fomchistorical2020.htm` (fourteen pages, all HTTP 200);
`federalreserve.gov/aboutthefed/k8.htm` (HTTP 200, **82,205 bytes**, stamp *"Last Update: July 8, 2026"*);
CBOE `VIX_History.csv` (HTTP 200, 472,462 bytes, to 2026-09-09) and `SPX_History.csv` (HTTP 200, 292,642
bytes). **Three fetches failed and are recorded in `probe-ref.blocked` rather than substituted:**
`cdn.cboe.com/resources/indices/VRO_History.csv` (**403**), `cdn.cboe.com/data/us/futures/market_statistics/final_settlement_prices/VX.csv`
(**403**) and `federalreserve.gov/newsevents/2027-february.htm` (**404** — the month page does not exist yet).
The first two are why leg 4 measures a **proxy** and says so.

**The release census is this session's own parse, and it is a fifth independent construction.** Each page was
split into meeting blocks — the live page on `row fomc-meeting` divs, the historical pages on
`panel panel-default` divs — each block truncated at the next block boundary, and each block's own minutes
link paired to the `(Released …)` string *inside that same block*. One trap is banked for the next lane, and
it cost this session a run: the newer historical pages carry `<div class="panel panel-default panel-padded">`,
so a splitter anchored on `panel panel-default"` **with the closing quote** matches zero blocks on 2012–2020
and silently returns **77** releases instead of 157 — a number that looks like a plausible census rather than
a broken one, exactly the failure mode [`2028-02-16`](fomc-minutes-2028-02-16.md) banked for a different
regex.

**Price work is this session's own.** The universe is the **4,950** sessions 2007-01-04 → 2026-09-09 carrying
both series, anchored at **SPX 7,636.36 / VIX 16.46** (2026-09-09 closes). Permutations are 100,000
resamples. Genre model: [`nvda-aug-2026-print.md`](../nvda-aug-2026-print.md).

### Conviction legs, tested

1. **The family's D+21 census replicates exactly — 157 releases, 143 at D+21, fourteen exceptions.**
   SUPPORTED, from a fifth independent construction. The lag histogram is **D+21 ×143 / D+20 ×8 / D+22 ×3 /
   D+23 ×1 / D+19 ×1**, decisions running 2007-01-31 → 2026-07-29, and the fourteen exceptions by *meeting*
   month are **November ×6, December ×4, June ×2, October ×1** plus the **2020-03-15 unscheduled** meeting at
   D+24 — matching the [10-06](fomc-minutes-2027-10-06.md), [11-17](fomc-minutes-2027-11-17.md),
   [12-29](fomc-minutes-2027-12-29.md) and [2028-02-16](fomc-minutes-2028-02-16.md) lanes instance for
   instance. The page states the convention verbatim; 2027-01-27 is a Wednesday (computed) and +21 is
   Wednesday **2027-02-17**.

2. **The January class replicates at 18 of 18, and 2027-02-17 is a `+2` case with three exact date twins.**
   SUPPORTED, inherited rather than newly found. Keyed by **decision day** — this calendar's own key — the
   class is 18 meetings 2007–2026, all 18 at exactly D+21, every one Wednesday-to-Wednesday. Washington's
   Birthday 2027 is **Monday February 15** on two independent grounds: `k8.htm`'s own 2026–2030 row reads
   *"Washington's Birthday | February 16 | **February 15** | February 21 | February 19 | February 18"*, and
   5 U.S.C. 6103 fixes it on the third Monday. The gap from 2027-02-17 is **+2**, the modal configuration —
   observed **+2 fifteen times** and **−5 three times** (2011, 2012, 2022) across the class and nothing else.

   | Gap to Washington's Birthday | n (January class) | Displaced | 12-29's rule says |
   |---|---|---|---|
   | 0 or ±1 | **0 — structurally impossible** | — | 4 of 5 displaced |
   | **+2** (release the Wednesday after) | 15 — **incl. 2027-02-17** | **0** | 0 of 14 displaced |
   | **−5** (release the Wednesday before) | 3 | **0** | 0 of 14 displaced |

   **Three releases in the record land on February 17 itself, from a January 27 decision, and all three were
   VIX settlement days: 2010-02-17, 2016-02-17 and 2021-02-17.** 2027-02-17 is the fourth instance of the
   same configuration, not an extrapolation into a new cell. This leg claims nothing
   [`2028-02-16`](fomc-minutes-2028-02-16.md) did not already establish; it is here because the
   classification is what makes the date safe, and a document that asserted the date without naming its cell
   would be leaning on a record rather than a mechanism.

3. **The family's settlement split and the January class's null both replicate — and both refuse this
   release.** SUPPORTED as replication. Rebuilt from this session's own census and its own settlement rule,
   the collision count lands on the same **50 of 157**:

   | Set | n | Mean \|S&P\| | S&P up | **VIX down** | Mean residual ΔVIX |
   |---|---|---|---|---|---|
   | Releases **on** settlement | **50** | 0.676% | 46.0% | **50.0%** | −0.091 |
   | Releases **off** settlement | **107** | 0.780% | 59.8% | **71.0%** | −0.194 |
   | All releases | 157 | 0.747% | 55.4% | 64.3% | −0.161 |
   | **January class** | **18** | **0.470%** | 55.6% | **72.2%** | −0.040 |
   | Feb 15–21 sessions **that are settlement days** | 15 | 0.467% | 66.7% | 66.7% | +0.178 |
   | Universe | 4,950 | 0.798% | 54.4% | 54.4% | 0.000 |

   Head to head the settlement split is **P = 0.0123**, and the on-settlement half sits *exactly* on the
   universe base rate. **2027-02-17 is in that half** — `vix-expiration-2027-02-17` is **`confirmed`** on this
   calendar (Cboe-sourced, not rule-derived, unlike 2028's), and the rule reproduces it independently
   (30 days before the third Friday of March 2027, 2027-03-19). The January class is again the family's most
   collided sub-class at **13 of 18 (72.2%) against 31.8% family-wide**, and matched on **both** the window
   (Feb 15–21, the class's own realized span, not scanned) **and** settlement status it is a perfect null:
   **VIX-down P = 1.000, mean |S&P| P = 0.984** against those 15 sessions. The residual model refits as
   `ΔVIX = 0.4219 − 1.3579·r + 0.00171·(r × VIX_prev) − 0.0185·VIX_prev` (r in percent, n = 4,950),
   reproducing the sibling lanes' coefficients to four decimals from an independent fit on one extra session.

4. **THE DELIVERABLE: the control-contamination worry is backwards in sign — and a second, opposite bias
   cannot be ruled out.** MIXED, and this is the leg the lane exists for.

   The concern, stated precisely: `FT-vix-expiration-2027-02-17-2` compares the ~09:00 ET VRO to the 16:00 ET
   VIX cash close on a settlement morning chosen *because* it "carries no FOMC". A 14:00 release sits inside
   that window. Its void clause names an FOMC decision, an unscheduled Fed statement or a BoJ decision —
   **a minutes release is none of those, so the row does not void; it just measures a different day than its
   designer specified.**

   The VRO series itself is **403 to this session** (recorded in `probe-ref.blocked`), so the comparison is
   made on the closest thing daily bars support: the **VIX cash open→close path on settlement days**,
   residualised on the same session's S&P return (`oc = −0.00292 − 4.2906·r`, n = 235 settlement sessions).

   | Settlement sessions | n | Mean open→close | Residualised mean | \|path\| | Close < open | Inside ±2.879% |
   |---|---|---|---|---|---|---|
   | **carrying a minutes release** | **50** | −0.664% | **−0.545%** | **3.925%** | 60.0% | **72.0%** |
   | **carrying none** | **185** | +0.310% | **+0.147%** | **5.574%** | 56.8% | **48.6%** |
   | (P, permutation) | | 0.466 | **0.506** | **0.108** | 0.750 | — |

   **The feared direction is refuted in sign.** The worry assumes a 14:00 release *injects* afternoon
   movement into the control window. It does the opposite in the point estimate: minutes-on-settlement days
   travel **3.925%** of VIX open-to-close against **5.574%** without, and **72.0%** of them stay inside the
   band a quiet session occupies against **48.6%**. Not significant (P = 0.108), but the sign is unambiguous
   and it is the sign that matters for the worry as stated.

   **A different bias survives, and it runs the wrong way for the siblings.** The residualised path on
   minutes days is **−0.545%** against **+0.147%** — a lower close. A lower close makes "VRO above the cash
   close" *more* likely, which makes the control more likely to **pass**, and the row itself says a pass
   means the siblings' FOMC-specific explanation is **not identified**. So the contamination, if real, does
   not merely add noise: it pushes toward the one verdict that costs the siblings their reading.

   **Neither can be settled with these data, and that is the finding.** At n = 50 against n = 185 with a
   settlement-day residual SD of **6.451%**, the minimum detectable effect at 80% power is **2.879% of VIX**
   — **4.2× the 0.692% gap actually observed**. A P of 0.506 here is not evidence of absence; it is evidence
   the instrument has no resolution. **The honest verdict is that the control is unverified, not cleared.**
   The row is [`vix-expiration-2027-02-17`](vix-expiration-2027-02-17.md)'s to re-specify — the obvious
   repair is a 09:00→13:59 window, or a second control day carrying no release — and **this lane does not
   edit another event's forward test**. It registers its own instead, as
   **FT-fomc-minutes-2027-02-17-2**.

5. **The corridor is the densest this calendar carries, and it is completely tracked — zero adjacency
   proposals.** SUPPORTED. Computed mechanically against all **1,063** tracked events and proposals as of
   this PR, the ±5-day window **2027-02-12 → 2027-02-22** returns **eight distinct events**, every one
   already on the calendar or already proposed by another lane:

   | | Event | Status |
   |---|---|---|
   | D−5 | `survey-of-professional-forecasters-q1-2027-02-12` | estimate (proposal) |
   | D−2 | `presidents-day-market-closure-2027-02-15` **and** `washingtons-birthday-market-closure-2027-02-15` | estimate ×2 — **one closure, two entries** |
   | D−1 | `uk-labour-market-2027-02-16` | estimate (proposal) |
   | **D+0** | `uk-cpi-2027-02-17` (02:00 ET) · `vix-expiration-2027-02-17` (~09:00 ET) · **these minutes (14:00 ET)** | estimate · **confirmed** · estimate |
   | D+1 | `tic-monthly-2027-02-18` | confirmed |
   | D+2 | `japan-cpi-2027-02-19` · `opex-2027-02-19` | estimate ×2 |

   Nothing dated was found untracked, so **nothing is proposed** — the correct outcome, not a shortfall. One
   near-miss is recorded rather than filed: the Board's **semiannual Monetary Policy Report**, statutorily due
   *February 20* under 12 U.S.C. 225b, would be the one February Fed communication this corridor could still
   be missing. `mpr_default.htm` (HTTP 200 after its 302) publishes **no 2027 date** — its latest is July 14,
   2026 — and the recent record scatters badly (Feb 7 2025, Mar 1 2024, Mar 3 2023), so no date can be derived
   to the standard this calendar requires. It is named here so the next pulse can file it once the Board posts
   one, not guessed at.

6. **Calendar hygiene: 2027-02-15 carries two canonical entries for one closure, still open.** SUPPORTED, and
   deliberately not fixed here. `presidents-day-market-closure-2027-02-15` and
   `washingtons-birthday-market-closure-2027-02-15` are the same NYSE closure filed twice by two lanes on
   different names. The [`uk-cpi-2027-02-17`](uk-cpi-2027-02-17.md) lane recorded it on 2026-09-09 and did not
   touch it; neither does this one, for the same reason — **a research lane never edits another event's
   canonical file** (#1449/#1717). It is restated here because leg 2's whole argument is measured against that
   closure, so a reader of *this* document meets the duplicate directly and should know it is known.

### What the conditions support (date `estimate`)

**One inherited classification, one measured double-refusal, no direction, no size, no level.**

- **Calendar the 14:00 ET release on 2027-02-17 as reading, not as an event**, on the +2 structural
  classification rather than on a record.
- **Do not carry any minutes-day statistic into this release, in either direction.** The family's headline VIX
  number belongs to the *off*-settlement half and this release is on-settlement; the January class's calm
  belongs to mid-February and is a null once matched.
- **Cite the control measurement with its power, or not at all.** "P = 0.506, no contamination" is the wrong
  summary of leg 4 and would be the easy one to quote.
- **Leave `FT-vix-expiration-2027-02-17-2` alone and route the finding to its owner.** The repair is that
  lane's call; the measurement is this lane's contribution to it.

Explicitly **not** claimed: that the control *is* contaminated (the feared sign is refuted); that it is
*clean* (the MDE forbids that too); that the VIX cash open is a substitute for the VRO (it is a proxy, and
leg 4 says so); that the settlement mechanism is confirmed on the January sub-class
([`2028-02-16`](fomc-minutes-2028-02-16.md) already reported that as underpowered and this lane did not
re-run it); that a non-SEP meeting's minutes differ from any other's.

### Honest limits

**The proxy is the biggest one.** Leg 4 measures the VIX **cash** open→close path, not the VRO-to-close
relation the sibling row will actually be scored on. The VRO is an auction-derived print from a single SPX
series and is not the VIX cash open; the two are related but not interchangeable, and the series that would
close the gap is **403 to this session**. Leg 4's result therefore bounds *the afternoon's behaviour*, which
is the mechanism at issue, without measuring the statistic at issue. **The measurement window is wrong for
every leg** — the minutes drop at 14:00 ET and legs 1–3 are close-to-close, so ~4.5 of 6.5 hours precede the
release; every sibling shares this. **Leg 3's matched cell is n = 15** and the January on-settlement half is
n = 13, small enough that "perfect null" means "cannot distinguish". **Leg 2 is inherited, not independent** —
its parity argument rests on [12-29](fomc-minutes-2027-12-29.md)'s empirical premise that displacement is a
Board-closure phenomenon at all, which rests on 19 December meetings and 4 displacements; if that premise is
wrong the immunity claim is vacuous rather than false. **The 14:00 ET release time is convention**, not
sourced for this release — the Board's February 2027 month page 404s. And the whole document rests on a
meeting — **2027-01-26/27** — that is tentative by the Board's own rule, with the **2026-12-09** meeting as
its ratifying session.

## Stance & kill switches

**Stance (date `estimate`):** **read it, do not trade it — and the one open question the proposal raised now
has a measured answer that is a refusal in both directions.** The D+21 census replicates on a fifth
independent construction (157 releases, 143 at D+21, exceptions D+19→D+24, meeting-month Nov ×6 / Dec ×4 /
Jun ×2 / Oct ×1 plus the 2020-03-15 unscheduled). The January class is **18 of 18 at D+21**, and 2027-02-17
is a **+2** case — Washington's Birthday 2027 is Monday February 15 on `k8.htm` and 5 U.S.C. 6103, a
Wednesday is never 0 or 1 day from a Monday, so [12-29](fomc-minutes-2027-12-29.md)'s displacement band is
structurally unreachable — with **2010-02-17, 2016-02-17 and 2021-02-17 as exact date twins**, all three also
settlement days. On the tape this release is refused twice over: the family's settlement split replicates to
the release count (50 on-settlement at 50.0% VIX-down, 107 off at 71.0%, split P = 0.0123) and **this release
is in the flat half**, while the January class matched on window *and* settlement is a perfect null
(VIX-down P = 1.000, mean |S&P| P = 0.984, n = 15). **The lane's own finding is the control question.**
`FT-vix-expiration-2027-02-17-2` uses this session as the non-FOMC control for two sibling FOMC-morning
tests, and the 14:00 release lands inside its 09:00→16:00 window. Measured on **50 minutes-on-settlement
sessions vs 185 without**, the feared direction is **backwards in sign** — minutes days travel **3.925%** of
VIX open-to-close vs **5.574%**, 72.0% inside band vs 48.6% (P = 0.108) — while a *different* bias survives in
the point estimate, a lower close (**−0.545% vs +0.147%** residualised, P = 0.506), which pushes the control
toward the **pass** that deflates the siblings' own reading. **Neither separates and neither can:** MDE at
80% power is **2.879% of VIX against a 0.692% gap**, so the control is **unverified, not cleared**. The repair
belongs to the vix-expiration lane; this lane measured it and does not edit it. No directional call, no size;
`estimate` widens caution and licenses nothing.

**Kill switches:**

- **Relevance / date kill:** the **2026-12-09** meeting confirming a 2027 calendar whose January meeting is
  not **January 26–27**, or federalreserve.gov publishing a minutes date other than **2027-02-17** for it.
  Registered **FT-fomc-minutes-2027-02-17-1**, score by **2027-02-18**.
- **Promotion trigger (the inverse):** that meeting confirming January 26–27. The entry flips `estimate` →
  `confirmed` at the next pulse with a `FED:` prefix; nothing else in the stance moves.
- **Class kill (leg 2, the inherited structural claim):** any January-class minutes release, in any year,
  displaced from D+21. The immunity claim is 18-for-18 and rests on a weekday parity, so a single
  counterexample would mean displacement is driven by something other than Board-closure proximity.
- **Contamination kill (leg 4, the sign):** **2027-02-17**'s residualised VIX open→close landing **outside
  ±2.879%** — the session *is* distinguishable from an ordinary settlement day, the "undetectable at daily
  resolution" reading fails, and the sibling's control needs re-specifying rather than merely re-reading.
  Base rates: **53.6%** of all 235 settlement sessions land inside that band, **48.6%** of those without a
  minutes release, **72.0%** of those with one, **69.2%** of the January class's 13. Registered
  **FT-fomc-minutes-2027-02-17-2**, score by **2027-02-18**.
- **Power kill (leg 4, the other half):** the VRO series becoming fetchable — Cboe's `VRO_History.csv` is
  **403** today — and a direct VRO-to-close measurement on the 50 collided sessions separating at P < 0.05.
  The proxy would have been hiding the effect the daily bars cannot see, and leg 4's "unverified" verdict
  would resolve to "contaminated" rather than staying open.
- **Pattern kill (leg 3):** **2027-02-17** printing an S&P close-to-close move of **≥ 1.5%**. Base rates:
  14.04% of the 4,950-session universe, 11.46% of the 157 releases, 10.00% of the 80 Feb 15–21 sessions,
  6.67% of the 15 matched sessions and **5.56%** of the January class. Registered
  **FT-fomc-minutes-2027-02-17-3**, score by **2027-02-18**.
- **Vol kill (leg 3, the other direction):** **2027-02-17**'s residualised VIX change — the day's ΔVIX minus
  the fitted value from that day's S&P return and the prior VIX close — landing at or below **−1.0 pt**. Base
  rates: 8.81% universe, 7.01% of releases, 8.75% of Feb 15–21, 6.67% matched and **11.11%** of the January
  class — the one place the class runs *above* the universe, which makes this a real falsifier rather than a
  formality. Registered **FT-fomc-minutes-2027-02-17-4**, score by **2027-02-18**.
- **Settlement kill:** Cboe moving the February 2027 VIX settlement off **2027-02-17**. Unlike
  [2028-02-16](fomc-minutes-2028-02-16.md)'s rule-derived date this one is **`confirmed`** from Cboe's own
  settlement file, so this is the least likely kill on the sheet — but legs 3 and 4 both rest on the
  collision being real.
- **Corridor kill:** any dated event landing inside **2027-02-12 → 2027-02-22** that this calendar does not
  yet carry — a real bar, since leg 5 found the corridor already complete at eight events. The named
  candidate is the Board's **semiannual Monetary Policy Report**, undated for 2027 as of today.
- **Channel kill:** a tracked name (NVDA/MRVL/AVGO/CRWV/MSFT/GOOG/META/AAPL/AMZN) moving **>3%** on a session
  the tape attributes to a January-2027 FOMC-minutes headline, at any point **2026-09-10 → 2027-02-17**. The
  `symbols: []` premise would be wrong.

**Forward tests registered:** **FT-fomc-minutes-2027-02-17-1** (the +2 structural classification holds and
the release prints 2027-02-17), **-2** (the contamination is undetectable at daily resolution — the session's
residualised open→close stays inside ±2.879%), **-3** (an ordinary mid-February session, |S&P| under 1.5%),
**-4** (no vol-specific drop, on a date where the family's own split predicts the flat half) in
[`forward-tests/fomc-minutes-2027-02-17.md`](../forward-tests/fomc-minutes-2027-02-17.md). The generic
channel claim is **not** re-registered — `FT-31` off the 11-18 sibling already owns it.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-10 | D-160 | Initial research banked (above). **Canonical `fomc-minutes-2027-02-17.json` written** after reading the sole prior proposal (`from-uk-cpi-2027-02-17`), now inert; every claim re-derived from primaries. **Leg 1 — census replicates from a FIFTH construction:** 157 releases, 143 at D+21, histogram D+21 x143 / D+20 x8 / D+22 x3 / D+23 x1 / D+19 x1, exceptions by meeting month Nov x6 / Dec x4 / Jun x2 / Oct x1 + the 2020-03-15 unscheduled at D+24. **Parse trap banked:** the newer historical pages use `panel panel-default panel-padded`, so a splitter anchored on `panel panel-default"` **with the closing quote** matches zero blocks on 2012-2020 and returns **77** releases — a plausible-looking wrong answer that cost this session a run. **Leg 2 — 2027-02-17 is a `+2` January-class release, immune by the parity 2028-02-16 established.** Class is 18 of 18 at D+21, all Wed->Wed; Washington's Birthday 2027 = **Monday 02-15** on `k8.htm` (HTTP 200, 82,205 B, its 2026-2030 row reads "February 16 \| **February 15** \| February 21 \| February 19 \| February 18") and 5 U.S.C. 6103; gap **+2**, the modal cell (+2 x15 / -5 x3, nothing else), so 12-29's `\|gap\|<=1` band is structurally unreachable. **Three exact date twins: 2010-02-17, 2016-02-17, 2021-02-17 — all from a Jan-27 decision, all settlement days.** **Leg 3 — the settlement split and the January null both replicate.** Own census + own rule -> the same **50 of 157** collisions: on-settlement n=50 VIX-down **50.0%**, off-settlement n=107 **71.0%**, split **P=0.0123**, universe 54.4%. **This release is in the flat half** — `vix-expiration-2027-02-17` is **confirmed** on this calendar (Cboe-sourced, not rule-derived) and the rule reproduces it (30d before Fri 2027-03-19). January class 13 of 18 (72.2%) collided vs 31.8% family-wide; matched on window (Feb 15-21, own realized span, not scanned) **and** settlement status it is a perfect null: **VIX-down P=1.000, mean\|S&P\| P=0.984** vs 15 sessions. Residual model `dVIX = 0.4219 - 1.3579*r + 0.00171*r*V_prev - 0.0185*V_prev` (r in percent, n=4,950), matching the siblings to 4dp. **Leg 4 — THE DELIVERABLE: the control-contamination worry the uk-cpi lane RECORDED is now MEASURED, and refuses in both directions.** `FT-vix-expiration-2027-02-17-2` uses this session as the non-FOMC control for two sibling FOMC-morning tests (VRO ~09:00 vs cash close 16:00); the 14:00 minutes land inside that window and do **not** void the row (its clause names a decision, an unscheduled statement or a BoJ, not minutes). VRO series **403** — measured on the closest daily-bar proxy, VIX cash open->close on settlement days residualised on the same day's SPX return (`oc = -0.00292 - 4.2906*r`, n=235). **Minutes-on-settlement (n=50) vs no-minutes (n=185): mean path 3.925% vs 5.574% of VIX (P=0.108), inside a +/-2.879% band 72.0% vs 48.6%, close<open 60.0% vs 56.8% (P=0.750), residualised mean -0.545% vs +0.147% (P=0.506).** THE FEARED SIGN IS BACKWARDS — minutes days are **calmer** open-to-close, not noisier. A DIFFERENT bias survives in the point estimate — a lower close, which makes "VRO above close" more likely, i.e. pushes the control toward the **pass** the row itself reads as "the siblings' FOMC explanation is NOT identified". **Neither separates and neither can: settlement-day residual SD 6.451% -> MDE at 80% power 2.879% of VIX, 4.2x the 0.692% observed gap.** Verdict: the control is **unverified, not cleared**; the repair (a 09:00->13:59 window, or a second release-free control) is the vix-expiration lane's call and **this lane does not edit another event's forward test**. **Adjacency sweep — peers:** n/a, `symbols: []`. **Macro:** no print bearing on a D-160 rates document. **Volatility:** **VIX 16.46 / SPX 7,636.36** (2026-09-09 closes, Cboe) against the 2028-02-16 sibling's 2026-09-08 anchor of 15.72 — a **+0.74** move, inside the screen's 3-point threshold, no regime shift; probe baseline seeded with real readings. **Geopolitical:** none touching a `symbols: []` release. **Leg 5 — the corridor is the DENSEST this calendar carries and is COMPLETELY TRACKED: zero adjacency proposals.** Against all **1,063** tracked events + proposals, +/-5 (**2027-02-12 -> 2027-02-22**) returns eight distinct events, every one already filed: SPF Q1 02-12, the 02-15 closure, UK labour market 02-16, **three on 02-17** (UK CPI 02:00 ET, VIX settlement ~09:00 ET confirmed, these minutes 14:00 ET), TIC 02-18, Japan CPI + opex 02-19. One near-miss recorded not filed: the Board's **semiannual Monetary Policy Report**, statutorily due Feb 20 (12 U.S.C. 225b) — `mpr_default.htm` (HTTP 200 after 302) publishes no 2027 date, latest July 14 2026, and the recent record scatters (Feb 7 2025, Mar 1 2024, Mar 3 2023), so no date is derivable to this calendar's standard. **Leg 6 — the 2027-02-15 duplicate is restated, not fixed:** `presidents-day-market-closure-2027-02-15` and `washingtons-birthday-market-closure-2027-02-15` are one closure filed twice; the uk-cpi lane flagged it 2026-09-09 and neither lane may edit another event's canonical file. It matters here because leg 2's argument is measured against that closure. **Blocked (3):** `cdn.cboe.com/resources/indices/VRO_History.csv` **403**, `cdn.cboe.com/data/us/futures/market_statistics/final_settlement_prices/VX.csv` **403** (together the reason leg 4 is a proxy), `federalreserve.gov/newsevents/2027-february.htm` **404** (the 14:00 ET time stays convention, not sourced). **Four forward tests registered:** **-1** the +2 classification holds and the release prints 2027-02-17 (score 2027-02-18), **-2** the contamination is undetectable — residualised open->close inside +/-2.879% (base 53.6% all settlement / 48.6% no-minutes / **72.0%** minutes / 69.2% January class, score 2027-02-18), **-3** \|SPX\| under 1.5% (base 14.04% universe / 11.46% releases / **5.56%** class, score 2027-02-18), **-4** residualised dVIX above -1.0 pt (base 8.81% universe / 7.01% releases / **11.11%** class — the one measure where the class runs ABOVE the universe, score 2027-02-18). | — (stance set: **read it, do not trade it — and the proposal's one open question now has a measured answer that refuses in both directions**; the date is a **+2** January-class release, immune by weekday parity, with three exact date twins; on the tape it sits in the **flat half** of the settlement split and its class is a **perfect null** once matched on window and settlement; and the sibling control's contamination is **backwards in the feared sign, unresolved in a second direction, and undetectable at daily resolution** — MDE 2.879% vs a 0.692% gap — so the control is **unverified, not cleared**, and the repair is its own lane's call; no direction, no size) | 2026-10-01 (medium, 31+d band: every 21d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-fomc-minutes-2027-02-17.json` (`status: "estimate"`) in
the same PR — your own file, never another event's canonical one (#1717). Close-out fills `## Outcome`
below from re-run instrument data (cache busted first), never from memory — after which this doc goes
quiet.
