# FTSE Russell — preliminary June 2027 additions/deletions published after 6 p.m. ET (five weeks before implementation) — russell-recon-preliminary-2027-05-21

**Kind:** sector · **Date:** 2027-05-21 (estimate — EST: rule-derived from the owner's ground rules and confirmed against four consecutive published instances. FTSE Russell, *Russell US Equity Indexes* construction and methodology, **v7.2, August 2026**, re-fetched and text-extracted independently this session (HTTP 200, 746,491 bytes, 77 content streams inflated, 277,404 characters): Appendix F's June column gives Preliminary Information Released = "Five weeks prior to implementation", and §4.3.1 repeats it — changes "are announced five weeks prior to implementation for the June review and four weeks prior to the December review". Five weeks before the 2027-06-25 implementation is Friday **2027-05-21**. The convention is confirmed, not assumed: the owner's own schedule press releases give 2023 05-19→06-23, 2024 05-24→06-28, 2025 05-23→06-27, 2026 05-22→06-26 — four instances, all exactly 35 days. Stays `estimate` because no 2027 calendar publishes until roughly 2027-03, and this calendar's confirmed-tier prefixes have no member for an index owner) · **Impact:** low
**Last assessed:** 2026-09-06
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"low:15+","adjacentIds":["vix-expiration-2027-05-18","opex-2027-05-21","consumer-confidence-2027-05-25"],"screenStreak":0,"blocked":[]} -->

## At a glance

**TL;DR.** **Stand aside, and the reason is a measurement rather than a shrug.** This entry is the *information* half of the Russell mechanic — 2027-06-25 is when shares move, 2027-05-21 is when the membership list and the indicative share/float data become public. The proposing sibling filed it saying the announcement window "was NOT measured by this session at all". It is measured now, across the **eight years whose announcement date is sourced from FTSE Russell's own schedule press release** (2019–2026), and it is **a null twice over**. The announcement-to-implementation window returns IWM-vs-SPY **−0.01%** (bootstrap **p=42%**) against an unconditional −0.24% — the five-week sub-sample's +0.61% mean is a single year (2026's +7.39%) sitting on a **−0.44% median**. And the announcement is **not a volume event at all**: IWM whole-day volume on the first tradeable session printed **below its own trailing-60d median in 8 of 8 years** (median **0.90×**), against the **1.42×** the implementation session runs. **One result survived and is registered rather than believed:** IWM-vs-SPY on that first tradeable session averages **+0.64%, 7 of 8 positive, p=0.8%**, robust to dropping the best year and present in *both* schedule regimes — but **61% of it is the overnight gap** (+0.39%, 7/8) that can only be captured by holding small-caps long into a list nobody has seen, the part you can trade *after* reading the list is +0.25% at **5 of 8**, one of six shifted-Friday placebos also clears p<0.05, and the whole thing is gone by five sessions (p=87%). **A correction the sibling could not have made:** the five-week window is only **four years old** — 2019–2022 ran a **three-week** window off a May rank day, so any study that back-dates "implementation − 35 days" before 2023 measures the wrong days. Date `estimate`, impact `low`, no house playbook is index-flow-keyed (re-grepped: zero hits), shorting blocked house-wide. Nothing here licenses a position on any horizon.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** | High | D-257, `symbols: []`, and the list this event publishes is not even *determined* until rank day **2027-04-30** — nothing about 2027-05-21 is knowable today | A house index-flow instrument being built and back-tested before **2027-05-21** — "nothing to size this with" stops being a grep result and this sheet is rebuilt on measured data |
| This week | **Stand aside** | High | No Russell milestone falls in it; the nearest is the **December** preliminary list, **2026-11-13**, ten weeks out | FTSE Russell publishing a 2027 reconstitution calendar before **2026-09-13** — the owner has published in early March each year, so an early one would be a schedule change worth reading |
| This month | **Stand aside** | High | The next dated link in this chain is **2026-11-13**, outside this window; the June 2027 chain does not start until **2027-04-30** | Any FTSE Russell methodology notice before **2026-10-06** moving the five-week rule or Appendix F's June column — the whole derivation below is then stale |
| This quarter | **Watch 2026-11-13, take no position** | Medium | The first December preliminary list in the family's history prints inside this quarter and is the **first out-of-sample observation** of everything measured here — registered as `FT-…-1` and `FT-…-2` | IWM-vs-SPY on **2026-11-16** printing **≥ +0.64%** *and* IWM volume that day **≥ 1.20×** trailing-60d — both nulls fail together, the announcement is a real information event, and this sheet is rebuilt |

**Signals & conditions** — the buy/sell/hold triggers:

- Date is `estimate` (rule-derived, no 2027 calendar published) — it widens caution and licenses **no** date-keyed action.
- **Never trade the announcement.** The window it opens is a measured null (p=42%) and no house playbook is index-flow-keyed.
- **The five-week window is four years old, not a tradition.** 2019–2022 ran three weeks off a May rank day; April rank day + five weeks arrived together in 2023.
- **Nothing is tradeable on 2027-05-21 itself** — the lists post *after 6 p.m. ET*. The first tradeable session is Monday **2027-05-24**.
- **The one surviving effect is mostly an overnight gap** (+0.39% of +0.64%): capturing it means being long small-caps into an unpublished list.
- **The announcement is not a volume event** — IWM below its trailing-60d median in 8 of 8 years (median 0.90×) vs 1.42× on implementation day.
- **"Preliminary" is operative, not a hedge** — the list is revised every Friday through **2027-06-04** and only final at lock-down, Monday **2027-06-07**.
- **2027-05-21 is also monthly opex** (`opex-2027-05-21`) — any 2027 announcement-day flow read is confounded at the source.
- Chain: **2027-04-30** rank day → **2027-05-21** prelim (after 6 p.m. ET) → updates 05-28 / 06-04 / 06-11 / 06-18 → query ends **06-04** → lock-down **06-07** → implementation **06-25** → effective open **06-28**.

## Initial research

### The question

This id reached the calendar as a proposal from the
[`russell-reconstitution-2027-06-25`](russell-reconstitution-2027-06-25.md) initial research, which filed
it as *coverage* and said so plainly: *"The announcement window itself (2027-05-21 → 2027-06-25) was NOT
measured by this session at all; no claim is made about it, and that gap is the honest reason to have the
date on the calendar before anyone needs it."* That is the whole assignment. **Is the date right, checked
from the owner's primaries rather than from the sibling's read? And does the announcement window — the one
the index-effect literature actually studies — show anything on our tape?**

**One-line verdict:** the date is right and the convention behind it is now confirmed against four
published instances rather than one — but the window is a **null on both axes measured**, price and
volume, and the single result that survives is an overnight gap you cannot take without betting on an
unpublished list.

### Method

Macro / market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — the entry
carries `symbols: []`, so no symbol-keyed instrument applies and `scripts/research/` has no index-flow
instrument. Nothing was taken from the proposing sibling on faith; every clause it cited was re-fetched:

- **FTSE Russell ground rules** — *Russell US Equity Indexes* construction and methodology, **v7.2, August
  2026**, fetched direct (HTTP 200, **746,491 bytes**) and text-extracted **in-session** by inflating its
  77 content streams (**277,404 characters**). The cover's own version string was read back
  (`August 2026 … v7.2`) rather than trusted from the sibling. Appendix F, §4.2.2, §4.3.1 read in full.
- **FTSE Russell's own reconstitution page** — `lseg.com/en/ftse-russell/russell-reconstitution` (HTTP
  200, **228,333 bytes**, **13,561 characters** extracted — the sibling got 13,681 from the same URL two
  hours earlier, and 838 the fetch before that; the page is client-rendered and its yield is unstable,
  which is recorded rather than glossed).
- **The owner's own schedule press releases, one per year** — this is the load-bearing new source and the
  reason the study exists. 2019, 2020, 2021, 2022, 2023, 2024, 2025 and 2026 announcement dates are each
  read off FTSE Russell's published schedule for that year, never derived from a rule.
- **The owner's own June 2026 artefacts** — the reconstitution summary paper (HTTP 200, 449,809 bytes),
  the *Impacts of the Russell US Reconstitution* overview (444,549 bytes), and the published
  **ru3000 additions / deletions lists** (976,799 / 1,010,529 bytes), all text-extracted in-session.
- **Yahoo daily bars** — IWM, SPY, `^VIX`, 2005-01-03 → 2026-09-04, fetched this session (`query2`, HTTP
  200, no retries needed). Adjusted closes for return work, raw open/close for the gap decomposition,
  volume for the turnover work.
- **This repo** — `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md` re-grepped for
  `rebalanc|index effect|announcement|preliminary|reconstitution|russell` → **zero hits**; the proposal
  file carrying this id, and the proposing sibling's ledger, both read in full before anything was written.

### Conviction legs, tested

1. **The date is correct, and the five-week convention is now confirmed against four published instances
   rather than one — SUPPORTED.** Appendix F's June column: Preliminary Information Released = *"Five
   weeks prior to implementation"*, Query Period = *"For two weeks following preliminary announcement"*,
   Lock down = *"Three weeks after query period ends"*, Implementation = *"4th Friday of June"*. §4.3.1
   states it independently: changes *"are announced five weeks prior to implementation for the June review
   and four weeks prior to the December review."* The schedule is internally consistent (5 = 2 + 3). Five
   weeks before 2027-06-25 is **Friday 2027-05-21**. The sibling checked the convention against two
   instances; all four the current regime has produced were checked here, each from the owner's own
   schedule for that year:

   | Year | Rank day | Preliminary list | Implementation | Gap |
   |---|---|---|---|---|
   | 2023 | Fri 04-28 | Fri **05-19** | Fri 06-23 | **35 days** |
   | 2024 | Tue 04-30 | Fri **05-24** | Fri 06-28 | **35 days** |
   | 2025 | Wed 04-30 | Fri **05-23** | Fri 06-27 | **35 days** |
   | 2026 | Thu 04-30 | Fri **05-22** | Fri 06-26 | **35 days** |

   2026 is stated three separate ways — the schedule release, the reconstitution page (*"following the
   publication of preliminary lists beginning on May 22"*) and the owner's June 2026 summary paper (*"The
   preliminary membership changes announced on May 22, 2026"*). **Four instances, zero misses.**

2. **The five-week window is only four years old, and a study that assumes it is older measures the wrong
   days — SUPPORTED, and it is the correction this leg exists to make.** The proposal that carried this id
   called the five weeks *"the window that literature studies"*, which reads as a standing feature of the
   event. It is not. Under the previous regime the rank day sat in **May** and the announcement came
   **three weeks** before implementation:

   | Year | Rank day | Preliminary list | Implementation | Gap |
   |---|---|---|---|---|
   | 2019 | Fri 05-10 | Fri **06-07** | Fri 06-28 | **21 days** |
   | 2020 | Fri 05-08 | Fri **06-05** | Fri 06-26 | **21 days** |
   | 2021 | Fri 05-07 | Fri **06-04** | Fri 06-25 | **21 days** |
   | 2022 | Fri 05-06 | Fri **06-03** | Fri 06-24 | **21 days** |

   The April rank day and the five-week announcement arrived **together, in 2023**. So back-dating
   "implementation − 35 days" before 2023 lands on a session with no announcement in it, and the
   current-regime sample for anything window-shaped is **n=4**, not n=11. Every leg below is grouped by
   regime for exactly this reason, and the sample is bounded honestly at 2019 because 2017–2018
   announcement dates could not be sourced from the owner this session and were **not** invented from a
   rule that did not yet apply.

3. **The announcement-to-implementation window is a null — SUPPORTED (negative result), and it is the
   answer to the question this event was filed to ask.** IWM minus SPY on total-return closes, from the
   announcement Friday's close to the implementation Friday's close, against an unconditional overlapping
   base rate of matched length (2015-06-01 → 2026-09-04):

   | Sample | n | Mean | Median | Positive | Unconditional | One-sided bootstrap |
   |---|---|---|---|---|---|---|
   | All years 2019–2026 | 8 | **−0.01%** | −0.44% | 4/8 | −0.24% | **p=42.0%** |
   | Five-week regime 2023–2026 | 4 | +0.61% | **−0.44%** | 2/4 | −0.29% | p=29.4% |
   | Three-week regime 2019–2022 | 4 | −0.63% | −0.28% | 2/4 | −0.18% | p=63.8% |

   **The five-week mean is one year.** 2026 printed **+7.39%**; the other three printed −1.05%, −4.09% and
   +0.18%. Strip 2026 and the regime's mean is **−1.65%**. Nothing here is distinguishable from the
   ordinary drift of small-caps against large-caps over the same number of sessions.

4. **Splitting the window at lock-down — the sharpest test this event owns — also finds nothing, at n=4
   per side — SUPPORTED (negative result), and the design is worth keeping even though the answer is
   no.** If the index effect were an *information* effect it should live in the query period, when the
   list is public but revisable; if it were a *flow* effect it should live in lock-down, when the list is
   final and only the trade remains. Five-week regime, IWM-vs-SPY:

   | Sub-window | n | Mean | Median | Positive |
   |---|---|---|---|---|
   | Announcement → lock-down (query period) | 4 | −0.17% | +0.23% | 2/4 |
   | Lock-down → implementation | 4 | **+0.80%** | **−1.06%** | **1/4** |

   The lock-down leg's positive mean is 2026's **+6.91%** on its own, with the other three at −0.98%,
   −1.15% and −1.57%. A mean and a median of opposite sign at n=4 is not a finding; it is a sample size.
   The lock-down date is nonetheless proposed as its own calendar entry (leg 9) because *when an estimate
   becomes final* is a real transition for a house whose standing rule is that estimates widen caution.

5. **The announcement is not a volume event — SUPPORTED (negative result), and it is the cleanest result
   in this document.** Lists post **after 6 p.m. ET** on a Friday, so the first tradeable session is the
   following Monday. IWM whole-day volume on that session, against its own trailing-60-session median:

   | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025 | 2026 |
   |---|---|---|---|---|---|---|---|
   | 0.97× | 0.79× | 0.95× | 0.84× | 1.02× | 0.59× | 0.99× | 0.76× |

   Median **0.90×**, mean 0.86×, and **7 of 8 years print strictly below their own median** — the eighth
   is 1.02×. The comparison that makes this mean something is the sibling's implementation-day figure on
   the identical instrument and normalisation: **1.42× median**. **The day the information arrives is a
   quieter-than-average day for small-cap ETF volume; the day the shares move is not.** That is the
   cleanest statement of what this event is and is not.

6. **One result survives, and it is registered rather than believed — MIXED.** IWM-vs-SPY on the first
   tradeable session after the announcement: **mean +0.64%, median +0.59%, 7 of 8 positive**, one-sided
   bootstrap **p=0.8%** against an unconditional +0.00% per session. It does not fall over easily:

   | Robustness check | Result |
   |---|---|
   | Drop the single best year (2021, +1.44%) | +0.52%, 6/7, **p=3.0%** |
   | Drop best *and* worst (2024, −0.21%) | +0.64%, **6/6**, **p=1.8%** |
   | Five-week regime only | +0.66%, 3/4, p=3.6% |
   | Three-week regime only | +0.61%, **4/4**, p=4.6% |

   Surviving in **both** regimes separately is a stronger check than it looks, because the two regimes put
   the announcement on entirely different calendar dates — late May versus early June. **What kills it as
   a trade is leg 7; what weakens it as a finding is leg 8.**

7. **Even taken at face value, the surviving effect is not capturable here — SUPPORTED, and it is why the
   call is a refusal rather than a small position.** Decomposing that first tradeable session into the
   overnight gap (announcement Friday's close → Monday's open) and the regular session (Monday's open →
   close):

   | Leg | Mean | Positive |
   |---|---|---|
   | Overnight gap — before anyone can act on the list | **+0.39%** | **7/8** |
   | Regular session — after the list is public and readable | +0.25% | **5/8** |

   **61% of the effect is in the gap.** Taking the gap means being long IWM into Friday's close ahead of a
   list nobody has seen — a directional small-cap bet placed *on an `estimate`-status date*, which is
   precisely what this house's standing rule forbids. The half that remains after the list is public and
   tradeable is +0.25% at **5 of 8** — a coin flip on a quarter of a percent, before costs. It also
   **decays and reverses**: holding 2 sessions gives p=1.2%, 3 gives p=6.4%, 5 gives p=87.0%, 10 gives
   p=99.7%. Confidence drives size, and this size is zero.

8. **The placebo does not fully clear it, and my own multiple-comparison problem is stated rather than
   hidden — MIXED.** The same first-tradeable-session test run on Fridays shifted by whole weeks in the
   same eight years:

   | Shift | −21d | −14d | −7d | **announcement** | +7d | +14d | +21d |
   |---|---|---|---|---|---|---|---|
   | Mean | +0.43% | +0.14% | +0.20% | **+0.64%** | −0.18% | −0.08% | −0.02% |
   | Positive | 4/8 | 5/8 | 5/8 | **7/8** | 2/8 | 5/8 | 4/8 |
   | p | **4.6%** | 27.5% | 19.3% | **0.8%** | 75.7% | 61.3% | 50.3% |

   The announcement Friday is the extreme of the seven and the only one at 7/8 — but **one of six placebos
   also clears p<0.05**, which across six tries is ordinary (Šidák ≈ 25%). Two wider controls do come back
   clean: every May/June Friday in these eight years returns **+0.06%** (n=69, p=20.8%) and every Friday
   since 2015-06 returns **+0.00%** (n=566, p=36.6%) — so the season and the weekday are not doing the
   work. **The honest accounting of my own search:** roughly a dozen tests were run across two directions,
   three window definitions and four horizons before this one was reported. At p=0.008 a Šidák correction
   over twelve tries leaves ≈ **9%** — nominal, not significant. **n=8 and a mechanism I cannot trade is
   a forward test, not an edge.**

9. **The chain around this date resolves cleanly, and two links of it are untracked — SUPPORTED, and both
   are proposed.** The June 2027 chain, each convention checked against all four published instances of
   the current regime: rank day **Friday 2027-04-30** (§4.2's definition, verbatim: *"The Rank Day occurs
   on the last business day of April for the June reconstitution and the last business day of October for
   the December reconstitution"* — April 2027's last business day is Friday the 30th) → preliminary list
   **Friday 2027-05-21** after 6 p.m. ET → weekly revisions **05-28 / 06-04 / 06-11 / 06-18** (the owner
   published exactly four weekly updates in each of 2023, 2024 and 2025) → query period ends **2027-06-04**
   → **lock-down Monday 2027-06-07** (the owner starts lock-down on the Monday after the query period in
   all four instances: 2023-06-05, 2024-06-10, 2025-06-09, 2026-06-08) → implementation **2027-06-25** →
   effective at the open **2027-06-28**. Two dated links this calendar does not carry are proposed:
   **`russell-recon-preliminary-2026-11-13`**, the **first December preliminary list in the family's
   history** (owner's page, verbatim, twice; 28 days before the 2026-12-11 implementation, matching the
   four-week December rule exactly) — 68 days out and the first out-of-sample observation of legs 5, 6 and
   7 — and **`russell-recon-lockdown-2027-06-07`**, the date the list stops being preliminary.

10. **What the announcement actually contains is bigger than "a list of names" — SUPPORTED, and it is
    the strongest argument for tracking the date at all.** Appendix F's definition, verbatim: the
    announcement is made *"of the preliminary additions, deletions, indicative shares outstanding and free
    float data"* — **weights, not just membership**. Magnitude, from the owner's own June 2026 artefacts:
    the published ru3000 lists carry **224 additions and 166 deletions** (counted directly from the
    extracted PDFs); the summary paper reports **61 companies added to the Russell 1000** (42 migrating up
    from the Russell 2000) and **244 added to the Russell 2000**, of which **105 came from outside the
    Russell US universe entirely**. The owner's *Impacts* overview puts index turnover at a **12.8%**
    average across 2004–2026 (252 stocks) against **32.0%** across 1996–2003 (534 stocks) — the mechanic
    is roughly a third the size it was before capitalisation banding and the quarterly IPO process. **A
    large, precisely-specified information release that our tape cannot detect** is a more interesting
    null than a small one.

11. **"Preliminary" is operative, and the 2027 instance carries a same-day confound — SUPPORTED.** The
    ground rules: *"During the query period FTSE Russell welcomes queries on the published data"*, and
    only *"during lock down"* is the reconstitution *"considered final, and any additional changes are
    made in exceptional circumstances only"*. So 2027-05-21 publishes a **revisable** list, revised each
    Friday for three more weeks. Separately, **2027-05-21 is the third Friday of May 2027 — monthly
    opex**, tracked here as [`opex-2027-05-21`](opex-2027-05-21.md); the announcement lands on a session
    whose volume and flow are already dominated by expiration. Any 2027-specific announcement-day volume
    read is confounded at the source, which is one more reason the forward tests below score on the
    **December 2026** instance instead of waiting eight months.

12. **No house playbook fits — SUPPORTED, re-verified not inherited.** `trade-playbooks.md` and
    `multi-symbol-sweep.md` re-grepped this session for
    `rebalanc|index effect|announcement|preliminary|reconstitution|russell`: **zero hits**. S1/G1 are
    earnings-dated run-ups, S2 the never-hold-the-print guard, S3 an earnings reaction-day fade (blocked
    on shorting), S4 an overnight-vs-buy-and-hold structural note, E1 a don't-trade-the-open execution
    rule. **There is no contact point at all here** — unlike the implementation date, this one does not
    even carry an execution-hygiene note, because no auction is forced by an announcement.

### What the conditions support

Nothing directional, on any horizon. Six outputs: **the gap the sibling named, now filled** (the
announcement window is a null at p=42%, and its five-week mean is one year); **a correction to the
inherited framing** (the five-week window is four years old, not a tradition, so pre-2023 back-dating
measures the wrong days); **the cleanest negative result in this pair of ledgers** (the information day
runs *below* median IWM volume in 8 of 8 years against implementation day's 1.42×); **one surviving
result, disarmed by its own decomposition rather than by its p-value** (61% of it is an untakeable
overnight gap); **two untracked dated links proposed**, including the first December preliminary list in
the family's history, 68 days out; and **three forward tests that score in ten weeks rather than eight
months**, because December 2026 supplies an out-of-sample announcement before June 2027 does.

### Honest limits

**IWM-vs-SPY is an index-level proxy for a single-name effect, and this is the biggest caveat.** The
published index effect is about *added and deleted names*, and adds and deletes are two-sided flow that
largely cancels at the index level. Legs 3, 4 and 6 are therefore a **floor** on any single-name effect
and say nothing about it; a session with constituent-level data could find a large announcement effect in
the added names without contradicting a number here. **n=8, and n=4 per regime.** Leg 4's split is n=4 per
side, which is why it is reported as structure rather than as a result. **My multiple-comparison problem
is mine.** Leg 8 states it: roughly a dozen tests preceded the one reported, and a Šidák correction leaves
leg 6 at ≈9%. **The bootstrap pools overlapping windows**, not independent draws, so its p-values are
optimistic in both directions. **The announcement dates are the owner's, but the pre-2019 ones are
missing** — 2017 and 2018 could not be sourced this session and were deliberately not reconstructed from a
rule that did not apply then, which caps the sample at eight rather than eleven. **Leg 10's counts are my
own extraction** of the owner's published PDFs, not a figure the owner states; the 224/166 numbers come
from counting industry labels in the extracted text and could be off by a handful. **The reconstitution
page is client-rendered and unstable** — 13,561 characters this session, 13,681 two hours earlier, 838 the
fetch before that — so a re-fetch may not reproduce the December dates, which is why they are corroborated
against the four-week rule arithmetically. **The date is `estimate`** and every trading-adjacent statement
above carries that label; shorting is blocked house-wide and no house playbook is index-flow-keyed.

## Stance & kill switches

**Stance (date `estimate`, `EST:` rule-derived from the owner's ground rules, the five-week convention
confirmed against four published instances).** Treat 2027-05-21 as a **certain, precisely-specified,
entirely unactionable information date** — and treat **2026-11-13 as the near-term thing worth watching**,
because it tests everything measured here 68 days from now instead of 257. Four legs. **(a) The gap the
sibling left is filled, and the answer is no.** The announcement-to-implementation window returns −0.01%
on IWM-vs-SPY at p=42%; the five-week regime's positive mean is 2026 alone against a negative median; and
splitting the window at lock-down finds a mean and a median of opposite sign at n=4 per side. **(b) The
strongest result in this document is a negative one.** Small-cap ETF volume on the first tradeable session
after the announcement is *below* its own trailing median in 8 of 8 years — the information day is quieter
than average, where the implementation day runs 1.42×. **(c) The one tempting result is disarmed by its
own anatomy, not by a p-value.** +0.64% at 7-of-8 and p=0.8% is real-looking and survives dropping its
best year, but 61% of it is an overnight gap that requires being long into an unpublished list, the
tradeable remainder is 5-of-8, one of six placebos also clears 0.05, and my own dozen-test search leaves
it at ≈9% corrected. **(d) The framing this event inherited needed a correction the sibling could not have
made:** the five-week window began in 2023, so the "window the literature studies" has four instances on
this schedule, not a generation of them. Carry forward one thing that outlives this event: **the Russell
announcement is a large, precise, publicly-scheduled information release that our instruments cannot
detect at index level — and the honest response to that is a better instrument, not a smaller position.**

**Kill switches:**

- **IWM-vs-SPY on 2026-11-16 prints ≥ +0.64%** — the announcement-day effect gets its first out-of-sample
  confirmation, in a regime (December, four weeks, no history) where nothing predicted it. Leg 6 stops
  being underpowered and leg 7's gap decomposition becomes the live question. Registered as
  `FT-russell-recon-preliminary-2027-05-21-1`.
- **IWM whole-day volume on 2026-11-16 prints ≥ 1.20× trailing-60d** — leg 5's 8-of-8 volume null breaks
  on its first out-of-sample draw, the announcement *is* a volume event in December, and the
  information-versus-execution framing this ledger is built on needs re-pricing. Registered as
  `FT-russell-recon-preliminary-2027-05-21-2`.
- **FTSE Russell's published 2027 reconstitution calendar names a preliminary date other than
  2027-05-21** — the four-instance confirmation in leg 1 covers the convention, not a departure from it;
  this entry, the lock-down proposal and the whole chain in leg 9 all need recomputing. Registered as
  `FT-russell-recon-preliminary-2027-05-21-3`.
- **A constituent-level instrument (added/deleted single names, not IWM) shows a real announcement
  effect** — legs 3, 4 and 6 measured a floor with the wrong instrument, exactly as the sibling's leg 4
  refuted a paraphrase with whole-day volume rather than auction notional. This is the *expected*
  direction if such data ever arrives.
- **FTSE Russell changes the five-week rule, the April rank day, or reverts to annual reconstitution** —
  legs 1, 2, 9 and 11 all rest on ground rules v7.2 (August 2026). Re-check the version string every
  pulse; a v7.3 touching Appendix F or §4.3.1 invalidates the derivation.
- **A house index-flow instrument gets built** — leg 12's "no playbook fits" stops being a grep result and
  this sheet is rebuilt on house data.
- **A US macro print or a tracked-name earnings date gets scheduled onto 2027-05-24** — the first
  tradeable session after the announcement is the only session this event has any measured claim about,
  and a competing catalyst on it would confound the 2027 read the way opex already confounds 2027-05-21.

**Registered forward tests.** `FT-russell-recon-preliminary-2027-05-21-1`, `-2` and `-3` — see
[`forward-tests/russell-recon-preliminary-2027-05-21.md`](../forward-tests/russell-recon-preliminary-2027-05-21.md).
Observations, never templates.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-06 | D-257 | Initial research banked; canonical `src/domain/market-events/<id>.json` written this session (the id existed only as `proposals/…from-russell-reconstitution-2027-06-25.json`, read in full first). probe-ref baseline set (no symbols, **VIX 14.53** at the 2026-09-04 close, band `low:15+`, 3 adjacents, 0 blocked fetches). **Date re-derived from the owner's primaries, not inherited:** ground rules v7.2 (re-fetched, 746,491 bytes, 277,404 chars extracted in-session; cover version string read back) Appendix F "Five weeks prior to implementation" + §4.3.1 "announced five weeks prior … for the June review" → **2027-05-21**, and the convention **confirmed against all four published instances** of the current regime (2023 05-19→06-23, 2024 05-24→06-28, 2025 05-23→06-27, 2026 05-22→06-26, every one exactly 35 days), each read off FTSE Russell's own schedule press release. **Inherited framing CORRECTED:** the five-week window is only **four years old** — 2019-2022 ran a **21-day** window off a **May** rank day (06-07/06-05/06-04/06-03), and the April rank day + five weeks arrived together in 2023; back-dating "impl−35d" before 2023 measures sessions with no announcement in them. **The sibling's named gap MEASURED, and it is a null:** announcement→implementation IWM-vs-SPY **−0.01%** (n=8, k=19d, bootstrap **p=42.0%** vs −0.24% unconditional); the five-week sub-sample's +0.61% is **2026's +7.39% alone** against a −0.44% median (ex-2026: −1.65%). Splitting at lock-down (the sharpest test this event owns) gives query −0.17% (2/4) and lock-down→impl +0.80% mean but **−1.06% median, 1/4** — mean and median of opposite sign at n=4 is a sample size, not a finding. **Cleanest result is negative:** IWM whole-day volume on the first tradeable session ran **below its own trailing-60d median in 8 of 8 years** (0.59×–1.02×, **median 0.90×**) against the sibling's **1.42×** implementation-day median — the information day is *quieter* than average. **One result survived and is registered, not believed:** first-tradeable-session IWM-vs-SPY **+0.64%, 7/8 positive, p=0.8%**, robust to dropping best (3.0%), best+worst (1.8%, 6/6) and present in both regimes separately (3.6% / 4.6%) — but **61% is the overnight gap** (+0.39%, 7/8) takeable only by holding small-caps long into an unpublished list, the post-publication RTH remainder is **+0.25% at 5/8**, it decays and reverses by horizon (k=2 p=1.2% → k=5 p=87.0% → k=10 p=99.7%), one of six shifted-Friday placebos also cleared p<0.05 (−21d, 4.6%), and my own ~12-test search leaves it at **Šidák ≈9%**. Wider controls clean: all May/June Fridays +0.06% (n=69, p=20.8%), all Fridays +0.00% (n=566). **Content of the release quantified:** Appendix F — "preliminary additions, deletions, **indicative shares outstanding and free float data**" (weights, not just names); June 2026's published ru3000 lists carry **224 adds / 166 deletes** (counted from the extracted PDFs), summary paper 61 into R1000 + 244 into R2000 (105 from outside the universe), owner's *Impacts* overview turnover **12.8% / 252 stocks** (2004-2026) vs 32.0% / 534 (1996-2003). **Adjacency — peers:** none (`symbols: []`). **Macro:** corridor within 5d = `vix-expiration-2027-05-18`, **`opex-2027-05-21` (SAME DAY — the 2027 announcement lands on monthly opex, confounding any 2027 flow read at the source)**, `consumer-confidence-2027-05-25`. **Vol:** baseline, no prior; VIX 14.53, IWM 296.01, SPY 770.19 (2026-09-04 closes). **Geopolitical:** nothing touching index methodology. **Event tape:** playbooks + sweep re-grepped incl. `announcement|preliminary` → **zero hits**. **Two dated adjacents FILED:** `russell-recon-preliminary-2026-11-13` — the **first December preliminary list in the family's history**, owner's page verbatim twice, 28 days before 2026-12-11 per the four-week December rule, **68 days out** and the first out-of-sample observation of everything above — and `russell-recon-lockdown-2027-06-07`, the Monday the list stops being preliminary (next-Monday convention confirmed against 2023-06-05 / 2024-06-10 / 2025-06-09 / 2026-06-08). Registered **FT-…-1** (IWM-vs-SPY on 2026-11-16 < +0.64%), **FT-…-2** (IWM volume 2026-11-16 < 1.20× trailing-60d), **FT-…-3** (the published 2027 calendar names 2027-05-21) — the first two score in ten weeks rather than eight months, deliberately. | — (stance set: stand aside on Today/week/month, **watch 2026-11-13** this quarter; the refusal rests on a measured p=42% window null, an 8-of-8 volume null, and one surviving result whose capturable half is 5-of-8 at +0.25% — with one open question, whether a constituent-level instrument would see what IWM cannot) | 2026-10-06 (low, ≥15d band: every 30d). Close-out by 2027-05-27 |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint notes any
row past ~1,200 chars): it is a note to the next session, not an essay, and a stance *change* earns its
sentence in the Stance section with the row as its receipt. The adjacency sweep (peer prints · macro
surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in every row; a dated
adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-russell-recon-preliminary-2027-05-21.json`
(`status: "estimate"`) in the same PR — your own file, never another event's canonical one (#1717).
Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from
memory — after which this doc goes quiet.
