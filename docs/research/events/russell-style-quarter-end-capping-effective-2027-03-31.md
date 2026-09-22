# Russell US Style March recapping — the ordinary quarter, whose value is that it settled the family's two open arguments — russell-style-quarter-end-capping-effective-2027-03-31

**Kind:** sector · **Date:** 2027-03-31 (estimate — **EST: owner-published standing rule, both governing documents re-fetched and re-extracted first-hand this session.** FTSE Russell, *Capping Methodology Guide*, **v5.4, September 2026** (`capping-methodology-guide.pdf`, HTTP 200, **652,008 bytes**, **62** content streams inflated in-session 2026-09-09 — the identical byte and stream counts three siblings recorded, so this is provably the same edition they read), whose §4.8.6 gives every Russell US Style row frequency **"Monthly"**, price date **"T-3"**, effective **"Last business day of each month"**, trigger **"No company is greater than 24%, and all companies that have a weight greater than 4.8% in aggregate are no more than 48% of the index"**, scheme **"Rule 4.2/RIC 22.5/45"**; and FTSE Russell, *Frequently Asked Questions — Russell US Equity Indexes*, **July 2026** (`ftse-faq-document-russell-us-equity-2026.pdf`, HTTP 200, **198,134 bytes**, **19** streams, re-fetched after one transient 404), whose **March 2026** column reads verbatim **"Russell US Style Capping Cut-Off Date — 11 March 2026"**, **"Review Effective Date (open of) — 23 March 2026"**, **"Russell US Style Quarter-end Capping Cut-Off Date — 26 March 2026"**, **"Russell US Style Quarter-end Capping Effective Date (open of, if applicable) — 31 March 2026"**. The 2027 date is **rule-derived, not published** — the FAQ's dated table carries 2026 rows only and closes *"NOTE: Dates may be subject to change."* Stays `estimate` because this calendar's confirmed-tier prefixes have no member for an index owner and this lane may not self-confirm an event it discovered in-sweep) · **Impact:** low
**Last assessed:** 2026-09-09
<!-- probe-ref: {"symbols":{},"vix":15.72,"daysBand":"low:15+","adjacentIds":["boj-summary-of-opinions-2027-03-29","case-shiller-hpi-2027-03-30","consumer-confidence-2027-03-30","fhfa-hpi-2027-03-30","ftc-v-amazon-antitrust-trial-2027-03-29","good-friday-market-closure-2027-03-26","japan-cpi-tokyo-flash-2027-03-26","japan-food-tax-cut-2027-04-01","sifma-japan-early-close-2027-03-29","sifma-uk-bond-market-closure-2027-03-29","sp-select-sector-secondary-reweight-2027-03-31"],"screenStreak":0,"blocked":[{"url":"https://www.ishares.com/us/products/239720/ishares-russell-top-200-growth-etf/1467271812596.ajax?fileType=csv&fileName=IWY_holdings&dataType=fund","status":"200-html-not-csv","at":"2026-09-09"},{"url":"https://www.ishares.com/us/products/239706/ishares-russell-1000-growth-etf/1467271812596.ajax?fileType=csv&fileName=IWF_holdings&dataType=fund","status":"200-html-not-csv","at":"2026-09-09"},{"url":"https://www.lseg.com/content/dam/ftse-russell/en_us/documents/policy-documents/ftse-faq-document-russell-us-equity-2026.pdf","status":"404-transient","at":"2026-09-09"}]} -->

## At a glance

**TL;DR.** **Stand aside — this instance is the family's ordinary quarter, and its whole value is that being ordinary let it settle the two arguments the extraordinary ones opened.** March 2027 has none of June's geometry: the style capping review takes effect at the open of **Monday 2027-03-22**, comfortably before the quarter-end test struck on the **Thursday 2027-03-25** close, effective at the **Wednesday 2027-03-31** open. **Argument one, settled from the owner's own document.** The [June sibling](russell-style-quarter-end-capping-effective-2027-06-30.md) called *"which index the T-3 check reads"* the single unresolved question its whole 2.17% / 18.91% / 43.43% band rested on, and said no owner document answers it. One does. **Guide v5.4 §4.8.3, quoted verbatim: the test weights "incorporate forward-looking constituents, shares in issue, and investability weights, including any current capping adjustments, designated to take effect on or before the effective date."** The check reads the **forward-looking** index — so a capping adjustment effective after the price date but on or before the effective date *is* incorporated, which is precisely June's case, and that band collapses onto its cut-off-anchor end. **Argument two, settled by finding the bug.** A fourth independent rebuild of this family's base rate reproduces the September and December siblings (**12-session 51/1,242 = 4.11%** against their **4.02%/3.95%**; **17-session 92/1,237 = 7.44%** against **7.76%**) — and reproduces the June session's disagreeing numbers **exactly** when one implementation choice is flipped back. The cause is nameable: a cohort index based at the **sample start** rather than re-based at each **window start**, which silently loads five years of NVDA outperformance into the cohort's internal weights and **roughly doubles every rate**. That satisfies the June sheet's own registered kill switch for `FT-…-3`, which reads *"the re-run returns 3.5–4.5%"*. **So every level in this family scales down, including this one.** March's own 11-session drift window (**2027-03-10** review cut-off → **2027-03-25** test) prices at **40/1,243 = 3.22%**, not the 6.68% the proposal that created this id quoted; corrected, the ladder runs June **0.56%** < March **3.22%** < September **4.11%** < December **7.44%** — the same ordering the June sheet said would survive, at half the levels. **None of it licenses a position.** Date `estimate`, `symbols: []`, **zero** house-playbook hits, D-203, and a fire case worth ~**$478M** across five of the most liquid names on the tape.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** | High | D-203, `symbols: []`, and every input to the 2027-03-25 test is re-struck at least three times before it matters — the **2026-09-09**, **2026-12-02** and **2027-03-10** review cut-offs. Nothing observable today survives to the strike | FTSE Russell publishing a 2027 schedule before **2026-12-31** whose March review effective date falls *after* the quarter-end capping cut-off — March would inherit June's geometry and stop being the family's control case |
| This week | **Stand aside** | High | Nothing in this family is scheduled inside it. The nearest dated milestone is the **2026-09-09** style capping cut-off — today — and it belongs to `russell-style-quarter-end-capping-effective-2026-09-30`, not here | Any dated report of a *Russell US Style* index being recapped between **2026-09-09** and **2026-09-15** outside that published cut-off — meaning neither owner document describes the whole rule |
| This month | **Stand aside; get the arithmetic correction to the September close-out before it scores** | High | The live work is not this date. `FT-russell-style-quarter-end-capping-effective-2027-06-30-3` scores by **2026-10-13** and names the **2026-09-30 close-out** as its first scheduled re-run; this session already has the re-run *and* the cause, and it more than halves the levels in three ledgers. A documents-and-arithmetic errand, not a position | A fifth rebuild that re-bases weights at each window start and still returns **above 6%** for the 12-session case on a five-year bar set — this session's diagnosis is wrong and the June sheet's 7.90% was right after all |
| This quarter | **Stand aside; the 2026-09-30 instance is the family's first live observation of anything** | Medium | Everything in four ledgers is modelled; nothing has watched a check actually resolve. The **2026-09-25** test on the **2026-09-30** effective open is the first, and at IWY's observed **46.81%** cohort it is close enough to 48% to be informative either way | IWY's over-4.8% company cohort reading **above 48%** at the **2026-09-25** close — the check fires, and every "the cohort sits comfortably inside the trigger" line in this family becomes a survivorship story rather than a measurement |

**Signals & conditions** — the buy/sell/hold triggers:

- Date is `estimate` — **owner-published but prefix-gapped, and rule-derived for 2027 rather than published** — and the trigger is **conditional**. It widens caution about the 2027-03-30/03-31 closes and licenses **no** date-keyed action.
- **§4.8.3 settles the anchor question the June sibling called unresolvable.** The test reads the **forward-looking** index, including capping adjustments effective on or before the quarter-end effective date. June's 18.91% and 43.43% legs do not survive it.
- **The family's base-rate disagreement is an implementation bug, not a judgment call** — fixed-base cohort index vs. re-based-at-window-start. Flipping that one choice reproduces *both* camps' numbers from one script.
- **Every level in this family roughly halves.** Corrected ladder: June **7/1,248 = 0.56%** · March **40/1,243 = 3.22%** · September **51/1,242 = 4.11%** · December **92/1,237 = 7.44%**. The **ordering is unchanged**, exactly as the June sheet predicted it would be.
- **March is the control case, and that is its job.** Review effective **2027-03-22** precedes the test struck **2027-03-25**, so both readings of §4.8.3 agree here and the anchor is unambiguously the **2027-03-10** cut-off.
- **The frequency conflict is inert for March, for the third time in this family.** Whether January and February month-end checks exist changes nothing: the 03-10 review cut-off is later than both and binds either way.
- **New tiebreaker on that conflict, recorded but not relied on:** the FAQ's own quarter-end section closes *"Further information regarding regulatory capping and the quarter-end capping can be found in the FTSE Russell Capping Methodology Guide"* — the FAQ names the guide as the authority on the exact point they disagree about.
- **"Three trading days" is the owner's own word, so Good Friday's step-back is read, not inferred.** T-3 from Wednesday **2027-03-31** steps over the full NYSE closure of Friday **2027-03-26** to Thursday **2027-03-25**. This is the family's **first** instance where a closure actually moves the price date.
- **The single-name leg is dead everywhere** — NVDA, the family's largest weight, is **16.21%** (IWY) / **15.79%** (IWF) against a 22.5% cap and a 24% trigger.
- **Company lines are combined** — Alphabet counts once at **11.04%** in IWY; a security-level read drops GOOG (**4.94%**) under the 4.8% line and understates the cohort by ~5pp.
- **The cohort read is NOT an independent confirmation of the siblings'** — the vendor's as-of date has not moved off **2026-08-27**, so this session re-read the same numbers, not new ones.
- Chain: review cut-off **2027-03-10** → *(if the guide governs, month-end checks 01-26 and 02-23, both superseded)* → quarterly review and recap effective open **2027-03-22** → **test struck on the 2027-03-25 close** → Good Friday **2027-03-26** → **effective open 2027-03-31**.

## Initial research

### The question

This id reached the calendar as a single proposal from the
[`russell-style-quarter-end-capping-effective-2027-06-30`](russell-style-quarter-end-capping-effective-2027-06-30.md)
initial research, which filed it for one explicit reason — under the FAQ's quarterly reading of the check's cadence,
the March 2027 check is the *only* reset that can bind the June test, and *"a calendar that tracks June without
tracking March cannot tell 43.43% from 18.91%."* Every proposal for this id was read in full first (there is exactly
one), then the canonical `src/domain/market-events/russell-style-quarter-end-capping-effective-2027-03-31.json` was
written by this session.

The proposal also stated, correctly, that this instance *"behaves normally"* — an 11-session drift window, no
inversion, no footnote-3 question. **That is what made the session worth spending: an ordinary instance is a control
case, and a control case is what you use to test the extraordinary ones.** So the question this session set itself
was not *what will March 2027 do* — the honest answer to that at D-203 is "nothing observable" — but **do the two
open arguments this family is carrying survive a fresh, first-hand read of the same documents and a fresh rebuild of
the same arithmetic?**

**One-line verdict:** **no, and both resolve** — guide §4.8.3 answers the anchor question the June sibling declared
unresolvable, and the base-rate disagreement between June and its two elder siblings is a single reproducible
implementation error that roughly doubles every rate.

### Method

Macro / market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — the entry carries
`symbols: []`, so no symbol-keyed instrument applies and `scripts/research/` has no index-flow instrument. Nothing
was taken from the proposal or from any sibling ledger on faith.

- **FTSE Russell Capping Methodology Guide, v5.4, September 2026** — fetched direct (HTTP 200, **652,008 bytes**),
  **62** content streams inflated and text-extracted in-session. §§4.8.1–4.8.6 and footnote 3 read at the paragraph
  level, which is where the headline came from: **no ledger in this family had quoted §4.8.3.**
- **FTSE Russell FAQ, July 2026** — fetched direct (HTTP 200, **198,134 bytes**), **19** streams. One transient
  `404` on the first attempt, recorded in `probe-ref.blocked` rather than silently retried away. Read at the column
  level for all four 2026 capping rows and at the paragraph level for the quarter-end section's own prose.
- **NYSE, Holidays and Trading Hours** — fetched direct (HTTP 200, **109,180 bytes**) for the 2027 closure column,
  because Good Friday falls inside this instance's T-3 window. Corroborated against `src/domain/market-calendar.ts`.
- **Vendor holdings** — IWY and IWF. The iShares holdings-CSV ajax endpoint returned an HTML product page under
  HTTP 200 for both funds for the **third** recorded time; both are in `probe-ref.blocked` and holdings came from
  stockanalysis.com, an **aggregator** — a provenance downgrade stated here rather than hidden.
- **Yahoo daily bars** — NVDA, AAPL, MSFT, GOOGL, GOOG, AVGO, IWY, IWF, SPY, `^VIX`; five years, **1,254** usable
  sessions (2021-09-09 → 2026-09-08), one session longer than the June sibling's set.
- **This repo** — the corridor computed from the calendar files rather than by eye; `trade-playbooks.md` and
  `multi-symbol-sweep.md` re-grepped for `rebalanc|reconstitution|russell|capping|index.flow|IWF|IWY` → **0 hits**.

### Conviction legs, tested

1. **HEADLINE — guide §4.8.3 answers the question the June sibling called unresolvable, and no ledger in this family
   had quoted it — SUPPORTED, verbatim.** That sibling registered
   `FT-russell-style-quarter-end-capping-effective-2027-06-30-2` on the claim that *"neither FTSE Russell document
   that governs this check says which index constitution the T-3 read is taken against — the one live at T-3, or the
   one that will be live on the effective date."* Extracted this session from the same edition it read (identical
   byte and stream counts), §4.8.3 reads in full:

   > **"The index weights used in the test are calculated using closing constituent prices on the price date and
   > incorporate forward-looking constituents, shares in issue, and investability weights, including any current
   > capping adjustments, designated to take effect on or before the effective date specified in Section 4.8.6. For
   > the avoidance of doubt, the trigger thresholds are tested against the constituent weights of the applicable
   > capped index specified in Section 4.8.6. The weights of the underlying uncapped index are not used."**

   The operative phrase is **"designated to take effect on or before the effective date"** — not *on or before the
   price date*. The test reads the **forward-looking** index. §4.8.4 completes it: *"The recap is calculated using
   prices as of the price date and implemented at the open of the applicable effective date."* So a capping
   adjustment announced at a review, priced from that review's cut-off, and effective after the T-3 price date but on
   or before the quarter-end effective date **is incorporated into the test**. That is exactly June 2027's
   configuration (review and reconstitution effective at the **06-28** open, test struck **06-25**, effective
   **06-30**), and it means the June sheet's own **cut-off anchor** was the correct reading all along and its
   **18.91%** and **43.43%** in-force legs do not survive the document. **This is a read miss, not a document
   change** — the byte count proves the same file.

2. **The March geometry is the ordinary one, and both readings agree here — SUPPORTED, and that is the leg's value.**
   The convention that reproduces all four published 2026 columns is *review effective at the open of the Monday
   after the quarter's implementation Friday, cut-off twelve calendar days earlier*. Re-derived independently this
   session: March 2026 → 23 Mar / 11 Mar ✓, June → 29 Jun / 17 Jun ✓, September → 21 Sep / 9 Sep ✓, December →
   14 Dec / 2 Dec ✓ (December's implementation Friday is the semi-annual reconstitution, not a third Friday). March
   2027's implementation Friday is the third Friday, **2027-03-19**:

   | March 2027 | Date | How |
   |---|---|---|
   | Style capping cut-off | **Wed 2027-03-10** | review effective open − 12 calendar days |
   | Review & recap effective (open of) | **Mon 2027-03-22** | Monday after the implementation Friday |
   | Quarter-end capping cut-off (price date) | **Thu 2027-03-25** | T-3 trading days from the last business day |
   | Quarter-end capping effective (open of) | **Wed 2027-03-31** | last business day of March 2027 |

   Because 03-22 precedes 03-25, the pre-§4.8.3 *"live at T-3"* reading and §4.8.3's *"forward-looking"* reading
   return the same index here. **March cannot discriminate between them — which is why it is the control case and
   not the test case**, and why the anchor is unambiguously the 2027-03-10 cut-off under either.

3. **HEADLINE — "three trading days" is the owner's own word, so Good Friday's step-back is read rather than
   inferred — SUPPORTED.** The FAQ's quarter-end section states the check uses *"closing prices from three **trading
   days** prior to the last business day of the quarter"*, and the guide's §4.8.5 illustrative calendar labels the
   sequence T-3 · T-2 · T-1 · *"Effective date (T)"*. Applied to the four published 2026 columns by this session, in
   which no closure intervenes: 31 Mar → 26 Mar ✓, 30 Jun → 25 Jun ✓, 30 Sep → 25 Sep ✓, 31 Dec → 28 Dec ✓
   (**4 of 4**). **March 2027 is the family's first instance where a closure actually falls inside the window**:
   counting back from Wednesday 2027-03-31 gives Tue 03-30, Mon 03-29, then Friday **2027-03-26** — Good Friday, a
   full NYSE closure per NYSE's own 2027 column read this session (*"Good Friday — Friday, March 26"*) and per
   `src/domain/market-calendar.ts`. A closed session publishes no close, so T-3 is **Thursday 2027-03-25**. The
   *"trading days"* wording makes this the owner's arithmetic, not this lane's convention.

4. **HEADLINE — the family's base-rate disagreement is one reproducible implementation choice, and this session
   reproduces BOTH camps from one script — REFUTED (the June sheet's levels).** The June sibling recorded that a
   third rebuild reproduced neither elder sibling and registered the discrepancy as `FT-…-3` rather than resolving
   it. A fourth rebuild, from the same rule, thresholds, cohort definition and five-year window, isolates the cause.
   The two implementations differ in **where the cohort's internal weights are struck**:

   | Implementation | Cohort weight of name *i* inside the window | 12-session, 45% reset |
   |---|---|---|
   | **Re-based at window start** (each window opens with the cohort at its reset composition) | wᵢ · 45/46.81 | **51 / 1,242 = 4.11%** |
   | **Fixed-base index** (cohort index normalised once at the sample start, then ratioed) | wᵢ · Pᵢ(t₀)-relative drift since 2021 | **100 / 1,242 = 8.05%** |

   The fixed-base variant silently loads five years of NVDA's own outperformance into the cohort's internal weights,
   so the cohort it measures is far more NVDA-concentrated — and therefore far more volatile — than the 45% cohort
   the rule actually resets. Run across the whole ladder on this session's **1,254**-session bar set, the two
   implementations reproduce the two camps:

   | Case | Elder siblings recorded | June sibling recorded | Re-based (this session) | Fixed-base (this session) |
   |---|---|---|---|---|
   | June, 6 sessions | — | 27/1,247 = **2.17%** | 7/1,248 = **0.56%** | 27/1,248 = **2.16%** |
   | March, 11 sessions | — | — | **40/1,243 = 3.22%** | 84/1,243 = **6.76%** |
   | September, 12 sessions | 50/1,243 = **4.02%** · 49/1,242 = **3.95%** | 98/1,241 = **7.90%** | 51/1,242 = **4.11%** | 100/1,242 = **8.05%** |
   | December, 17 sessions | 96/1,237 = **7.76%** | 176/1,236 = **14.24%** | 92/1,237 = **7.44%** | 175/1,237 = **14.15%** |

   The fixed-base column reproduces the June sibling's hit counts to within one or two windows in every row — and its
   6-session count is **identical** (27). The re-based column reproduces both elder siblings. **This session's
   1,254-session set is one bar longer than June's 1,253**, which accounts for the off-by-one denominators exactly.
   The June sheet's registered kill switch for `FT-…-3` reads *"the re-run returns 3.5–4.5% — this session's
   implementation is the outlier"*; **4.11% satisfies it.** The dynamic reading of the >4.8% membership filter — a
   name leaving the cohort when its own weight drops under 4.8% — was tested separately and changes **nothing** in
   any window (the marginal names never cross), so it is not a competing explanation.

5. **March's own number, and it is half what the proposal quoted — SUPPORTED.** The drift window runs from the
   **2027-03-10** review cut-off, where §4.8.3 fixes the capping factors, to the **2027-03-25** test: **11 trading
   sessions** (03-11, 12, 15, 16, 17, 18, 19, 22, 23, 24, 25). A 45% cohort clears the 48% trigger when it beats its
   own fund by **+6.67%**. Re-based, on 1,254 sessions:

   | Variant | Base rate |
   |---|---|
   | **IWY weights, raw closes — the headline** | **40 / 1,243 = 3.22%** |
   | IWY weights, adjusted closes | 39 / 1,243 = 3.14% |
   | IWF weights and denominator | 51 / 1,243 = 4.10% |
   | SPY denominator | 92 / 1,243 = 7.40% |
   | No reset — cohort drifts from the observed 46.81% | 336 / 1,243 = 27.03% |

   The proposal quoted **83/1,242 = 6.68%** for this window, which this session reproduces exactly as the
   fixed-base, adjusted-close variant. **The corrected number is 3.22%.**

6. **The frequency conflict is inert for March, for the third time in this family — SUPPORTED, and a new tiebreaker
   is recorded.** The guide's §4.8.6 says every Russell US Style row is **"Monthly"**, effective *"Last business day
   of each month"*; the FAQ's quarter-end section says *"The review is conducted quarterly (March, June, September,
   and December)."* The December sibling diagnosed this precisely and honestly — the *quarterly* rows in the guide
   belong to **FTSE Emerging ex China**, and *"the two owner documents genuinely disagree"* — and this session
   re-read both and confirms that diagnosis rather than correcting it. For **March** it changes nothing: under the
   monthly reading the January (effective 2027-01-29, priced 01-26) and February (effective 02-26, priced 02-23)
   checks both precede the **2027-03-10** review cut-off, which supersedes them, so the binding reset is the same
   under either cadence. **New, and not recorded by any sibling:** the FAQ's own quarter-end section closes *"Further
   information regarding regulatory capping and the quarter-end capping can be found in the FTSE Russell Capping
   Methodology Guide"* — on the exact point where the two disagree, the FAQ names the guide as the authority. That
   leans the conflict toward the monthly reading without settling it, and is offered as a tiebreaker rather than a
   resolution.

7. **The cohort read is identical to the siblings' — and that is NOT the independent confirmation it looks like —
   MIXED, and stated because the June sheet leaned on it.** Holdings for both funds are still stamped **as of
   2026-08-27**; the vendor has not published a newer file in the twelve days since. So this session re-read the
   same rows, from the same aggregator, at the same as-of date:

   | Fund | NVDA | AAPL | MSFT | Alphabet (both lines) | AVGO | **Cohort** |
   |---|---|---|---|---|---|---|
   | **IWY** | 16.21% | 7.79% | 6.20% | **11.04%** | 5.57% | **46.81%** |
   | **IWF** | 15.79% | 7.32% | 5.57% | **10.66%** | 5.13% | **44.47%** |

   The June sheet wrote that its holdings *"are trusted only because they reproduce the December sibling's
   independent read exactly."* Three reads of one unchanged file at one as-of date from one aggregator are one
   observation, not three. Nothing about the numbers is doubted; the **corroboration** claimed for them is.

8. **The single-name leg is dead by a wide margin — SUPPORTED.** The trigger is **24%** for any one company. NVDA,
   the largest weight anywhere in the family, is **16.21%** in IWY and **15.79%** in IWF against a 22.5% cap it is
   not near. Nothing in this family is a single-name story on any horizon this sheet covers.

9. **Scope unchanged, and it is the whole family's size that makes a 3.22% conditional worth tracking at all —
   SUPPORTED.** The eight Russell style funds total **$294.6B** on the readings three sessions have now taken. A
   breach recaps the cohort from just over 48% back to 45%: ~3pp of **IWY's $15.94B ≈ $478M**, spread across five
   mega caps, at a single close. Were IWF to breach as well, its 3pp is ~$3.78B — still under a tenth of a day's
   volume in each name it touches.

10. **The corridor is mid-sized and its first member is the reason the price date moves — SUPPORTED.** **11** tracked
    events sit within five days of 2027-03-31, computed from the calendar files rather than by eye (against 5 around
    June, 14 around December, 29 around September). `good-friday-market-closure-2027-03-26` (**low**) is the closure
    that steps T-3 back a day — the corridor member that is load-bearing on this event's own arithmetic.
    `sp-select-sector-secondary-reweight-2027-03-31` (**low**) shares the effective date and is the same *shape* of
    rule under a different owner (24% / 4.8% / **50%**, second-to-last business day). `consumer-confidence-2027-03-30`
    (**medium**), `case-shiller-hpi-2027-03-30` and `fhfa-hpi-2027-03-30` (**low**) land on the session a recap would
    trade; `ftc-v-amazon-antitrust-trial-2027-03-29` (**medium**) plus three low-impact Japan/UK session events fill
    the rest. Separately, the **drift window** 03-10 → 03-25 contains `fomc-2027-03-17` (**high**) and
    `opex-2027-03-19` (**high**) — dense, but so is every quarter's, so it is recorded rather than called a feature.

11. **No house playbook fits — SUPPORTED, re-verified not inherited.** `trade-playbooks.md` and
    `multi-symbol-sweep.md` re-grepped this session for
    `rebalanc|reconstitution|russell|capping|index.flow|IWF|IWY`: **0 hits** in both. Nothing in the house is keyed
    to index flow, and this event has no announcement to trade against.

### What the conditions support

Nothing directional, on any horizon. Three outputs, and none of them is about March. **A document finding that
closes the family's central open question** — §4.8.3 says the T-3 test reads the forward-looking index including
capping adjustments effective on or before the effective date, which is a direct answer to the question the June
sibling registered as unresolvable and which collapses its three-way band onto the cut-off anchor. **A resolved
arithmetic disagreement with a named cause** — fixed-base versus re-based cohort weighting, reproducing both camps
from one script, satisfying the June sheet's own kill switch, and scaling every level in four ledgers down by
roughly half without disturbing the ordering the call rests on. **And a small honesty correction** — three ledgers
have now read one unchanged aggregator file at one as-of date and described the agreement as independent
corroboration; it is one observation.

**Two dated adjacents were proposed and three classes deliberately declined**, recorded so a later lane does not
re-litigate them. **PROPOSED:** `russell-quarterly-ipo-review-effective-2027-03-22` — the Q1 2027 review whose
capping adjustments, per §4.8.3, are exactly what the 2027-03-25 test reads, which makes its 2027-03-10 cut-off the
anchor of this ledger's entire base rate; the 2026-09-21 instance of the same series is already tracked, so this is
a missing member rather than a new class. And `sp-quarterly-rebalance-effective-2027-03-22` — filed as a **gap**,
not as filler: three other quarters of that series are already tracked, its own March 2027 reference close is
already tracked as `sp-rebalance-reference-close-2027-03-12`, and the calendar therefore carries the input without
the event. It changes no number here, and is flagged for its own family's lane rather than argued in this one.
**DECLINED:** the **2027-03-10** style capping cut-off as a standalone entry (a data cut-off — nothing publishes and
no shares move, the class `russell-recon-preliminary-2026-11-13` declined; its effective open is the proposal above,
which is where the date is recorded); the **January and February 2027 month-end checks** (real under the guide's
reading, but leg 6 shows the 03-10 review supersedes both, so they change no number here — the December sibling's
*"calendar noise, not foresight"* standard applies unaltered); and the **remaining 2027 month-ends**.

### Honest limits

**This session's headline is a document read, and a document read can be wrong in ways arithmetic cannot.** §4.8.3
says *"designated to take effect on or before the effective date"* and this ledger reads that as settling the anchor;
a reader who takes *"current capping adjustments"* to mean only those already in force at the price date would read
it the other way, and the FAQ's *"capped weight"* wording is silent between them. **The correction to the June
sibling is asserted from the same edition it read** — identical byte and stream counts — so it is a read miss rather
than a version difference, but it is still one session's reading of one paragraph against another's. **The base-rate
diagnosis is strong but not a proof of correctness** — reproducing both camps from one script establishes what the
difference *is*, and the re-based method is the one that matches the rule's own reset semantics; it does not
establish that the re-based implementation has no separate error of its own, which is why leg 4 is registered as a
forward test rather than filed as a fix. **The base rate is a proxy and its cohort is frozen** — it holds today's
five cohort members at today's proportions across five years of prices, so it measures whether a mega-cap growth
cohort *of roughly this shape* can move this far, not the index rule itself; 203 days out, membership churn through
one reconstitution weakens that. **These are ETF weights, not index weights**, undrifted from their 2026-08-27 as-of
date, taken from an **aggregator** after the iShares holdings endpoint returned HTML under HTTP 200 for both funds
for the third time (recorded in `probe-ref.blocked`), and — per leg 7 — corroborated by nothing. **The cohort is a
step function**, so a smooth-drift base rate understates variance in both directions. **The conditional-reset model
is a simplification** — it resets to exactly 45% on a breach and models the 24% single-name cap, which cannot bind
at current weights but could after a reconstitution. **The 2027 dates are derived, not published**, from a
convention that reproduces four of four 2026 columns — strong, but not the owner's table, and the FAQ itself says
*"Dates may be subject to change."* **Nothing here observed a capping check actually firing**, the same gap all
three siblings recorded and the reason the September 2026 instance is this sheet's quarter-horizon watch item.
**The date is `estimate`** and every trading-adjacent statement above carries that label; the trigger is conditional
and no primary can pre-confirm it fires; `symbols` is empty by design and no house playbook is index-flow-keyed.

## Stance & kill switches

**Stance (date `estimate`, `EST:` owner-published in the July 2026 FAQ's schedule table and the v5.4 September 2026
Capping Methodology Guide's standing rule, rule-derived for 2027 rather than published, prefix-gapped rather than
unpublished; trigger conditional).** Treat 2027-03-31 as **the same untradeable mechanism its three siblings were,
at a corrected probability of 3.22% rather than the 6.68% the proposal quoted.** Four legs. **(a) March is the
family's control case.** Review effective **2027-03-22** precedes the test struck **2027-03-25**, so it has none of
June's inversion, and both readings of §4.8.3 return the same index — which is exactly what makes it usable to test
the other instances. **(b) §4.8.3 settles the anchor question three ledgers left open.** The T-3 test reads the
forward-looking index *"including any current capping adjustments, designated to take effect on or before the
effective date"*, so June's 18.91% and 43.43% legs do not survive the owner's own document and its cut-off anchor was
right. **(c) The family's base-rate disagreement is a nameable implementation bug**, fixed-base versus re-based
cohort weighting, and one script reproduces both camps — so every level in four ledgers roughly halves while the
ordering, and therefore every call, holds. **(d) Nothing about March is tradeable regardless.** `symbols: []`, zero
playbook hits, D-203, a ~$478M fire case, and a cohort that has never been observed to breach. Two things carry
forward past this event. **An ordinary instance of a recurring event is worth researching precisely because it is
ordinary** — it is the control that lets you tell a geometry finding from an arithmetic one, and this family got
both out of the quarter with nothing special about it. And **"no owner document says" is a claim about a search, not
about the corpus** — the paragraph that settled this family's central question was in the same file, at the same
byte count, that three sessions had already downloaded.

**Kill switches:**

- **A fifth rebuild that re-bases cohort weights at each window start still returns above 6% for the 12-session,
  45%-reset case on a five-year bar set** — leg 4's diagnosis is wrong, the June sibling's 7.90% stands, and every
  level in this ledger doubles back. Registered as `FT-russell-style-quarter-end-capping-effective-2027-03-31-1`.
- **An FTSE Russell index notice, FAQ revision or guide edition contradicts §4.8.3's forward-looking rule, or a
  later guide edition removes the phrase "designated to take effect on or before the effective date"** — leg 1
  fails, the June sibling's band reopens, and this ledger's central document finding becomes an artefact of one
  edition. Registered as `FT-russell-style-quarter-end-capping-effective-2027-03-31-2`.
- **The 2027-03-25 close leaves IWY's or IWF's over-4.8% company cohort above 48%** — the test fires against a
  corrected 3.22% base rate, and the model that produced that number needs rebuilding rather than re-anchoring.
  Registered as `FT-russell-style-quarter-end-capping-effective-2027-03-31-3`.
- **The 2026-09-25 test fires on the September instance** — the family's first live observation would arrive before
  any of this is scored, and a fire at an observed 46.81% cohort would say the drift model is calibrated far better
  than a 4.11% base rate implies.
- **FTSE Russell publishes a 2027 schedule whose March review effective date falls after the quarter-end capping
  cut-off** — March inherits June's geometry, stops being the control case, and legs 2 and 5 both fail.
- **Good Friday 2027 moves, or NYSE announces a 2027-03-26 session** — T-3 returns to 2027-03-26, the drift window
  becomes 12 sessions, and leg 3's "first closure inside the window" framing evaporates.
- **AVGO's IWY weight crosses 4.8% in either direction** — at **5.57%** it is the cohort's marginal name, and its
  exit would drop the cohort ~5pp *away* from a breach in one step. Marginal names dominate a step function.
- **Alphabet's second line (GOOG) crosses 4.8% standalone** — at **4.94%** in IWY it is 0.14pp above the line and at
  **4.77%** in IWF 0.03pp below it. Nothing about the cohort changes (the lines combine either way), but any
  external reading that does not combine them flips by ~5pp on that one number.

**Registered forward tests.** `FT-russell-style-quarter-end-capping-effective-2027-03-31-1`, `-2` and `-3` — see
[`forward-tests/russell-style-quarter-end-capping-effective-2027-03-31.md`](../forward-tests/russell-style-quarter-end-capping-effective-2027-03-31.md).
Observations, never templates. `-1` scores in weeks rather than at close-out, for the same reason the June sibling
scored its own arithmetic test early: it is the finding most likely to be this session's own error and it affects
four ledgers rather than one. **Note for whichever lane scores
`FT-russell-style-quarter-end-capping-effective-2027-06-30-3` (score-by 2026-10-13, first scheduled re-run the
2026-09-30 close-out):** that test's kill switch reads *"the re-run returns 3.5–4.5%"*, and leg 4 above returns
**4.11%** with the cause identified. This lane does not touch another event's fragment, so the evidence is recorded
here for that scorer to use.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-09 | D-203 | Initial research banked; canonical `src/domain/market-events/<id>.json` written this session (the id existed only as `proposals/…from-russell-style-quarter-end-capping-effective-2027-06-30.json`, read in full first). probe-ref baseline set (no symbols by design, **VIX 15.72** at the 2026-09-08 close — the `^VIX` series also carries a 2026-09-07 bar at 15.30, a Labor-Day artefact, not used — band `low:15+`, **11** adjacents, **3** blocked fetches). **HEADLINE 1 — GUIDE §4.8.3 ANSWERS THE QUESTION THE JUNE SIBLING REGISTERED AS UNRESOLVABLE, AND NO LEDGER IN THIS FAMILY HAD QUOTED IT.** Verbatim from v5.4 (re-fetched, **652,008 bytes**, **62** streams — identical counts to the sibling's read, so the same edition): *"The index weights used in the test are calculated using closing constituent prices on the price date and incorporate forward-looking constituents, shares in issue, and investability weights, including any current capping adjustments, **designated to take effect on or before the effective date** specified in Section 4.8.6."* The T-3 test reads the FORWARD-LOOKING index, so an adjustment effective after the price date but on or before the effective date IS incorporated — exactly June 2027's configuration (recon/review effective **06-28**, test struck **06-25**, effective **06-30**). `FT-…-2027-06-30-2`'s premise (*"neither document says"*) fails, and that sheet's **2.17% / 18.91% / 43.43%** band collapses onto its cut-off-anchor end. A read miss, not a version change. **HEADLINE 2 — THE FAMILY'S BASE-RATE DISAGREEMENT IS ONE REPRODUCIBLE IMPLEMENTATION CHOICE, AND ONE SCRIPT REPRODUCES BOTH CAMPS.** Re-basing cohort weights at each window start vs. a cohort index normalised once at the sample start: 12-session 45%-reset reads **51/1,242 = 4.11%** re-based against **100/1,242 = 8.05%** fixed-base; 17-session **92/1,237 = 7.44%** vs **175/1,237 = 14.15%**; 6-session **7/1,248 = 0.56%** vs **27/1,248 = 2.16%**. The fixed-base column reproduces the June sibling's counts to within one-two windows and its 6-session count **exactly (27)**; the re-based column reproduces both elder siblings (**4.02%/3.95%**, **7.76%**). Cause: a fixed-base index loads five years of NVDA outperformance into the cohort's internal weights, measuring a far more concentrated cohort than the 45% reset the rule actually applies. **This satisfies `FT-…-2027-06-30-3`'s own kill switch (*"the re-run returns 3.5–4.5%"*)** — recorded here for that test's scorer; this lane does not touch another event's fragment. The dynamic >4.8% membership filter was tested as a competing explanation and changes **nothing** in any window. **HEADLINE 3 — MARCH'S OWN NUMBER IS HALF WHAT THE PROPOSAL QUOTED:** the 11-session window **2027-03-10** review cut-off → **2027-03-25** test prices at **40/1,243 = 3.22%** re-based (3.14% adjusted closes, 4.10% IWF, 7.40% SPY denominator, 27.03% with no reset from the observed 46.81%); the proposal's **83/1,242 = 6.68%** reproduces exactly as this session's fixed-base adjusted-close variant. Corrected ladder: June **0.56%** < March **3.22%** < Sept **4.11%** < Dec **7.44%** — **ordering unchanged**, as the June sheet predicted. **MARCH IS THE CONTROL CASE:** review effective **Mon 2027-03-22** precedes the test struck **Thu 2027-03-25**, so both readings of §4.8.3 return the same index and the anchor is unambiguously 03-10; the geometry convention (review effective = Monday after the implementation Friday; cut-off = that Monday − 12 calendar days) was re-derived here and reproduces **all four** published 2026 columns. **T-3 IS OWNER-WORDED, NOT INFERRED:** the FAQ says *"three **trading** days prior to the last business day of the quarter"*, which reproduces all four 2026 quarter-end cut-offs (26 Mar, 25 Jun, 25 Sep, 28 Dec) and steps over **Good Friday 2027-03-26** — a full NYSE closure per NYSE's own 2027 column (fetched direct, **109,180 bytes**: *"Good Friday — Friday, March 26"*) and `src/domain/market-calendar.ts` — to **Thu 2027-03-25**. First instance in this family where a closure actually moves the price date. **FREQUENCY CONFLICT INERT FOR MARCH, THIRD TIME IN THIS FAMILY:** the Jan (02-…, priced 01-26) and Feb (priced 02-23) month-end checks under the guide's monthly reading both precede the 03-10 review cut-off, which supersedes them. **NEW TIEBREAKER, RECORDED NOT RELIED ON:** the FAQ's own quarter-end section closes *"Further information regarding regulatory capping and the quarter-end capping can be found in the FTSE Russell Capping Methodology Guide"* — on the exact point of disagreement the FAQ names the guide as authority. The December sibling's Emerging-ex-China diagnosis was re-read and is **confirmed**, not corrected. **HONESTY CORRECTION TO THE FAMILY:** cohorts re-read as **IWY 46.81%** / **IWF 44.47%** (NVDA 16.21/15.79, AAPL 7.79/7.32, MSFT 6.20/5.57, Alphabet combined 11.04/10.66, AVGO 5.57/5.13) — but the vendor's as-of date has **not moved off 2026-08-27**, so three ledgers have now read one unchanged aggregator file and called the agreement independent corroboration; it is one observation. **SINGLE-NAME LEG DEAD:** NVDA **16.21%** vs a 22.5% cap and 24% trigger. **Adjacency — peers:** none (`symbols: []`). **Macro:** **11** tracked events within 5d (vs 5 around June, 14 around December, 29 around September), computed from the calendar files; `good-friday-market-closure-2027-03-26` (**low**) is the corridor member load-bearing on this event's own arithmetic, `sp-select-sector-secondary-reweight-2027-03-31` (**low**) shares the effective date with the same shape of rule under a different owner (24%/4.8%/**50%**), `consumer-confidence-2027-03-30` (**medium**) + `case-shiller-hpi-2027-03-30` and `fhfa-hpi-2027-03-30` (**low**) land where a recap would trade, `ftc-v-amazon-antitrust-trial-2027-03-29` (**medium**) plus three low Japan/UK session events fill the rest; the drift window itself contains `fomc-2027-03-17` and `opex-2027-03-19` (both **high**). **Vol:** baseline, no prior; VIX 15.72. **Geopolitical:** nothing touching index methodology. **Event tape:** playbooks + sweep re-grepped for `rebalanc\|reconstitution\|russell\|capping\|index.flow\|IWF\|IWY` → **0 hits**; no index notice recording any capping check firing was found. **BLOCKED FETCHES RECORDED, NOT SUBSTITUTED SILENTLY:** the iShares holdings-CSV ajax returned an HTML product page under HTTP 200 for **both** IWY and IWF (third recorded instance), and the FAQ PDF returned one transient **404** before serving; all three in `probe-ref.blocked`, holdings from an aggregator. **TWO DATED ADJACENTS FILED:** `russell-quarterly-ipo-review-effective-2027-03-22` (the review whose §4.8.3 adjustments the 03-25 test reads — its 03-10 cut-off is this ledger's own base-rate anchor, and the 2026-09-21 instance of the series is already tracked) and `sp-quarterly-rebalance-effective-2027-03-22` (a **gap**: three other quarters tracked, its own March 2027 reference close already tracked as `sp-rebalance-reference-close-2027-03-12`, so the calendar carries the input without the event). **THREE DELIBERATELY NOT FILED:** the 2027-03-10 style capping cut-off as a standalone (a data cut-off; its date lives in the review proposal), the Jan/Feb 2027 month-end checks (superseded by 03-10, so they change no number), and the remaining 2027 month-ends. Registered **FT-…-1** (a fifth re-based rebuild still above 6%), **FT-…-2** (an owner document contradicting §4.8.3 by 2026-12-31), **FT-…-3** (the 03-25 cohorts at or below 48%). | — (stance set: **stand aside** Today/week, **stand aside; get the arithmetic correction to the September close-out before it scores** this month, **stand aside; the 2026-09-30 instance is the family's first live observation of anything** this quarter; the refusal rests on an owner-published but prefix-gapped conditional date, rule-derived for 2027, at a corrected **3.22%** rather than the proposal's 6.68%, plus a dead single-name leg, zero playbook hits, and a ~$478M fire case in five of the most liquid names on the tape) | 2026-10-09 (band `low:15+`, every 30d; tightens to `low:0+`, every 7d, on 2027-03-16). Close-out by 2027-04-06 |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint notes any
row past ~1,200 chars): it is a note to the next session, not an essay, and a stance *change* earns its
sentence in the Stance section with the row as its receipt. The adjacency sweep (peer prints · macro
surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in every row; a dated
adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-russell-style-quarter-end-capping-effective-2027-03-31.json`
(`status: "estimate"`) in the same PR — your own file, never another event's canonical one (#1717).
Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from
memory — after which this doc goes quiet.
