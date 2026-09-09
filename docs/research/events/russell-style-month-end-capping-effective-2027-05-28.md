# Russell US Style May recapping — the instance that adjudicates the family's arithmetic, and reverses one of its declines — russell-style-month-end-capping-effective-2027-05-28

**Kind:** sector · **Date:** 2027-05-28 (estimate — **EST: owner-published, both documents re-fetched and re-inflated independently this session.** FTSE Russell, *Capping Methodology Guide*, **v5.4, September 2026** (`capping-methodology-guide.pdf`, HTTP 200, **652,008 bytes**, **62** content streams inflated in-session 2026-09-09 — byte count, stream count and version number all reproduce the four sibling ledgers exactly, so the guide has **not** been revised in the day since they read it), whose section 4.8.6 gives every **Russell US Style** row frequency **"Monthly"**, price date **"T-3"**, effective date **"Last business day of each month"** (footnote 3), trigger **"No company is greater than 24%, and all companies that have a weight greater than 4.8% in aggregate are no more than 48% of the index"**, scheme **"Rule 4.2/RIC 22.5/45"**, and whose **section 4.8.4** reads verbatim **"If none of the applicable trigger thresholds are breached, no change is implemented as a result of the additional capping check"** — the clause this sheet's second headline turns on. Contradicted, still, by FTSE Russell, *Frequently Asked Questions — Russell US Equity Indexes*, **July 2026** (`ftse-faq-document-russell-us-equity-2026.pdf`, HTTP 200, **198,134 bytes**, **19** streams), whose prose reads **"The review is conducted quarterly (March, June, September, and December)"** — if the FAQ governs, this event does not exist. The 2027 dates are **rule-derived, not published**, and the derivation was re-run mechanically here rather than inherited: Memorial Day 2027 falls on **Monday 2027-05-31**, so the last business day of May 2027 is **Friday 2027-05-28**, and a T-3 business-day walk back returns **Tuesday 2027-05-25**. The same walk over the same 2027 closure set reproduces the sibling lanes' published 2027-03-25, 2027-04-27 and 2027-06-25 derivations, and the closure set itself reproduces this repo's `src/domain/market-calendar.ts` on all ten 2027 full closures. Stays `estimate` because this calendar's confirmed-tier prefixes have no member for an index owner's own methodology, because this lane may not self-confirm an event it discovered in-sweep, and because the owner's two documents still disagree on whether the check happens at all) · **Impact:** low
**Last assessed:** 2026-09-09
<!-- probe-ref: {"symbols":{},"vix":15.72,"daysBand":"low:15+","adjacentIds":["consumer-confidence-2027-05-25","fhfa-hpi-2027-05-25","beige-book-2027-05-26","sifma-bond-early-close-2027-05-28","fomc-blackout-start-2027-05-29","memorial-day-market-closure-2027-05-31"],"screenStreak":0,"blocked":[{"url":"https://www.ishares.com/us/products/239720/ishares-russell-top-200-growth-etf/1467271812596.ajax?fileType=csv&fileName=IWY_holdings&dataType=fund","status":"200-html-not-csv","at":"2026-09-09"},{"url":"https://www.ishares.com/us/products/239706/ishares-russell-1000-growth-etf/1467271812596.ajax?fileType=csv&fileName=IWF_holdings&dataType=fund","status":"200-html-not-csv","at":"2026-09-09"}]} -->

## At a glance

**TL;DR.** **Stand aside — and take away two things that are worth more than this date is.** This family has been split down the middle on its own arithmetic: three lanes (September, December, October) published a **~4%** breach rate for the 12-session post-reset leg, and two (November, June) published **~7.9%** for the same leg and registered the disagreement as an open forward test asking a further lane to break the tie. **This session is that lane, and it lands at 51/1,269 = 4.02% — the majority side, to two decimals.** More useful than the verdict is *where* the split lives: on the four **long**-window legs this session reproduces the very lanes it disagrees with, to within **0.5–2.3pp** (34-session 19.17% vs 19.61%; 54-session 20.78% vs 18.49%; 74-session monthly 17.32% vs 18.91%; quarterly 44.24% vs 43.43%). **The disagreement is confined to short windows, so whatever causes it is a short-window artefact, not a global scaling error** — which is a far more specific instruction to the next lane than "the levels do not reconcile." Second, **this sheet reverses a decline made by the lane that filed it.** The June ledger declined the 2027-04-27 April check because it "changes no number here — the 05-25 check resets after it either way." That is the reset fallacy the November lane already refuted from guide §4.8.4: a conditional check resets only in the paths where it fires, and the 05-25 check fires in **20.28%** of them. Measured, the April check is worth **16.45pp** to this event's own breach probability (**36.73% → 20.28%**) and **11.93pp** to June's — so it is proposed as a new file in this PR. **The proposer's reason for filing this date does survive:** the monthly-vs-quarterly fork prices the June test at **17.32% vs 44.24%**, and this check carries **14.99pp** of that 26.92pp spread, the larger half. **None of it licenses a position.** Date `estimate` on a rule the owner's own two documents dispute, conditional trigger, `symbols: []`, **zero** house-playbook hits, D-261, a dead single-name leg (NVDA **16.21%** against a 24% trigger), and a fire case worth ~**$475M** implementing into a month-end close measured **31.6%** thinner than normal, because Memorial Day 2027 lands *after* month-end and pulls the effective open onto the Friday of a three-day weekend.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** | High | D-261, `symbols: []`, a date the owner publishes nowhere and a trigger that is conditional on a cohort no member can observe intraday. Every input to the 2027-05-25 test is re-struck at least four times first — the **2026-09-09**, **2026-12-02** and **2027-03-10** review cut-offs and the **2027-03-25** and **2027-04-27** conditional checks | FTSE Russell publishing a guide edition past **v5.4**, or an FAQ revision restoring quarterly wording for the section 4.8.6 Russell US Style rows, before **2026-12-31** — this event stops existing rather than moving, and the entry is withdrawn rather than researched |
| This week | **Stand aside** | High | Nothing in this family lands inside it. The nearest dated milestone is the **2026-09-09** quarterly Russell US Style capping cut-off — today, a data cut-off that publishes nothing, and it belongs to `russell-style-quarter-end-capping-effective-2026-09-30`, not here | Any dated report of a *Russell US Style* index being recapped between **2026-09-09** and **2026-09-15** outside that published cut-off — meaning neither owner document describes the whole rule |
| This month | **Stand aside; treat this family's base rates as ~4%, not ~8%** | Medium | The open question this session could actually close was the family's own: five lanes, two published levels, a 2× gap. A sixth measurement lands at **4.02%** against the majority's **3.95–4.02%**, and reproduces the dissenting lanes' *long*-window legs to within 0.5–2.3pp — so the disagreement is a short-window artefact and the majority levels stand. A method result, not a position | A further independent rebuild of the 12-session, 45%-reset, IWY-denominator leg returning **7.8–7.9%** before **2026-12-31** — this session joins the minority, and the levels in three ledgers halve rather than the two in the other |
| This quarter | **Stand aside; watch 2026-10-30 for the tape's first word on the cadence** | Medium | Everything in this 2027 chain is derived from a "Monthly" table cell the owner's own FAQ contradicts. The **2026-10-30** month-end check is the family's first instance that is not also a quarter-end, so it is the first date on which the monthly reading can leave an observable trace. Until it does, this event is a rule reading, not a scheduled event | An FTSE Russell index notice recording a Russell US Style recap effective **2026-10-30** — the monthly cadence is confirmed from the tape rather than a table, and this whole 2027 chain is promoted from derived to real |

**Signals & conditions** — the buy/sell/hold triggers:

- Date is `estimate` — **owner-published but prefix-gapped, and rule-derived for 2027 rather than published** — and the trigger is **conditional**. It widens caution about the 2027-05-25/05-28 closes and licenses **no** date-keyed action.
- **The family's arithmetic dispute is settled on the majority side: 51/1,269 = 4.02%** for the 12-session leg, against the September/December/October lanes' 3.95–4.02% and the November/June lanes' 7.85–7.90%.
- **And the split is localised: long windows agree, short windows do not.** 34-session **19.17%** vs 19.61% · 54-session **20.78%** vs 18.49% · 74-session monthly **17.32%** vs 18.91% · quarterly **44.24%** vs 43.43%.
- **Five estimator variants were tried and none reconstructs 7.85%** — endpoint 4.02%, touch-anywhere 5.04%, arithmetic spread 4.18%, adjusted closes 3.94%, SPY denominator 8.83% (and the November lane's own SPY variant was 12.98%, so that is not the explanation either).
- **This event's own anchor is the 2027-03-10 March review cut-off — 53 sessions — not the April check.** Path-simulated with conditional resets at sessions 11 and 33: **20.28%** (IWY), **19.63%** (IWF). Regime range **10–20%**.
- **The June lane's decline of the April check is measurably wrong, and it is proposed here.** Modelling it removes **16.45pp** from this test (36.73% → 20.28%) and **11.93pp** from June's (44.24% → 32.31%).
- **The proposer's filing rationale is SUPPORTED.** Of the 26.92pp monthly-vs-quarterly fork on the June test, this check carries **14.99pp** and April **11.93pp**.
- **A conditional reset is not monotone, and the next lane should expect it.** Modelling April *and* May raises June's breach probability to **17.32%** from the **15.74%** that modelling May alone gives — an April firing re-anchors at 45% and thereby stops the May check firing.
- **Memorial Day 2027 lands after month-end, uniquely in this family.** Monday **2027-05-31** is a full closure, so the effective open is **Friday 2027-05-28**, immediately before a three-day weekend. The last year with that geometry was **2021**, where SPY traded **58.5M** on 2021-05-28 against an 85.5M month-end median — **31.6% thinner**.
- **The single-name leg is dead everywhere** — NVDA is **16.21%** (IWY) / **15.79%** (IWF) against a 22.5% cap and a 24% trigger.
- **Company lines combine** — Alphabet counts once at **11.04%** (IWY) / **10.66%** (IWF); GOOG standalone is **4.94%** / **4.77%**, so a security-level read drops its second line under the 4.8% line and understates each cohort by ~5pp.
- **The corridor is thin but two of its six members sit on the test's own price date** — `consumer-confidence-2027-05-25` (**medium**) and `fhfa-hpi-2027-05-25` (**low**) land on the 05-25 close the test is struck from.
- Chain: March review cut-off **2027-03-10** → March review effective open **03-22** → conditional quarter-end test **03-25** *(T-3 stepping over Good Friday 03-26)* → conditional month-end test **04-27** → **conditional month-end test struck 05-25 (T-3)** → recap trades the **05-27** close → **effective open 2027-05-28** → June review cut-off **06-16** → June test **06-25**.

## Initial research

### The question

This id reached the calendar as a single proposal from the
[`russell-style-quarter-end-capping-effective-2027-06-30`](russell-style-quarter-end-capping-effective-2027-06-30.md)
initial research, filed as the **one deliberate exception** to the December lane's decline of the whole 2027 month-end
class. Its stated reason was specific and testable:

> this instance is not calendar filler, it is THE DISCRIMINATING INPUT to an event this calendar already tracks …
> those two readings price the June test at 223/1,179 = 18.91% and 512/1,179 = 43.43% — a 2.3x spread that turns
> entirely on whether this event happens.

At the same time, two lanes in this family had registered an unresolved dispute about the arithmetic underneath every
one of those numbers — `FT-russell-style-month-end-capping-effective-2026-11-30-3` and
`FT-russell-style-quarter-end-capping-effective-2027-06-30-3` both ask, in almost the same words, for a further
independent rebuild to break a 2× tie between three lanes at ~4% and two at ~7.9%.

**So this session had two jobs, and the second one is not about this date at all: does the proposer's rationale for
filing this event survive measurement, and — since a lane researching this instance has to rebuild the same estimator
anyway — which side of the family's arithmetic split is right?**

**One-line verdict:** the rationale survives (this check carries **14.99pp** of the 26.92pp fork, the larger half), the
arithmetic lands on the **majority** side at **4.02%** with the disagreement localised to short windows only, and along
the way the proposing lane's own decline of the April check turns out to rest on the reset fallacy this family refuted
one instance earlier — worth **16.45pp** here, so it is proposed as a new file in this PR.

### Method

Macro / market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — the entry carries
`symbols: []`, so no symbol-keyed instrument applies and `scripts/research/` has no index-flow instrument. **Nothing
was inherited.** Every document was re-fetched, every date re-derived from a holiday set built independently, and the
family's base-rate estimator re-implemented from its stated definition rather than from any lane's code.

- **The proposal was read in full first**
  (`proposals/russell-style-month-end-capping-effective-2027-05-28.from-russell-style-quarter-end-capping-effective-2027-06-30.json`),
  per the "your own event was proposed by others" rule — it was the only proposal carrying this id — then the canonical
  `src/domain/market-events/russell-style-month-end-capping-effective-2027-05-28.json` was written by this session.
- **FTSE Russell Capping Methodology Guide, v5.4, September 2026** — re-fetched (HTTP 200, **652,008 bytes**), text
  recovered by inflating its **62** content streams in-session. Byte count, stream count and version all reproduce the
  sibling reads of 2026-09-08 exactly, which is this session's check that the December and November lanes' "a guide
  version past v5.4" kill switch has **not** fired.
- **FTSE Russell FAQ, July 2026** — re-fetched (HTTP 200, **198,134 bytes**, **19** streams) from the `lseg.com` dam
  `policy-documents` path.
- **iShares product screener** (`product-screener-v3.1.jsn`, HTTP 200, **1,900,528 bytes**) — AUM for all eight funds,
  read this session and **not** equal to the siblings' read a day earlier (below).
- **Vendor holdings — blocked again.** The iShares holdings-CSV ajax returned an HTML product page under HTTP 200 for
  both IWY and IWF, the same failure all four siblings recorded; both are in `probe-ref.blocked` and holdings came from
  an **aggregator** (as of **2026-08-27**), a provenance downgrade stated here rather than hidden.
- **Yahoo daily bars** — NVDA, AAPL, MSFT, GOOGL, GOOG, AVGO, IWY, IWF, SPY, `^VIX`; **1,281** usable sessions
  (2021-08-02 → 2026-09-08), in adjusted and unadjusted form. A separate 2021 SPY pull was taken for the Memorial-Day
  geometry, which predates the five-year window.
- **The 2027 NYSE closure set** was written from the statutory rules and then checked against this repo's own
  `src/domain/market-calendar.ts` — all ten full closures agree, including Good Friday **2027-03-26**, Memorial Day
  **2027-05-31** and Juneteenth-observed **2027-06-18**.
- **This repo** — the corridor computed from the calendar files rather than by eye; `trade-playbooks.md` and
  `multi-symbol-sweep.md` re-grepped for `rebalanc|reconstitution|russell|capping|index.flow|IWF|IWY` → **zero hits**.

### Conviction legs, tested

1. **HEADLINE — the family's arithmetic dispute resolves on the majority side, and this session is the tie-breaker two
   ledgers asked for — SUPPORTED.** Re-implementing the estimator from its stated definition — the over-4.8% company
   cohort held at fixed **weights measured at the window anchor**, grown against its own fund's return, breaching 48%
   from a 45% post-review reset when it beats the fund by 48/45 = **+6.67%**:

   | Leg | Sep lane | Dec lane | Oct lane | Nov lane | Jun lane | **This session** |
   |---|---|---|---|---|---|---|
   | 12-session, 45% reset, IWY | 4.02% | 3.95% | 3.95% | 7.85% | 7.90% | **51/1,269 = 4.02%** |
   | 17-session, 45% reset, IWY | — | 7.76% | 7.77% | 14.16% | 14.24% | **92/1,264 = 7.28%** |
   | 17-session, 45% reset, IWF | — | 8.97% | 8.98% | — | — | **110/1,264 = 8.70%** |
   | 12-session, no reset (46.81%) | 28.96% | 29.07% | — | — | 35.05% | **376/1,269 = 29.63%** |

   Four legs, all landing on the majority reading, the headline one to two decimals.

2. **HEADLINE — and the disagreement is confined to SHORT windows, which is the finding the next lane can actually use
   — SUPPORTED.** On every **long**-window leg, this session reproduces the two lanes it just disagreed with:

   | Long-window leg | Published by | Published | **This session** | Gap |
   |---|---|---|---|---|
   | 34-session path, reset at 12 | October | 19.61% | **239/1,247 = 19.17%** | 0.44pp |
   | 54-session path, resets at 12, 34 | November | 18.49% | **255/1,227 = 20.78%** | 2.29pp |
   | 74-session, monthly cadence | June | 18.91% | **209/1,207 = 17.32%** | 1.59pp |
   | 74-session, quarterly cadence | June | 43.43% | **534/1,207 = 44.24%** | 0.81pp |

   A lane whose estimator were globally mis-scaled by 2× could not land within 0.5pp of another lane's 34-session
   number. **So the 2× gap is a short-window artefact.** Five variants were tried against the 12-session leg and none
   reconstructs 7.85%: endpoint (the correct reading of §4.8.3, which tests a single close) **4.02%**, touch-anywhere
   **5.04%**, arithmetic spread rather than ratio **4.18%**, adjusted closes **3.94%**, SPY as denominator **8.83%** —
   and the November lane reported its own SPY variant at 12.98%, so that is not it either. One concrete failure mode is
   worth naming because this session hit it before catching it: a cohort built from fixed **shares** proportional to
   weight, rather than fixed **weight at the window anchor**, returns **0.24%** on the same leg. That is the class of
   error that produces exactly this signature — right at long horizons, wrong at short ones — and it is offered as a
   place to look, not as an accusation.

3. **HEADLINE — the proposing lane's decline of the 2027-04-27 April check rests on the reset fallacy this family
   already refuted, and it is worth 16.45pp here — REFUTED (the decline, not the event).** The June ledger's words:
   *"the 2027-04-27 month-end check (real under the guide's reading, but it changes no number here — the 05-25 check
   resets after it either way)."* Guide **§4.8.4**, extracted verbatim this session:

   > **4.8.4** If none of the applicable trigger thresholds are breached, **no change is implemented as a result of the
   > additional capping check.** If the trigger thresholds are breached, the index is recapped using the standard review
   > capping methodology and target capping level specified in Appendix A.

   This is the same clause `russell-style-month-end-capping-effective-2026-11-30` made its headline out of — *a
   conditional check is a test, not a reset.* The 05-25 check fires in **20.28%** of paths, so it "resets after it"
   in about one path in five. Measured:

   | Quantity | Without the April check | With it | Difference |
   |---|---|---|---|
   | This event's own 2027-05-25 test (IWY) | 451/1,228 = **36.73%** | 249/1,228 = **20.28%** | **16.45pp** |
   | The 2027-06-25 June quarter-end test (IWY) | 534/1,207 = **44.24%** | 390/1,207 = **32.31%** | **11.93pp** |

   A calendar carrying the May and June tests but not the April one mis-states both by double digits. It is therefore
   proposed in this PR as
   `proposals/russell-style-month-end-capping-effective-2027-04-30.from-russell-style-month-end-capping-effective-2027-05-28.json`
   — named for its **effective** date (Friday 2027-04-30) per the family's own convention, with the 04-27 price date in
   the title. **The general form, and the reason to write it down twice:** the November lane banked *"a conditional
   check is not a reset"* and the June lane, four instances later, declined a date by assuming one. A carry-forward
   that lives only in the ledger that discovered it does not reach the lane that needs it.

4. **The proposer's filing rationale survives measurement — SUPPORTED, and it is the larger half.** Decomposing the
   monthly-vs-quarterly fork on the June test, all from the same 2027-03-10 anchor over 74 sessions:

   | Reading | Resets modelled | Base rate |
   |---|---|---|
   | FAQ's quarterly cadence — March check only | 11 | 534/1,207 = **44.24%** |
   | Guide's monthly cadence, April check added | 11, 33 | 390/1,207 = **32.31%** |
   | Guide's monthly cadence, **April + May (this event)** | 11, 33, 53 | 209/1,207 = **17.32%** |

   The fork is **26.92pp** wide; this check carries **14.99pp** of it and April **11.93pp**. So the proposal's claim —
   that this instance is the discriminating input to an event the calendar already tracks — is **supported**, with the
   correction that it is the larger half rather than the whole, and that the other half was declined by the same lane.

5. **A conditional reset is not monotone, and this is stated up front so a later lane does not read it as an error —
   SUPPORTED.** Modelling **May alone** (resets at 11, 53) gives the June test **190/1,207 = 15.74%**; modelling
   **April and May** (11, 33, 53) gives **209/1,207 = 17.32%** — *higher*. The mechanism is mechanical: an April firing
   re-anchors the cohort at 45% at session 33, which makes the May check less likely to fire from that nearer anchor,
   which leaves the June test measured from session 33 over 41 sessions rather than from session 53 over 21. **Adding a
   conditional reset can raise a downstream test's breach probability.** Nothing in this family has said so, and the
   arithmetic of every multi-check chain in this calendar depends on it.

6. **This event's own geometry, computed rather than asserted — SUPPORTED, and it reproduces four sibling
   derivations.** Sessions counted over the independently built 2027 closure set:

   | Leg | Sessions |
   |---|---|
   | March review cut-off **03-10** → review effective open **03-22** | 8 |
   | March cut-off **03-10** → March quarter-end test **03-25** | 11 |
   | March cut-off **03-10** → April month-end test **04-27** | 33 |
   | **March cut-off 03-10 → MAY test 05-25 (the live anchor)** | **53** |
   | April test **04-27** → May test **05-25** | 20 |
   | May test **05-25** → June quarter-end test **06-25** | 21 |
   | March cut-off **03-10** → June quarter-end test **06-25** | 74 |

   The T-3 business-day walk returns **2027-03-31 → 03-25** (stepping over Good Friday 03-26), **04-30 → 04-27**,
   **05-28 → 05-25** and **06-30 → 06-25** — reproducing every derived 2027 price date in the family, and the 21- and
   74-session figures the June lane published. The last unconditional recap before this test is the **quarterly**
   Russell US Style capping review, whose March 2027 cut-off is **03-10**; by leg 3 the two checks in between are
   conditional, which is why the anchor is 53 sessions and not 20.

7. **The live numbers for this instance — SUPPORTED, with the honest regime range.** Path simulation over the
   1,281-session bar set, starting at a 45% reset on the anchor and applying conditional recaps to 45% at sessions 11
   and 33:

   | Case | Result |
   |---|---|
   | **2027-05-25 test, IWY — the live case** | **249/1,228 = 20.28%** |
   | 2027-05-25 test, IWF (enters 44.47%, below the cap, never recapped; needs +7.94%) | 241/1,228 = **19.63%** |
   | Raw 53-session window, no intervening checks | 473/1,228 = **38.52%** |
   | The April check's own firing probability (33 sessions, reset at 11) | 244/1,248 = **19.55%** |

   Trailing slices on the live case: 5y **20.28%**, 3y **20.03%**, 2y **19.38%**, 12m **10.55%** — an honest range of
   **≈10–20%**, and unusually stable across regimes by this family's standards.

8. **Memorial Day 2027 falls AFTER month-end, which is unique in this family and measurably thins the implementing
   close — SUPPORTED.** Memorial Day is the last Monday of May; in 2027 that is **2027-05-31**, so the last business day
   of May is pulled back to **Friday 2027-05-28** and the effective open sits immediately before a three-day weekend.
   No other instance in this family has that geometry: the last business days of May 2024, 2025 and 2026 were also
   Fridays, but Memorial Day fell *before* month-end in each. The only prior year matching 2027 is **2021**, and it is
   measurable: SPY traded **58.5M** shares on **2021-05-28** against an **85.5M** median across that year's twelve
   month-end sessions — **31.6% thinner**. So a fired recap would implement into a materially quieter month-end than
   the family's other instances, which cuts both ways and is recorded rather than judged.

9. **Scope re-verified from the vendor, and it has moved since yesterday — SUPPORTED.** The iShares product screener
   read this session returns IWF **$125.57B**, IWD $83.37B, IWP $19.58B, IWY **$15.83B**, IWS $15.52B, IWO $14.68B,
   IWN $14.48B, IWX $3.92B = **$292.95B**, against the **$294.61B** all four siblings recorded on 2026-09-08 — down
   **$1.66B (−0.56%)** in one session. Small, but it is the one figure in this family that is not a re-read of the same
   file, and it is why the fire case below is quoted at $475M rather than the siblings' $478M. Cohorts, from holdings
   dated **2026-08-27**, company lines combined per the guide's own rule:

   | Fund | NVDA | AAPL | MSFT | Alphabet (both lines) | AVGO | **Cohort** |
   |---|---|---|---|---|---|---|
   | **IWY** | 16.21% | 7.79% | 6.20% | **11.04%** | 5.57% | **46.81%** |
   | **IWF** | 15.79% | 7.32% | 5.57% | **10.66%** | 5.13% | **44.47%** |

   Identical to all four siblings to the basis point. The combining rule stays load-bearing: **GOOG standalone is 4.94%
   (IWY) and 4.77% (IWF)**, so a security-level read drops Alphabet's second line under the 4.8% line and understates
   each cohort by about 5pp.

10. **The single-name leg is dead by a wide margin — SUPPORTED.** The trigger is **24%** for any one company. NVDA, the
    family's largest weight, is **16.21%** in IWY and **15.79%** in IWF against a 22.5% cap it is nowhere near.

11. **The corridor is thin, and its structure is the interesting part — SUPPORTED.** **6** tracked events sit within
    five days, computed from the calendar files, against 35 around the October instance, 24 around November, 14 around
    December and 5 around June. Two of the six land on **the 05-25 close the test is struck from**:
    `consumer-confidence-2027-05-25` (**medium**) and `fhfa-hpi-2027-05-25` (**low**) — a measurement hazard for anyone
    reading the cohort off that print. `beige-book-2027-05-26` (low) lands at T-2;
    `sifma-bond-early-close-2027-05-28` (low) shares the **effective open**, so the bond market is on a shortened
    session while the recap implements; `fomc-blackout-start-2027-05-29` (medium) opens the day after; and
    `memorial-day-market-closure-2027-05-31` (low) is the Monday closure that put the effective date on 05-28 in the
    first place — the corridor contains its own cause.

12. **No house playbook fits — SUPPORTED, re-verified not inherited.** `trade-playbooks.md` and
    `multi-symbol-sweep.md` re-grepped this session for
    `rebalanc|reconstitution|russell|capping|index.flow|IWF|IWY`: **zero hits** in both. Nothing in the house is keyed
    to index flow, and this event has no announcement to trade against.

13. **Even the fire case is small — SUPPORTED.** A breach recaps the cohort from just over 48% back to 45%: ~3pp of
    IWY's **$15.83B ≈ $475M**, spread across five mega caps, into a month-end close measured ~31.6% thinner than
    normal (leg 8). Were IWF to breach as well, its 3pp is ~**$3.77B**, still under a tenth of a day's volume in each
    name it touches — and IWF's breach requires the larger move (+7.94% against +6.67%), so the joint case is rarer
    than either alone.

### What the conditions support

Nothing directional, on any horizon. Four outputs, and two of them are about the family rather than this date.
**The arithmetic dispute is adjudicated** — a sixth independent rebuild lands at **4.02%**, the majority level, and the
2× gap is localised to short windows because this session reproduces the dissenting lanes' 34-, 54- and 74-session legs
to within 0.5–2.3pp; that is a specific place for the next lane to look rather than a shrug. **A sibling's decline is
reversed with a number** — the April check is worth 16.45pp here and 11.93pp to June, so it is proposed rather than
argued about. **The proposer's rationale is confirmed and sized** — this check carries 14.99pp of the 26.92pp
monthly-vs-quarterly fork, the larger half, which is what "the discriminating input" is worth when it is measured
instead of asserted. **And one estimator property is banked that no lane had stated** — a conditional reset is not
monotone; adding the April check *raises* June's breach probability from 15.74% to 17.32%.

**One dated adjacent was proposed and four classes deliberately declined**, recorded so a later lane does not
re-litigate them. **PROPOSED:** `russell-style-month-end-capping-effective-2027-04-30` (effective Fri 2027-04-30, test
struck Tue 2027-04-27) — leg 3's subject, filed to reverse a measured decline rather than to fill the calendar.
**DECLINED:** the **2027-03-10** and **2027-06-16** style capping cut-offs (data cut-offs — nothing publishes and no
shares move, the class `russell-recon-preliminary-2026-11-13` declined and three lanes have declined since); the
**2027-03-31 March quarter-end check** (already tracked as a proposal,
`proposals/russell-style-quarter-end-capping-effective-2027-03-31.from-russell-style-quarter-end-capping-effective-2027-06-30.json`,
and **not** duplicated); the **remaining 2027 month-ends** (January, February, July onward — the December lane's
"extrapolating a standing rule twelve months out is calendar noise" applies to them in full, because none changes a
number on any event this calendar carries, which is precisely the test this instance and the April one pass); and the
**2027-05-27 recap trade date** (a settlement mechanic inside an event already tracked, not an event).

### Honest limits

**The arithmetic verdict is a count of lanes, not a proof.** Four of six measurements now sit near 4% and two near
7.9%; this session reproduces the majority to two decimals and cannot reconstruct the minority under five variants,
but "I could not reproduce it" is weaker than "I found the bug," and the fixed-share failure mode named in leg 2 is a
hypothesis about where to look, not a diagnosis. **The frequency conflict is unresolved and this event depends on it
entirely** — if the FAQ's quarterly prose governs, this date does not exist, and no index notice was found either
confirming a monthly cadence or recording any month-end recap ever happening. **Nothing here observed a capping check
firing**, the gap all four siblings recorded. **The 2027 dates are derived, not published** — from a T-3 walk and a
holiday set this session built and then checked against the repo, which is strong but is not the owner's table.
**The base rate is a proxy with a frozen cohort** — it holds today's five cohort members at today's proportions across
five years of prices, so it measures whether a mega-cap growth cohort *of roughly this shape* can move this far, not
the index rule itself; 261 days out, with a reconstitution in between, membership churn makes that a weak assumption.
**These are ETF weights, not index weights**, undrifted from their 2026-08-27 as-of date and taken from an
**aggregator** after the iShares holdings endpoint returned HTML under HTTP 200 for both funds (recorded in
`probe-ref.blocked`); they are trusted only because they reproduce four independent sibling reads exactly. **The path
simulation assumes the March 2027 review resets to exactly 45%** and that the only resets in the window are the two
modelled; it ignores the 22.5% single-name cap, which cannot bind at current weights but could after a reconstitution.
**The cohort is a step function**, so a smooth-drift base rate understates variance in both directions — and AVGO at
5.57% is one bad quarter from dropping out of it. **The Memorial-Day liquidity measurement is a single observation**
(2021-05-28) against one year's median, on SPY rather than on the funds that would actually trade the recap. **The
date is `estimate`** and every trading-adjacent statement above carries that label; the trigger is conditional and no
primary can pre-confirm it fires; `symbols` is empty by design and no house playbook is index-flow-keyed.

## Stance & kill switches

**Stance (date `estimate`, `EST:` owner-published in the v5.4 September 2026 Capping Methodology Guide's standing rule,
rule-derived for 2027 rather than published, prefix-gapped rather than unpublished, and with the owner's July 2026 FAQ
prose still in open conflict about the check's frequency; trigger conditional).** Treat 2027-05-28 as **the same
untradeable mechanism all four siblings refused, at a measured ~20% and with the family's own arithmetic finally
adjudicated underneath it.** Four legs. **(a) The dispute two ledgers registered is settled on the majority side.**
A sixth independent rebuild of the 12-session leg returns **51/1,269 = 4.02%** against the September, December and
October lanes' 3.95–4.02% and the November and June lanes' 7.85–7.90%. **(b) And the split is localised, which is the
more useful half.** This session reproduces the dissenting lanes' 34-, 54- and 74-session legs to within 0.5–2.3pp, so
whatever causes the 2× gap acts only at short horizons — five variants were tried and none reconstructs 7.85%.
**(c) The lane that filed this event declined its other half on a fallacy this family had already refuted.** Guide
§4.8.4 makes a conditional check a test rather than a reset, the 05-25 check fires only 20.28% of the time, and
modelling the April check is worth **16.45pp** here and **11.93pp** to June — so it is proposed in this PR rather than
argued about. **(d) None of that makes this tradable.** 20.28% is better than 4-to-1 against on an unhedgeable
conditional reading a cohort no member can observe intraday; the single-name leg is dead (NVDA 16.21% against a 24%
trigger); the fire case moves ~$475M into a month-end close measured 31.6% thinner than normal; `symbols` is empty and
the house playbooks return zero hits. Two things carry forward past this event. **A carry-forward that lives only in
the ledger that discovered it does not reach the lane that needs it** — the November lane banked *"a conditional check
is not a reset"* and the June lane, four instances later, declined a date by assuming one. And **a conditional reset is
not monotone**: adding the April check *raises* June's breach probability from 15.74% to 17.32%, because an earlier
firing re-anchors the cohort and thereby suppresses a later one.

**Kill switches:**

- **A further independent rebuild of the 12-session, 45%-reset, IWY-denominator leg returns 7.8–7.9% rather than
  4.02%** — this session joins the minority, the tie it was meant to break lands 3–3, and the levels in three ledgers
  halve rather than the two in the other. Registered as
  `FT-russell-style-month-end-capping-effective-2027-05-28-2`.
- **The 2027-05-25 close leaves IWY's or IWF's over-4.8% company cohort above 48%** — the check fires, and a sheet that
  called a 20.28% draw a stand-aside has to answer for it. Registered as
  `FT-russell-style-month-end-capping-effective-2027-05-28-1`.
- **An independent rebuild puts the April check's marginal effect on this test below 10pp** — leg 3's reversal was an
  over-correction, the June lane's decline was closer to right than this sheet allows, and the 2027-04-30 proposal
  should be withdrawn rather than researched. Registered as
  `FT-russell-style-month-end-capping-effective-2027-05-28-3`.
- **FTSE Russell publishes a guide edition past v5.4, an index notice, or an FAQ revision restoring quarterly wording
  for the Russell US Style rows in section 4.8.6** — this entry and its April sibling are withdrawn rather than
  researched, and the calendar's four-a-year model was right all along.
- **An index notice records a Russell US Style recap effective 2026-10-30 or 2026-11-30** — the monthly cadence is
  confirmed from the tape rather than a table, and this whole 2027 chain is promoted from a rule reading to a schedule.
  Owned by those lanes' own forward tests, deliberately not re-registered here.
- **FTSE Russell publishes a 2027 schedule whose March review effective date falls after 2027-03-25** — the anchor in
  leg 6 moves, the 53-session window shortens, and every probability on this sheet falls.
- **AVGO's IWY weight crosses 4.8% in either direction** — at **5.57%** it is the cohort's marginal name, and its exit
  would drop the cohort ~5pp *away* from a breach in one step. Marginal names dominate a step function, and a
  53-session window gives this one two months to move.
- **Memorial Day 2027 is observed on a date other than 2027-05-31** — the last business day of May reverts to the 31st,
  the effective open is no longer a pre-holiday Friday, and leg 8's liquidity finding evaporates.

**Registered forward tests.** `FT-russell-style-month-end-capping-effective-2027-05-28-1`, `-2` and `-3` — see
[`forward-tests/russell-style-month-end-capping-effective-2027-05-28.md`](../forward-tests/russell-style-month-end-capping-effective-2027-05-28.md).
Observations, never templates. `-2` and `-3` both score **long before** the event, which is deliberate: neither depends
on this date's outcome, both bear on ledgers other than this one, and the family has already spent two forward tests
waiting on an arithmetic question that any lane can settle in an afternoon.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-09 | D-261 | Initial research banked; canonical `src/domain/market-events/<id>.json` written this session (the id existed only as `proposals/…from-russell-style-quarter-end-capping-effective-2027-06-30.json`, read in full first). probe-ref baseline set (no symbols by design; **VIX 15.72** at the 2026-09-08 close, 20d mean 15.11, 5y mean 19.13; band `low:15+`; **6** adjacents; **2** blocked fetches). **HEADLINE 1 — THE FAMILY'S ARITHMETIC DISPUTE IS ADJUDICATED ON THE MAJORITY SIDE.** Two ledgers registered forward tests (`FT-…-2026-11-30-3`, `FT-…-2027-06-30-3`) asking a further lane to break a 2× tie: three lanes published ~4% for the 12-session 45%-reset leg, two published ~7.9%. Re-implemented from the stated definition on **1,281** sessions (2021-08-02 → 2026-09-08): **51/1,269 = 4.02%**, matching Sep/Dec/Oct's 3.95–4.02%. Also 17-session **92/1,264 = 7.28%** (pub 7.76/7.77 vs 14.16/14.24), IWF 17-session **110/1,264 = 8.70%** (pub 8.97/8.98), 12-session no-reset **376/1,269 = 29.63%** (pub 28.96/29.07 vs 35.05). **HEADLINE 2 — AND THE SPLIT IS LOCALISED TO SHORT WINDOWS, WHICH IS THE USABLE HALF:** this session reproduces the *dissenting* lanes on every long leg — 34-session path **239/1,247 = 19.17%** (Oct pub 19.61), 54-session path **255/1,227 = 20.78%** (Nov pub 18.49), 74-session monthly **209/1,207 = 17.32%** (Jun pub 18.91), 74-session quarterly **534/1,207 = 44.24%** (Jun pub 43.43). A globally mis-scaled estimator cannot land within 0.44pp at 34 sessions. Five variants tried on the 12-session leg and **none reconstructs 7.85%** — endpoint 4.02%, touch-anywhere 5.04%, arithmetic-spread 4.18%, adjusted closes 3.94%, SPY denominator 8.83% (Nov's own SPY variant was 12.98%). One concrete failure mode named as a place to look, hit and caught in-session: fixed **shares** proportional to weight rather than fixed **weight at the window anchor** returns **0.24%** on the same leg. **HEADLINE 3 — THE PROPOSING LANE'S DECLINE OF THE APRIL CHECK RESTS ON THE RESET FALLACY THIS FAMILY ALREADY REFUTED, AND IT IS WORTH 16.45pp.** The June ledger declined 2027-04-27 because *"it changes no number here — the 05-25 check resets after it either way."* Guide **§4.8.4** (re-extracted verbatim): *"If none of the applicable trigger thresholds are breached, no change is implemented as a result of the additional capping check"* — the exact clause `…-2026-11-30` made its own headline from. The 05-25 check fires **20.28%** of the time, so it supersedes April in one path in five. Modelling April removes **16.45pp** from this test (**36.73% → 20.28%**) and **11.93pp** from June's (**44.24% → 32.31%**). **PROPOSED IN THIS PR** as `proposals/russell-style-month-end-capping-effective-2027-04-30.from-<this id>.json`, named for its **effective** date per the family convention. **HEADLINE 4 — THE PROPOSER'S FILING RATIONALE SURVIVES AND IS SIZED:** the monthly-vs-quarterly fork on the June test is **26.92pp** wide (44.24% → 17.32%); this check carries **14.99pp**, April **11.93pp**. The larger half, as claimed. **HEADLINE 5 — A CONDITIONAL RESET IS NOT MONOTONE, NEW TO THIS FAMILY:** modelling May alone gives June **190/1,207 = 15.74%**, modelling April *and* May gives **17.32%** — *higher*, because an April firing re-anchors at 45% and thereby stops the May check firing, leaving June measured from session 33 over 41 sessions instead of session 53 over 21. **THIS EVENT'S GEOMETRY, COMPUTED:** last unconditional recap is the **March 2027** quarterly style review (cut-off **03-10**, effective open **03-22**), so the anchor is **53 sessions**, not the 20 from April. Session walk over an independently built 2027 closure set that matches `src/domain/market-calendar.ts` on all ten full closures: 03-10→03-22 **8**, →03-25 **11**, →04-27 **33**, →05-25 **53**, 04-27→05-25 **20**, 05-25→06-25 **21**, 03-10→06-25 **74** (reproducing the June lane's 21 and 74). T-3 walks: 03-31→**03-25** (over Good Friday 03-26), 04-30→**04-27**, 05-28→**05-25**, 06-30→**06-25**. **LIVE NUMBERS:** IWY **249/1,228 = 20.28%**, IWF **241/1,228 = 19.63%** (enters 44.47%, under the cap, needs +7.94%), raw 53-session **38.52%**, April's own firing rate **19.55%**; trailing 5y/3y/2y/12m = **20.28/20.03/19.38/10.55%**, honest range ≈**10–20%**. **MEMORIAL DAY 2027 LANDS AFTER MONTH-END, UNIQUELY IN THIS FAMILY:** Mon **2027-05-31** is a full closure, pulling the effective open to **Fri 2027-05-28**, immediately before a three-day weekend. May 2024/25/26 month-ends were Fridays too but Memorial Day fell *before* them; the only matching prior year is **2021**, where SPY traded **58.5M** on 2021-05-28 against an **85.5M** median across that year's twelve month-ends — **31.6% thinner**. **SCOPE RE-VERIFIED AND IT MOVED:** screener (**1,900,528 bytes**) → IWF **$125.57B**, IWD $83.37B, IWP $19.58B, IWY **$15.83B**, IWS $15.52B, IWO $14.68B, IWN $14.48B, IWX $3.92B = **$292.95B**, against the siblings' **$294.61B** one session earlier — **−$1.66B (−0.56%)**, so the fire case is ~**$475M** not $478M. Cohorts (holdings **2026-08-27**) **IWY 46.81%** / **IWF 44.47%**, matching all four siblings to the basis point; GOOG standalone **4.94%/4.77%** so a security-level read understates each ~5pp. **SINGLE-NAME LEG DEAD:** NVDA **16.21%/15.79%** vs a 22.5% cap and 24% trigger. **GUIDE UNCHANGED — A KILL SWITCH THAT DID NOT FIRE:** v5.4 re-fetched at **652,008 bytes / 62 streams**, byte-identical to the siblings' 2026-09-08 read, so the December and November lanes' *"a guide version past v5.4"* switch is still open. **Adjacency — peers:** none (`symbols: []`). **Macro: 6** tracked events within 5d (vs 35/24/14/5 around Oct/Nov/Dec/Jun), and the structure is the finding — `consumer-confidence-2027-05-25` (**medium**) and `fhfa-hpi-2027-05-25` (**low**) land on **the 05-25 close the test is struck from**; `beige-book-2027-05-26` at T-2; `sifma-bond-early-close-2027-05-28` (low) shares the **effective open**, so bonds are on a shortened session while the recap implements; `fomc-blackout-start-2027-05-29` (medium) the day after; `memorial-day-market-closure-2027-05-31` (low) is the closure that put the effective date on 05-28 — the corridor contains its own cause. **Vol:** baseline, no prior; VIX 15.72. **Geopolitical:** nothing touching index methodology. **Event tape:** playbooks + sweep re-grepped for `rebalanc\|reconstitution\|russell\|capping\|index.flow\|IWF\|IWY` → **zero hits**; no index notice recording any capping check firing was found. **BLOCKED FETCHES RECORDED, NOT SUBSTITUTED SILENTLY:** the iShares holdings-CSV ajax again returned an HTML product page under HTTP 200 for both IWY and IWF; both in `probe-ref.blocked`, holdings from an aggregator, trusted only because they reproduce four independent sibling reads exactly. **ONE ADJACENT FILED, FOUR CLASSES DECLINED:** filed `russell-style-month-end-capping-effective-2027-04-30`; declined the **2027-03-10**/**2027-06-16** capping cut-offs (data cut-offs, the class three lanes have declined), the **2027-03-31** March quarter-end check (already a proposal from the June lane, **not** duplicated), the **remaining 2027 month-ends** (the December lane's calendar-noise test, which they fail and this one and April pass), and the **2027-05-27** recap trade date (a settlement mechanic inside a tracked event). Registered **FT-…-1** (05-25 cohorts at or below 48%), **FT-…-2** (the arithmetic adjudication — scored by 2026-12-31, long before this date, because it bears on five ledgers and none of them needs this outcome), **FT-…-3** (the April check's marginal effect holding at ≥10pp on an independent rebuild). | — (stance set: **stand aside** Today/week, **stand aside; treat this family's base rates as ~4%, not ~8%** this month, **stand aside; watch 2026-10-30 for the tape's first word on the cadence** this quarter; the refusal rests on an owner-published but prefix-gapped conditional date whose two source documents disagree on cadence, a path-simulated **20.28%** breach probability that is better than 4-to-1 against, a dead single-name leg, zero house-playbook hits, and a ~$475M fire case implementing into a month-end close measured 31.6% thinner than normal) | 2026-10-09 (band `low:15+`, every 30d; tightens to `low:0+`, every 7d, on 2027-05-13). Close-out by 2027-06-03 |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint notes any
row past ~1,200 chars): it is a note to the next session, not an essay, and a stance *change* earns its
sentence in the Stance section with the row as its receipt. The adjacency sweep (peer prints · macro
surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in every row; a dated
adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-russell-style-month-end-capping-effective-2027-05-28.json`
(`status: "estimate"`) in the same PR — your own file, never another event's canonical one (#1717).
Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from
memory — after which this doc goes quiet.
