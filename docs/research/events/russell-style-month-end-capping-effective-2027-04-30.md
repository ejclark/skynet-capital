# Russell US Style April recapping — the family's pure discriminator, and the one date the owner's own published calendar argues against — russell-style-month-end-capping-effective-2027-04-30

**Kind:** sector · **Date:** 2027-04-30 (estimate — **EST: owner-published, both documents re-fetched and re-inflated independently this session.** FTSE Russell, *Capping Methodology Guide*, **v5.4, September 2026** (`capping-methodology-guide.pdf`, HTTP 200, **652,008 bytes**, **62** content streams inflated in-session 2026-09-09 — byte count, stream count and version all reproduce five sibling reads exactly, so the *"a guide edition past v5.4"* kill switch has **not** fired), whose section 4.8.6 gives all **20** Russell US Style rows frequency **"Monthly"**, price date **"T-3"**, effective date **"Last business day of each month"**, trigger **"No company is greater than 24%, and all companies that have a weight greater than 4.8% in aggregate are no more than 48% of the index"**, scheme **"Rule 4.2/RIC 22.5/45"**. Contradicted by FTSE Russell, *Frequently Asked Questions — Russell US Equity Indexes*, **July 2026** (`ftse-faq-document-russell-us-equity-2026.pdf`, HTTP 200, **198,134 bytes**, **19** streams), whose section headed **"Russell US Style quarter-end capping review"** reads **"The review is conducted quarterly (March, June, September, and December)"** — and which, newly extracted this session, also **publishes an operational calendar** with the rows **"Russell US Style Quarter-end Capping Cut-Off Date: 26 March 2026 | 25 June 2026 | 25 September 2026 | 28 December 2026"** and **"Russell US Style Quarter-end Capping Effective Date (open of, if applicable): 31 March 2026 | 30 June 2026 | 30 September 2026 | 31 December 2026"**. If the FAQ governs, this event does not exist. The 2027 dates are **rule-derived, not published**, and re-derived mechanically here: the last business day of April 2027 is **Friday 2027-04-30** (no NYSE closure falls in April 2027), and a T-3 business-day walk returns **Tuesday 2027-04-27**; the 2027 closure set was built independently and reproduces `src/domain/market-calendar.ts` on all ten full closures. Stays `estimate` because this calendar's confirmed-tier prefixes have no member for an index owner's own methodology, because this lane may not self-confirm an event it inherited as a proposal, and because the owner's two documents disagree on whether the check happens at all) · **Impact:** low
**Last assessed:** 2026-09-09
<!-- probe-ref: {"symbols":{},"vix":15.72,"daysBand":"low:15+","adjacentIds":["consumer-confidence-2027-04-27","fhfa-hpi-2027-04-27","boj-decision-2027-04-28","fomc-2027-04-28"],"screenStreak":0,"blocked":[{"url":"https://www.ishares.com/us/products/239720/ishares-russell-top-200-growth-etf/1467271812596.ajax?fileType=csv&fileName=IWY_holdings&dataType=fund","status":"200-html-not-csv","at":"2026-09-09"},{"url":"https://www.ishares.com/us/products/239706/ishares-russell-1000-growth-etf/1467271812596.ajax?fileType=csv&fileName=IWF_holdings&dataType=fund","status":"200-html-not-csv","at":"2026-09-09"}]} -->

## At a glance

**TL;DR.** **Stand aside — and hold the entry while lowering the belief behind it, because those are different questions and this session moved them in opposite directions.** The proposing lane filed this date to reverse a measured decline, and its arithmetic survives an independent rebuild cleanly: modelling this check removes **16.53pp** from the 2027-05-25 test (36.64% → 20.11%) and **11.93pp** from the 2027-06-25 June test — so `FT-russell-style-month-end-capping-effective-2027-05-28-3`, which asked whether a rebuild would put that below 10pp, **does not fire**. This event's own number lands at **245/1,248 = 19.63%** (IWY) against the proposer's 19.55% — a 0.08pp gap. **But the case that the check exists at all got measurably worse, and this instance is where that matters most: it is the family's pure discriminator.** Under the FAQ's reading it does not exist; the quarter-end siblings exist under *both* readings. And the FAQ side is no longer just prose — it publishes an **operational calendar with exactly four capping cut-off/effective pairs for 2026 and no month-end row**, under a heading that names the mechanism *"quarter-end capping"*, while the guide's own §4.8.5 worked example turns out to be the **September 2026 quarter-end**, matching the FAQ's published 25 Sep → 30 Sep pair. The guide side gained one real point too — §4.8.6 contains contrasting **"Quarterly"** rows for a different index family, so *"Monthly"* is a deliberate distinction, not a default. **The largest finding is none of that.** Every probability this family has argued about assumes the March review resets the cohort to exactly 45%, and that assumption swamps the dispute: the same 33-session leg reads **13.22%** from 44%, **22.84%** from 45%, **38.22%** from 46%, and **50.00%** from today's actual IWY cohort weight of **46.81%**. A one-point change in the reset roughly doubles the answer, while the family's whole 4%-vs-8% argument moves a 12-session leg by four points. **Nothing licenses a position.** Date `estimate` on a rule the owner's own two documents dispute, conditional trigger, `symbols: []`, **zero** house-playbook hits, D-233, a dead single-name leg (NVDA **16.21%** against a 24% trigger), and a fire case worth ~**$475M**. The one genuinely distinctive mechanic here measures at nothing: an **FOMC decision (2027-04-28, confirmed from federalreserve.gov) sits between the price date and the effective date** — the test is struck on the *first day of the meeting* — and 120 historical FOMC-straddling gaps move the cohort no more than ordinary ones (median |drift| **0.450pp** vs **0.445pp**).

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** | High | D-233, `symbols: []`, a date the owner publishes nowhere and a trigger conditional on a cohort no member can observe intraday. Every input is re-struck at least three times first — the **2026-09-09**, **2026-12-02** and **2027-03-10** review cut-offs, then the **2027-03-25** conditional check | FTSE Russell publishing a guide edition past **v5.4**, or an FAQ revision restoring monthly wording, before **2026-12-31** — this entry stops existing rather than moving, and is withdrawn rather than researched |
| This week | **Stand aside** | High | Nothing in this family lands inside it. The nearest dated milestone is the **2026-09-09** Russell US Style *review* capping cut-off — today, a data cut-off that publishes nothing and moves no shares, and it belongs to `russell-style-quarter-end-capping-effective-2026-09-30`, not here | Any dated report of a *Russell US Style* index being recapped between **2026-09-09** and **2026-09-15** outside a published cut-off — meaning neither owner document describes the whole rule |
| This month | **Stand aside; hold the entry, and mark the monthly reading below even** | Medium | The proposer's arithmetic reason for filing survives at **16.53pp**, so the entry earns its place as a modelling input. Its *existence* case weakened: the FAQ publishes four capping dates a year with no month-end row, and the guide's own illustrative calendar is a quarter-end. Keeping a calendar entry whose probability of being real is under 50% is correct here only because it changes two tracked events' numbers by double digits | FTSE Russell's **2027** Index Rebalance Market Calendar publishing a capping row with **more than four dates**, before **2026-12-31** — the monthly cadence is confirmed from the owner's own schedule and the belief flips above even |
| This quarter | **Stand aside; watch 2026-10-30 for the tape's first word on the cadence** | Medium | Everything in this 2027 chain descends from one table cell the owner's own published calendar contradicts. The **2026-10-30** month-end check is the family's first instance that is not also a quarter-end, so it is the first date on which the monthly reading can leave an observable trace. Until it does, this is a rule reading, not a scheduled event | An FTSE Russell index notice recording a Russell US Style recap effective **2026-10-30** or **2026-11-30** — the monthly cadence is confirmed from the tape rather than a table, and this whole 2027 chain promotes from derived to real |

**Signals & conditions** — the buy/sell/hold triggers:

- Date is `estimate` — **owner-published but prefix-gapped, rule-derived for 2027, and contradicted by the same owner's published calendar** — and the trigger is **conditional**. It widens caution about the 2027-04-27/04-30 closes and licenses **no** date-keyed action.
- **This event's own base rate: 245/1,248 = 19.63% (IWY), 247/1,248 = 19.79% (IWF)** — 33 sessions from the 2027-03-10 March review cut-off, conditional reset at session 11. The proposer published 19.55%; the gap is **0.08pp**.
- **The proposer's reversal holds on an independent rebuild: 16.53pp** on the 2027-05-25 test (36.64% → 20.11%) and **11.93pp** on the 2027-06-25 test (44.24% → 32.31%). `FT-russell-style-month-end-capping-effective-2027-05-28-3` asked for below 10pp; it does not fire.
- **THE RESET ASSUMPTION SWAMPS THE FAMILY'S ENTIRE DISPUTE.** Same 33-session leg: **13.22%** from a 44% start · **22.84%** from 45% · **38.22%** from 46% · **50.00%** from today's actual 46.81%.
- **The family's arithmetic dispute takes its seventh measurement and stays on the majority side: 51/1,269 = 4.02%** for the 12-session 45%-reset IWY leg. It is now 5 lanes near 4% against 2 near 7.9%.
- **NEW — the FAQ publishes an operational calendar, not just prose:** *"Russell US Style Quarter-end Capping Cut-Off Date: 26 Mar / 25 Jun / 25 Sep / 28 Dec 2026"* → *"Effective Date (open of, if applicable): 31 Mar / 30 Jun / 30 Sep / 31 Dec 2026"*. Four a year, no month-end row.
- **NEW — and the family's T-3 derivation is now validated against those four published pairs.** All four reproduce under the same business-day walk that produced every derived 2027 date in this family.
- **NEW — the guide's counter-evidence is real too:** §4.8.6 carries two **"Quarterly / Last business day in Mar, Jun, Sep and Dec"** rows (FTSE Emerging ex China RIC 22.5/45 Capped Index and its Net variant) beside the 20 monthly Russell US Style rows. The table can express both cadences and chose one.
- **NEW — but the guide's own worked example is a quarter-end.** §4.8.5's illustrative calendar (price date Friday the 25th, effective Wednesday the 30th, next day 1-Oct) is **September 2026**, exactly the FAQ's published 25 Sep → 30 Sep pair. The guide offers no month-end example.
- **This instance is the family's PURE DISCRIMINATOR** — under the FAQ it does not exist at all, while `russell-style-quarter-end-capping-effective-2027-03-31` and `-2027-06-30` exist under both readings.
- **An FOMC decision sits between the strike and the implementation, and it measures at nothing.** `fomc-2027-04-28` (**high**) is confirmed from federalreserve.gov; the price date **2027-04-27 is the meeting's first day**. Across **120** historical FOMC-straddling 3-session gaps the cohort's median |drift| is **0.450pp** against **0.445pp** for the other 1,158 — no amplification.
- **The corridor is the family's thinnest: 4 events**, and the only one containing a `high`-impact entry between price date and effective date (38 · 31 · 40 · 17 · 11 · 6 · 9 around the siblings).
- **The single-name leg is dead** — NVDA is **16.21%** (IWY) / **15.79%** (IWF) against a 22.5% cap and a 24% trigger.
- **Company lines combine** — Alphabet counts once at **11.04%** (IWY) / **10.66%** (IWF); GOOG standalone is **4.94%** / **4.77%**, so a security-level read understates each cohort by ~5pp.
- **The cohort has an entry candidate as well as an exit one** — AVGO at **5.57%** needs **−13.8%** relative to drop out; **MU at 3.97%** needs **+20.9%** relative to come in. No lane has named the entry side.
- Chain: March review cut-off **2027-03-10** → review effective open **03-22** → conditional quarter-end test **03-25** *(T-3 stepping over Good Friday 03-26)* → **conditional month-end test struck 04-27 (T-3)** → recap trades the **04-29** close → **effective open 2027-04-30** → May test **05-25** → June review cut-off **06-16** → June test **06-25**.

## Initial research

### The question

This id reached the calendar as a single proposal from the
[`russell-style-month-end-capping-effective-2027-05-28`](russell-style-month-end-capping-effective-2027-05-28.md)
initial research, filed for one explicit purpose — to **reverse a measured decline**. The June lane
(`russell-style-quarter-end-capping-effective-2027-06-30`) had declined this date on the reasoning that
*"the 2027-04-27 month-end check (real under the guide's reading, but it changes no number here — the 05-25
check resets after it either way)"*, and the May lane refuted that as the **reset fallacy** guide §4.8.4
already forbids, sizing the correction at 16.45pp. It then registered
`FT-russell-style-month-end-capping-effective-2027-05-28-3`, which scores **on this event's own date** and
asks in as many words for exactly the session that is now running: *does an independent rebuild put the
April check's marginal effect below 10pp, in which case this entry should be withdrawn rather than
researched?*

**So this session had two jobs. First, the one it was asked for: does the reason this entry exists survive
an independent rebuild? Second, the one no lane has asked because five ledgers have carried the same
sentence unexamined: how strong is the case that this check happens at all — and is this instance
different from its siblings in that respect?**

**One-line verdict:** the arithmetic rationale survives cleanly (**16.53pp**, and this event's own rate
lands within 0.08pp of the proposer's), while the *existence* case weakens materially and does so
asymmetrically — this is the family's **only pure discriminator**, and the FAQ side turns out to carry a
published operational calendar rather than a sentence. Hold the entry, mark the belief below even. Along
the way, one sensitivity was found that is larger than everything this family has spent five ledgers
arguing about.

### Method

Macro / market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — the entry carries
`symbols: []`, so no symbol-keyed instrument applies and `scripts/research/` has no index-flow instrument.
**Nothing was inherited.** Every document was re-fetched and re-inflated, every date re-derived from a
holiday set built from statute, and the family's estimator re-implemented from its stated definition rather
than from any lane's code.

- **The proposal was read in full first**
  (`proposals/russell-style-month-end-capping-effective-2027-04-30.from-russell-style-month-end-capping-effective-2027-05-28.json`),
  per the "your own event was proposed by others" rule — it was the only proposal carrying this id — then
  the canonical `src/domain/market-events/russell-style-month-end-capping-effective-2027-04-30.json` was
  written by this session.
- **FTSE Russell Capping Methodology Guide, v5.4, September 2026** — re-fetched (HTTP 200, **652,008 bytes**),
  text recovered by inflating its **62** content streams in-session. Byte count, stream count and version all
  reproduce the five sibling reads, which is this session's check that the *"a guide version past v5.4"* kill
  switch has not fired. §4.8.4, §4.8.5 and the whole §4.8.6 table were extracted verbatim.
- **FTSE Russell FAQ, July 2026** — re-fetched (HTTP 200, **198,134 bytes**, **19** streams) and, unlike prior
  sessions, **read past the prose sentence** into its Index Rebalance Market Calendar table (leg 2).
- **federalreserve.gov FOMC calendar** (`fomccalendars.htm`, HTTP 200, **164,831 bytes**, page footer
  *"Last Update: August 19, 2026"*) — **46** historical decision dates 2021-01-27 → 2026-07-29 extracted from
  its statement links, plus the published **2027** meeting list. A primary source (`FED:`), used for leg 8.
- **iShares product screener** (`product-screener-v3.1.jsn`, HTTP 200, **1,900,533 bytes**) — AUM for all
  eight funds; the IWY figure was independently corroborated from the fund's own product page
  (`Net Assets of Fund` **15,825,958,9xx**, *as of Sep 04, 2026*).
- **Vendor holdings — blocked again, the same way.** The iShares holdings ajax returned an HTML product page
  under HTTP 200 for both IWY and IWF (content-type `text/csv` and `application/json` respectively — the
  header lies, the body is the bot wall). Both are in `probe-ref.blocked`; holdings came from an
  **aggregator** (as of **2026-08-27**), a provenance downgrade stated here rather than hidden.
- **Yahoo daily bars** — NVDA, AAPL, MSFT, GOOGL, GOOG, AVGO, IWY, IWF, SPY, `^VIX`; **1,281** usable
  sessions (2021-08-02 → 2026-09-08), in adjusted and unadjusted form.
- **The 2027 NYSE closure set** was written from the statutory rules and checked against this repo's own
  `src/domain/market-calendar.ts` — all ten full closures agree.
- **This repo** — the corridor computed from the calendar files (canonical plus proposals, ±5 days) rather
  than by eye, for this event and for all seven siblings on the same method; `trade-playbooks.md` and
  `multi-symbol-sweep.md` re-grepped for `rebalanc|reconstitution|russell|capping|index.flow|IWF|IWY` →
  **zero hits**.

### Conviction legs, tested

1. **HEADLINE — the reason this entry exists survives an independent rebuild, and the forward test that
   asked does not fire — SUPPORTED.** `FT-russell-style-month-end-capping-effective-2027-05-28-3` predicted
   that a rebuild would measure this check's marginal effect at **≥10pp** on the May test and **≥6pp** on the
   June test. Re-implementing the estimator from its stated definition — the over-4.8% company cohort held at
   fixed **weights measured at the window anchor**, grown against its own fund's return, breaching 48% from a
   45% post-review reset when it beats the fund by 48/45 = **+6.67%**:

   | Quantity | Without the April check | With it | Difference | Proposer published |
   |---|---|---|---|---|
   | The 2027-05-25 May test (IWY) | 450/1,228 = **36.64%** | 247/1,228 = **20.11%** | **16.53pp** | 16.45pp |
   | The 2027-06-25 June quarter-end test (IWY) | 534/1,207 = **44.24%** | 390/1,207 = **32.31%** | **11.93pp** | 11.93pp |

   Both legs clear their thresholds by a wide margin, and the June figure reproduces to the basis point. The
   June lane's decline of this date was wrong, and it was wrong by roughly the amount the May lane said.

2. **HEADLINE — the case that this check exists is weaker than five ledgers have recorded, because the FAQ
   publishes a schedule and not merely a sentence — REFUTES the family's "two documents disagree, symmetrically"
   framing.** Every sibling ledger cites the FAQ as one line of prose. Extracted this session, the same
   document carries an **Index Rebalance Market Calendar** whose relevant rows read verbatim:

   > **Russell US Style Quarter-end Capping Cut-Off Date** | 26 March 2026 | 25 June 2026 | 25 September 2026 | 28 December 2026
   >
   > **Russell US Style Quarter-end Capping Effective Date (open of, if applicable)** | 31 March 2026 | 30 June 2026 | 30 September 2026 | 31 December 2026

   Four cut-off/effective pairs for the year, no month-end row, and the row *names the mechanism* "quarter-end
   capping" — the same name the FAQ's section heading uses. This is a different class of evidence from prose:
   it is the owner's own operational schedule, the artefact an index user actually works from. Two of those
   four pairs are events this calendar already tracks (`…-2026-09-30`, `…-2026-12-31`) and match exactly; the
   two tracked **month-end** instances (`…-2026-10-30`, `…-2026-11-30`) appear nowhere in it.

3. **AND THE SAME TABLE VALIDATES THIS FAMILY'S DATE DERIVATION, WHICH NO LANE HAD CHECKED — SUPPORTED.**
   Every 2027 date in this family comes from a T-3 business-day walk back from a period end. Those four
   published 2026 pairs are the only place that walk can be checked against the owner:

   | Published effective | Weekday | T-1 | T-2 | T-3 | Published cut-off |
   |---|---|---|---|---|---|
   | 2026-03-31 | Tue | Mon 03-30 | Fri 03-27 | **Thu 03-26** | 26 March 2026 ✓ |
   | 2026-06-30 | Tue | Mon 06-29 | Fri 06-26 | **Thu 06-25** | 25 June 2026 ✓ |
   | 2026-09-30 | Wed | Tue 09-29 | Mon 09-28 | **Fri 09-25** | 25 September 2026 ✓ |
   | 2026-12-31 | Thu | Wed 12-30 | Tue 12-29 | **Mon 12-28** | 28 December 2026 ✓ |

   Four for four. So the **method** behind `2027-04-30 → 2027-04-27` is validated against the owner even
   though the **date** is not published — a distinction worth keeping straight, because it means the residual
   doubt about this entry is entirely about cadence and not at all about arithmetic.

4. **The guide's side gained a real point too, and it is the strongest one available to it — SUPPORTED.**
   The obvious way to dismiss the guide's "Monthly" cell is as a table default. It is not: §4.8.6 contains
   **contrasting rows**. Two entries — **FTSE Emerging ex China RIC 22.5/45 Capped Index** and its Net Tax
   variant — read frequency **"Quarterly"**, effective date **"Last business day in Mar, Jun, Sep and Dec"**,
   against an otherwise identical trigger and the same T-3 price date. The table demonstrably *can* express a
   quarterly cadence, sits it beside the 20 Russell US Style rows, and gives those rows **"Monthly"** and
   **"Last business day of each month"**. That is a deliberate distinction. Against it, and weaker but worth
   recording: the guide's own §4.8.5 **illustrative calendar** shows a price date on **Friday the 25th**, an
   effective date on **Wednesday the 30th**, and **1-Oct** in the following cell — which is **September 2026**,
   exactly the FAQ's published 25 Sep → 30 Sep quarter-end pair. The guide's only worked example of the
   mechanism is a quarter-end. An illustration naturally picks a real upcoming instance, so this is suggestive
   at most; it is recorded because it is the sort of detail a later lane would otherwise re-derive.

5. **HEADLINE — this instance is the family's PURE DISCRIMINATOR, which is why the cadence question bites
   harder here than anywhere else — SUPPORTED.** Sort the eight tracked instances by what the fork does to
   them:

   | Instance | Exists under the guide (monthly)? | Exists under the FAQ (quarterly)? |
   |---|---|---|
   | `…-quarter-end-…-2026-09-30`, `-2026-12-31`, `-2027-03-31`, `-2027-06-30` | yes | **yes** (all four published for 2026 by name) |
   | `…-month-end-…-2026-10-30`, `-2026-11-30`, **`-2027-04-30`**, `-2027-05-28` | yes | **no** |

   The quarter-end siblings are robust to the fork: whichever document governs, the date is real and only its
   label changes. The four month-end instances are not, and this one is the nearest of them that is not
   already inside a lane's scoring window. **So the question five ledgers have carried as background is, for
   this entry, the whole question.** It is also why the correct output here is a split verdict rather than a
   single one: the entry's *usefulness* (leg 1) and the entry's *reality* (legs 2–4) are independent, and this
   session moved them in opposite directions.

6. **This event's own numbers, path-simulated — SUPPORTED, and they reproduce the proposer's.** The last
   unconditional recap before this test is the **March 2027** quarterly Russell US Style capping review
   (cut-off **2027-03-10**, effective open **03-22**), so the anchor is 33 sessions out with one conditional
   check in between:

   | Case | Result |
   |---|---|
   | **2027-04-27 test, IWY — the live case** (33 sessions, conditional reset at 11) | **245/1,248 = 19.63%** |
   | 2027-04-27 test, IWF (same construction) | 247/1,248 = **19.79%** |
   | Raw 33-session window, no intervening check | 285/1,248 = **22.84%** |
   | The proposer's published figure for the same quantity | 19.55% |

   Trailing slices on the live case: 5y **19.63%**, 3y **18.64%**, 2y **11.30%**, 12m **10.96%** — an honest
   range of **≈11–20%**, with the recent regime at the bottom of it.

7. **HEADLINE — one assumption is worth more than everything this family has argued about, and no lane has
   stated it — SUPPORTED.** Every probability in every ledger of this family starts the cohort at **exactly
   45%**, on the reasoning that the preceding review recaps to the target level. That is an assumption, not a
   measurement, and the same 33-session leg is violently sensitive to it:

   | Starting cohort weight | Relative move needed to breach 48% | 33-session breach rate (IWY) |
   |---|---|---|
   | 44% | +9.09% | 165/1,248 = **13.22%** |
   | **45% (the family's assumption)** | +6.67% | 285/1,248 = **22.84%** |
   | 46% | +4.35% | 477/1,248 = **38.22%** |
   | **46.81% (IWY's actual weight today)** | **+2.54%** | 624/1,248 = **50.00%** |

   A **one-point** change in the reset level roughly doubles the answer. For scale, the dispute five ledgers
   have spent forward tests on moves a 12-session leg from 4% to 8%. **The family has been arguing about the
   second-order term.** This is not a criticism of the estimator — the 45% assumption is the right modelling
   choice, because a recap targets the level — but it is the number a later lane should quote when asked how
   much any of this is worth. IWF, which enters at **44.47%** and needs **+7.94%**, reads **17.55%** on the
   same unreset basis.

8. **The one genuinely distinctive mechanic on this date measures at nothing — REFUTED, and that is the
   useful result.** `fomc-2027-04-28` is `high`-impact and lands between this test's price date and its
   effective date; confirmed from the primary source, federalreserve.gov's FOMC calendar page (footer
   *"Last Update: August 19, 2026"*) lists **"April 27-28"** for 2027, so the capping test is struck **on the
   close of the meeting's first day** and any recap implements two sessions after the decision. The natural
   inference is that this gap is riskier than the family's other instances. It is not. Over the 1,281-session
   bar set, using the **46** decision dates extracted from the same Fed page, the cohort's drift across a
   3-session strike→effect gap:

   | Gap type | n | median \|drift\| | p90 | p99 | max |
   |---|---|---|---|---|---|
   | All 3-session gaps | 1,278 | 0.446pp | 1.149pp | 2.023pp | 4.80pp |
   | **Contains an FOMC decision** | **120** | **0.450pp** | 1.173pp | 1.800pp | **2.12pp** |
   | Contains none | 1,158 | 0.445pp | 1.148pp | 1.996pp | 4.80pp |

   A 0.005pp difference in the median, and the FOMC-straddling maximum is less than half the unconditional
   one. **The family's only `high`-impact corridor member does not move the number.** One tilt is worth
   recording with an explicit caveat: a cohort sitting exactly at 48% on the strike falls back under it by the
   effective open in **30.0%** of FOMC gaps against **42.2%** otherwise — a ~2.7σ effect on n=120, on a cut
   chosen *after* seeing the corridor. Treat it as a hypothesis, not a finding.

9. **The corridor is the family's thinnest, computed on one method across all eight instances — SUPPORTED.**
   Canonical entries plus proposals, ±5 days:

   | Instance | Corridor | `high`+ members |
   |---|---|---|
   | 2026-09-30 | 40 | 5 |
   | 2026-10-30 | 38 | 7 |
   | 2026-11-30 | 31 | 6 |
   | 2026-12-31 | 17 | 1 |
   | 2027-03-31 | 11 | 0 |
   | **2027-04-30** | **4** | **1** |
   | 2027-05-28 | 6 | 0 |
   | 2027-06-30 | 9 | 1 |

   The four: `consumer-confidence-2027-04-27` (**medium**) and `fhfa-hpi-2027-04-27` (**low**) land **on the
   04-27 close the test is struck from** — a measurement hazard for anyone reading the cohort off that print,
   the same structure the May lane found — while `boj-decision-2027-04-28` (medium) and `fomc-2027-04-28`
   (**high**) land **between the strike and the implementation**. This is the only instance in the family with
   a `high`-impact event inside that gap, and leg 8 is why it does not matter.

10. **The family's arithmetic dispute takes a seventh measurement and stays on the majority side —
    SUPPORTED.** Two ledgers registered forward tests asking further lanes to break a 2× tie; the May lane was
    the sixth measurement and this is the seventh, rebuilt from the stated definition without reading any
    lane's code:

    | Leg | Sep | Dec | Oct | Nov | Jun | May | **This session** |
    |---|---|---|---|---|---|---|---|
    | 12-session, 45% reset, IWY | 4.02% | 3.95% | 3.95% | 7.85% | 7.90% | 4.02% | **51/1,269 = 4.02%** |
    | 17-session, 45% reset, IWY | — | 7.76% | 7.77% | 14.16% | 14.24% | 7.28% | **95/1,264 = 7.52%** |
    | 17-session, 45% reset, IWF | — | 8.97% | 8.98% | — | — | 8.70% | **111/1,264 = 8.78%** |
    | 12-session, adjusted closes | — | — | — | — | — | 3.94% | **49/1,269 = 3.86%** |

    Five lanes near 4%, two near 7.9%. And the long-window legs reproduce the *dissenting* lanes as well as
    the concurring ones, which is the May lane's "the split is a short-window artefact" finding holding up
    under a third construction: 34-session **241/1,247 = 19.33%** (Oct published 19.61, May 19.17) ·
    54-session **254/1,227 = 20.70%** (Nov 18.49, May 20.78) · 74-session monthly **209/1,207 = 17.32%** and
    74-session quarterly **534/1,207 = 44.24%** — both **exact** matches to the May lane.

11. **The non-monotonicity the May lane banked reproduces independently — SUPPORTED.** Modelling **May
    alone** (resets at 11, 53) gives the June test **192/1,207 = 15.91%**; modelling **April and May**
    (11, 33, 53) gives **209/1,207 = 17.32%** — *higher* by **1.41pp**, against the May lane's 1.58pp on its
    own construction. Adding a conditional reset can raise a downstream test's breach probability, because an
    April firing re-anchors the cohort and thereby suppresses the May one. Two independent implementations now
    agree on a result that reads like an arithmetic error, which is the point of banking it twice.

12. **Scope and cohorts, re-verified from the vendor — SUPPORTED, and they reproduce every sibling read.**
    The screener returns IWF **$125.57B**, IWD $83.37B, IWP $19.58B, IWY **$15.83B**, IWS $15.52B, IWO
    $14.68B, IWN $14.48B, IWX $3.92B = **$292.95B**, matching the May lane's read to the hundred million; the
    IWY figure is corroborated directly from the fund's own product page (*as of Sep 04, 2026*), which is a
    better provenance than the screener alone and is recorded because the holdings endpoint is blocked.
    Cohorts, from holdings dated **2026-08-27**, company lines combined per the guide's own rule:

    | Fund | NVDA | AAPL | MSFT | Alphabet (both lines) | AVGO | **Cohort** |
    |---|---|---|---|---|---|---|
    | **IWY** | 16.21% | 7.79% | 6.20% | **11.04%** | 5.57% | **46.81%** |
    | **IWF** | 15.79% | 7.32% | 5.57% | **10.66%** | 5.13% | **44.47%** |

    Identical to all five siblings to the basis point. The combining rule stays load-bearing: **GOOG standalone
    is 4.94% (IWY) and 4.77% (IWF)**, so a security-level read drops Alphabet's second line under the 4.8%
    line and understates each cohort by about 5pp.

13. **The cohort is a step function with a candidate on *both* sides, which no lane has said — SUPPORTED.**
    Every sibling names AVGO at **5.57%** as the marginal name and computes its exit: it needs **−13.8%**
    against IWY to fall under 4.8%, dropping the cohort ~5pp *away* from a breach in one step. The entry side
    is unwatched: **MU at 3.97%** needs **+20.9%** against IWY to come *in*, adding ~4pp *toward* a breach in
    one step. Over a 33-session window with a mega-cap semiconductor name, +20.9% relative is not a remote
    move. A step function with two live steps in opposite directions is wider in both tails than the smooth
    base rate implies.

14. **The single-name leg is dead by a wide margin — SUPPORTED.** The trigger is **24%** for any one company.
    NVDA, the family's largest weight, is **16.21%** in IWY and **15.79%** in IWF against a 22.5% cap it is
    nowhere near.

15. **No house playbook fits — SUPPORTED, re-verified not inherited.** `trade-playbooks.md` and
    `multi-symbol-sweep.md` re-grepped this session for
    `rebalanc|reconstitution|russell|capping|index.flow|IWF|IWY`: **zero hits** in both. Nothing in the house
    is keyed to index flow, and this event has no announcement to trade against.

16. **Even the fire case is small — SUPPORTED.** A breach recaps the cohort from just over 48% back to 45%:
    ~3pp of IWY's **$15.83B ≈ $475M**, spread across five mega caps. Were IWF to breach as well, its 3pp is
    ~**$3.77B**, still under a tenth of a day's volume in each name it touches — and IWF's breach requires the
    larger move from today's weights, so the joint case is rarer than either alone.

### What the conditions support

Nothing directional, on any horizon. Four outputs, and the important one is a **split verdict** rather than
a single call. **The entry earns its place and the forward test that asked is answered** — this check is
worth 16.53pp to the May test and 11.93pp to June, so
`FT-russell-style-month-end-capping-effective-2027-05-28-3` does not fire and the entry stands rather than
being withdrawn. **But the belief behind it should come down, and this is the instance where that matters** —
the FAQ turns out to publish an operational calendar with four capping dates a year and no month-end row,
under a heading that names the mechanism "quarter-end capping"; the guide's own worked example is a
quarter-end; and this instance is the family's only pure discriminator, real under one reading and
non-existent under the other. The guide keeps one strong point (§4.8.6 expresses both cadences and chose
"Monthly" for these rows), which is why the call is *below even* rather than *withdraw*. **The family's date
derivation is validated against the owner for the first time** — four published 2026 pairs, four T-3 walks,
four matches — so the residual doubt is entirely about cadence and not at all about arithmetic. **And one
sensitivity is banked that dwarfs the family's own dispute**: the 45% reset assumption moves this event's
33-session rate from 13.22% to 50.00% across a 2.8-point range of starting weights, while the 4%-vs-8%
argument moves a 12-session leg by four points.

**No dated adjacent was proposed, and four classes were deliberately declined**, recorded so a later lane
does not re-litigate them. **DECLINED:** the **2027 Russell US Style review capping cut-off and review
effective dates** (Q2 2027 by the FAQ's published 2026 pattern — a data cut-off publishes nothing and moves
no shares, the class `russell-recon-preliminary-2026-11-13` declined and four lanes have declined since);
the **2027-04-30 Q2 Index Rebalance market-cap / free-float / IPO data cut-off**, which the FAQ's published
calendar shows falling on the last business day of April and therefore *on this event's own effective date* —
same class, same decline, and recorded explicitly because a later lane finding that coincidence would
otherwise think it was missed; the **2027 FOMC dates** (all eight on the Fed's published list are already
tracked, checked one by one, including `fomc-2028-01-26`); and the **2027-04-29 recap trade date** (a
settlement mechanic inside an event already tracked, not an event). The remaining 2027 month-ends stay
declined on the December lane's *"extrapolating a standing rule twelve months out is calendar noise"* test,
which they fail and this instance passes only because it changes two tracked events' numbers by double
digits.

### Honest limits

**The existence verdict is a reading of two documents, not a fact about the world.** The FAQ's calendar is
organised by review quarter — four columns, one per review cycle — so a genuinely monthly check might simply
not fit that table's shape, and its absence would then be an artefact of layout rather than evidence. Against
that, the row is *named* "Quarter-end Capping" and the FAQ's prose says the same thing independently; and for
it, the guide is **two months newer** than the FAQ, so a July-to-September rule change would leave exactly
this footprint. **Both readings survive this session** — what changed is the balance, not the resolution.
**Nothing here observed a capping check firing**, at a month-end or a quarter-end, and no index notice was
found either way; that is the gap all five siblings recorded and it is still open. **The 2027 dates are
derived, not published** — though leg 3 now validates the derivation *method* against four owner-published
pairs, which is new and is the strongest form this claim has taken. **The base rate is a proxy with a frozen
cohort** — it holds today's five cohort members at today's proportions across five years of prices, so it
measures whether a mega-cap growth cohort *of roughly this shape* can move this far, not the index rule
itself; 233 days out, with a reconstitution in between, membership churn makes that a weak assumption, and
leg 13's two live step-changes make it weaker in both directions. **These are ETF weights, not index
weights**, undrifted from their 2026-08-27 as-of date and taken from an **aggregator** after the iShares
holdings endpoint returned HTML under HTTP 200 for both funds (recorded in `probe-ref.blocked`); they are
trusted only because they reproduce five independent sibling reads exactly. **Leg 7's sensitivity ladder is
the honest frame for every probability on this sheet** — 19.63% is the answer *given* a 45% reset, and the
reset is assumed. **Leg 8's FOMC result rests on 120 observations** and on 3-session close-to-close drift
standing in for a close-to-open implementation gap; the 30.0%-vs-42.2% reversal tilt inside it is a post-hoc
cut and is labelled as one. **The date is `estimate`** and every trading-adjacent statement above carries
that label; the trigger is conditional and no primary can pre-confirm it fires; `symbols` is empty by design
and no house playbook is index-flow-keyed.

## Stance & kill switches

**Stance (date `estimate`, `EST:` owner-published in the v5.4 September 2026 Capping Methodology Guide's
standing rule, rule-derived for 2027 rather than published, prefix-gapped rather than unpublished, and now in
sharper conflict with the same owner's July 2026 FAQ — which publishes an operational calendar of four
capping dates a year, not merely a sentence; trigger conditional).** Treat 2027-04-30 as **the same
untradeable mechanism all five siblings refused, at a measured ~19.6%, on an entry that should be kept and a
belief that should be marked down.** Four legs. **(a) The entry stands and the forward test that asked is
answered.** Modelling this check is worth **16.53pp** to the 2027-05-25 test (36.64% → 20.11%) and
**11.93pp** to the 2027-06-25 test — comfortably past the ≥10pp / ≥6pp thresholds
`FT-russell-style-month-end-capping-effective-2027-05-28-3` set, so the June lane's decline was wrong by
about the amount the May lane said and this file is not withdrawn. This event's own rate is
**245/1,248 = 19.63%** (IWY) / **19.79%** (IWF), within 0.08pp of the proposer's. **(b) The belief that the
check happens at a month-end goes below even, and this is the instance where that bites.** The FAQ's
published Index Rebalance Market Calendar carries **"Russell US Style Quarter-end Capping"** cut-off and
effective rows with exactly four 2026 dates and no month-end; the guide's own §4.8.5 worked example is the
September 2026 quarter-end. The guide keeps one real point — §4.8.6 gives two rows **"Quarterly"** and the 20
Russell US Style rows **"Monthly"**, so the cell is a distinction the table can express both ways — which is
why this is *below even*, not *withdraw*. And it bites here specifically because this instance is the
family's **pure discriminator**: under the FAQ it does not exist, while all four quarter-end siblings exist
under both readings. **(c) One assumption dwarfs the family's own dispute.** The 45% reset every ledger
assumes moves this event's 33-session rate from **13.22%** (44% start) to **50.00%** (today's actual 46.81%)
— a range five times wider than the 4%-vs-8% argument two forward tests are waiting on. Quote it whenever
anyone asks what these probabilities are worth. **(d) None of that makes this tradable.** ~19.6% is better
than 4-to-1 against on an unhedgeable conditional reading a cohort no member can observe intraday; the
single-name leg is dead (NVDA 16.21% against a 24% trigger); the fire case moves ~$475M; `symbols` is empty
and the house playbooks return zero hits. One thing carries forward past this event beyond the family: **a
`high`-impact event inside a mechanism's implementation gap is a corridor fact, not a risk, until it is
measured** — the FOMC decision that sits between this test's strike and its implementation moves the cohort
0.005pp more than an ordinary gap does.

**Kill switches:**

- **FTSE Russell's 2027 Index Rebalance Market Calendar publishes a Russell US Style capping row with more
  than four dates** — the monthly cadence is confirmed from the owner's own operational schedule rather than
  a table cell, leg 2 is overturned, and the belief flips above even. Registered as
  `FT-russell-style-month-end-capping-effective-2027-04-30-2`.
- **The 2027-04-27 close leaves IWY's or IWF's over-4.8% company cohort above 48%** — the check fires, and a
  sheet that called a ~19.6% draw a stand-aside has to answer for it. Registered as
  `FT-russell-style-month-end-capping-effective-2027-04-30-1`.
- **An independent rebuild measures the 45% reset sensitivity at under 10pp across a 44%–47% starting range**
  — leg 7's claim that the reset assumption dwarfs the family's arithmetic dispute is wrong, and the
  dispute deserves the attention two forward tests have given it. Registered as
  `FT-russell-style-month-end-capping-effective-2027-04-30-3`.
- **FTSE Russell publishes a guide edition past v5.4, an index notice, or an FAQ revision restoring monthly
  wording** — the conflict resolves by supersession rather than by reading, and this entry is either
  withdrawn or promoted rather than researched further.
- **An index notice records a Russell US Style recap effective 2026-10-30 or 2026-11-30** — the monthly
  cadence is confirmed from the tape, and this whole 2027 chain is promoted from a rule reading to a
  schedule. Owned by those lanes' own forward tests, deliberately not re-registered here.
- **FTSE Russell publishes a 2027 schedule whose March review effective date falls after 2027-03-25** — the
  anchor in leg 6 moves, the 33-session window shortens, and every probability on this sheet falls.
- **AVGO's IWY weight crosses 4.8%, or MU's crosses it upward** — at **5.57%** and **3.97%** they are the
  cohort's two live steps, worth ~5pp *away* from and ~4pp *toward* a breach respectively. Marginal names
  dominate a step function, and a 33-session window gives both six weeks to move.
- **The April 2027 FOMC moves off 2027-04-28** — the Fed's own calendar calls each date tentative until
  confirmed at the preceding meeting; leg 8's corridor structure changes, though leg 8's *finding* (that it
  does not matter) would survive.

**Registered forward tests.** `FT-russell-style-month-end-capping-effective-2027-04-30-1`, `-2` and `-3` —
see [`forward-tests/russell-style-month-end-capping-effective-2027-04-30.md`](../forward-tests/russell-style-month-end-capping-effective-2027-04-30.md).
Observations, never templates. `-2` and `-3` both score **long before** this event, which is deliberate:
neither depends on this date's outcome, both bear on ledgers other than this one, and this family has already
spent two forward tests waiting on a question any lane can settle in an afternoon.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-09 | D-233 | Initial research banked; canonical `src/domain/market-events/<id>.json` written this session (the id existed only as `proposals/…from-russell-style-month-end-capping-effective-2027-05-28.json`, read in full first). probe-ref baseline set (no symbols by design; **VIX 15.72** at the 2026-09-08 close; band `low:15+`; **4** adjacents; **2** blocked fetches). **HEADLINE 1 — THE FORWARD TEST THAT ASKED FOR THIS SESSION DOES NOT FIRE.** `FT-…-2027-05-28-3` predicted a rebuild would put this check's marginal effect at ≥10pp (May test) and ≥6pp (June test). Re-implemented from the stated definition on **1,281** sessions (2021-08-02 → 2026-09-08): May test **450/1,228 = 36.64%** without → **247/1,228 = 20.11%** with = **16.53pp** (proposer 16.45pp); June test **44.24% → 32.31% = 11.93pp** (exact match). The entry stands rather than being withdrawn. **THIS EVENT'S OWN NUMBER:** 33 sessions from the 2027-03-10 March review cut-off with a conditional reset at session 11 → **245/1,248 = 19.63%** (IWY), **247/1,248 = 19.79%** (IWF), raw 33-session **22.84%**; proposer published 19.55%, gap **0.08pp**. Trailing 5y/3y/2y/12m = **19.63/18.64/11.30/10.96%**, honest range ≈**11–20%**. **HEADLINE 2 — THE FAQ PUBLISHES A SCHEDULE, NOT A SENTENCE, AND FIVE LEDGERS HAVE CITED ONLY THE SENTENCE.** Extracted this session from the same July 2026 FAQ: an Index Rebalance Market Calendar reading **"Russell US Style Quarter-end Capping Cut-Off Date | 26 March 2026 | 25 June 2026 | 25 September 2026 | 28 December 2026"** and **"…Effective Date (open of, if applicable) | 31 March 2026 | 30 June 2026 | 30 September 2026 | 31 December 2026"** — four a year, no month-end row, under a heading naming the mechanism *"quarter-end capping"*. Two of those pairs are tracked events and match; the two tracked month-end instances appear nowhere in it. **HEADLINE 3 — AND THE SAME TABLE VALIDATES THIS FAMILY'S T-3 DERIVATION AGAINST THE OWNER FOR THE FIRST TIME:** 2026-03-31→**03-26** ✓, 06-30→**06-25** ✓, 09-30→**09-25** ✓, 12-31→**12-28** ✓. Four for four, so residual doubt is about cadence only, never arithmetic. **THE GUIDE'S SIDE GAINED A REAL POINT TOO:** §4.8.6 contains two contrasting **"Quarterly / Last business day in Mar, Jun, Sep and Dec"** rows (FTSE Emerging ex China RIC 22.5/45 Capped Index + Net variant) beside the **20** Russell US Style **"Monthly"** rows — the cell is a deliberate distinction, not a default. Weakly against: the guide's own §4.8.5 illustrative calendar (price date Fri 25th, effective Wed 30th, next cell 1-Oct) is **September 2026** — the FAQ's published quarter-end pair. **HEADLINE 4 — THIS INSTANCE IS THE FAMILY'S PURE DISCRIMINATOR:** all four quarter-end siblings exist under both readings (the FAQ names their 2026 dates); all four month-end instances, including this one, exist under the guide's reading only. So the cadence fork, background elsewhere, is the whole question here — hence a split verdict: entry kept (headline 1), belief marked below even (headlines 2–3). **HEADLINE 5 — ONE ASSUMPTION DWARFS THE FAMILY'S OWN DISPUTE, UNSTATED BY ANY LANE:** every ledger starts the cohort at exactly 45%. Same 33-session leg: **44% → 13.22%**, **45% → 22.84%**, **46% → 38.22%**, **46.81% (IWY today) → 50.00%**; IWF from its actual 44.47% → 17.55%. A one-point reset change roughly doubles the answer, against four points for the entire 4%-vs-8% argument. **THE FAMILY'S ARITHMETIC TAKES A SEVENTH MEASUREMENT AND STAYS ON THE MAJORITY SIDE:** 12-session 45%-reset IWY **51/1,269 = 4.02%** (Sep/Dec/Oct 3.95–4.02, May 4.02; Nov/Jun 7.85–7.90) — now 5 lanes vs 2. 17-session IWY **95/1,264 = 7.52%**, IWF **111/1,264 = 8.78%**, adjusted closes **49/1,269 = 3.86%**. Long legs reproduce the *dissenting* lanes too: 34-session **241/1,247 = 19.33%** (Oct 19.61), 54-session **254/1,227 = 20.70%** (Nov 18.49), 74-session monthly **209/1,207 = 17.32%** and quarterly **534/1,207 = 44.24%** — both exact matches to the May lane. **NON-MONOTONICITY REPRODUCED INDEPENDENTLY:** June with May alone **192/1,207 = 15.91%**, with April+May **209/1,207 = 17.32%** — *higher* by 1.41pp (May lane: 1.58pp). Two implementations now agree on a result that reads like an error. **GEOMETRY, COMPUTED:** session walk over an independently built 2027 closure set matching `src/domain/market-calendar.ts` on all ten full closures — 03-10→03-22 **8**, →03-25 **11**, →**04-27 33**, →04-30 **36**, →05-25 **53**, →06-25 **74**; 03-25→04-27 **22**, 04-27→05-25 **20**. T-3 walks: 03-31→**03-25** (over Good Friday 03-26), **04-30→04-27**, 05-28→**05-25**, 06-30→**06-25**. **SCOPE:** screener (**1,900,533 bytes**) → IWF $125.57B, IWD $83.37B, IWP $19.58B, **IWY $15.83B**, IWS $15.52B, IWO $14.68B, IWN $14.48B, IWX $3.92B = **$292.95B**; IWY corroborated directly from its product page (*Net Assets of Fund* 15,825,958,9xx, as of Sep 04 2026) — better provenance than the screener alone, recorded because holdings are blocked. Fire case ~**$475M**. Cohorts (holdings **2026-08-27**) **IWY 46.81% / IWF 44.47%**, matching all five siblings to the basis point; GOOG standalone **4.94%/4.77%** so a security-level read understates each ~5pp. **SINGLE-NAME LEG DEAD:** NVDA **16.21%/15.79%** vs a 22.5% cap and 24% trigger. **THE COHORT HAS AN ENTRY CANDIDATE, NOT JUST AN EXIT ONE — NEW:** AVGO **5.57%** needs **−13.8%** relative to leave; **MU 3.97%** needs **+20.9%** relative to enter (~4pp *toward* a breach in one step). **GUIDE UNCHANGED — A KILL SWITCH THAT DID NOT FIRE:** v5.4 re-fetched at **652,008 bytes / 62 streams**, identical to five sibling reads. **Adjacency — peers:** none (`symbols: []`). **Macro: 4** tracked events within 5d — the family's **thinnest** corridor (40/38/31/17/11/6/9 around the other seven, one method). `consumer-confidence-2027-04-27` (**medium**) and `fhfa-hpi-2027-04-27` (**low**) land **on the 04-27 close the test is struck from**; `boj-decision-2027-04-28` (medium) and **`fomc-2027-04-28` (high)** land **between the strike and the implementation** — the only `high` inside that gap anywhere in the family. **AND IT MEASURES AT NOTHING — a REFUTED leg:** using **46** FOMC decision dates extracted from federalreserve.gov (HTTP 200, 164,831 bytes, footer *"Last Update: August 19, 2026"*, which also publishes **"April 27-28"** for 2027 — so the test is struck on the meeting's *first day*), the cohort's 3-session strike→effect drift is median **0.450pp** across **120** FOMC-straddling gaps against **0.445pp** across the other 1,158, p90 1.173 vs 1.148, and the FOMC max (2.12pp) is *below* the unconditional max (4.80pp). One post-hoc tilt recorded with its caveat: a 48% cohort falls back under by the effective open in **30.0%** of FOMC gaps vs **42.2%** otherwise (~2.7σ on n=120, cut chosen after seeing the corridor). **Vol:** baseline, no prior; VIX 15.72. **Geopolitical:** nothing touching index methodology. **Event tape:** playbooks + sweep re-grepped for `rebalanc\|reconstitution\|russell\|capping\|index.flow\|IWF\|IWY` → **zero hits**; no index notice recording any capping check firing was found. **BLOCKED FETCHES RECORDED, NOT SUBSTITUTED SILENTLY:** the iShares holdings ajax again returned an HTML product page under HTTP 200 for both IWY and IWF (content-type `text/csv` and `application/json` — the header lies); both in `probe-ref.blocked`, holdings from an aggregator, trusted only because they reproduce five independent sibling reads exactly. **NO ADJACENT FILED, FOUR CLASSES DECLINED:** the **2027 Russell US Style review capping cut-off / review effective dates** (data cut-offs, the class four lanes have declined); the **2027-04-30 Q2 Index Rebalance market-cap / free-float / IPO data cut-off**, which the FAQ's published calendar puts on the last business day of April and therefore on **this event's own effective date** — declined as the same class, recorded explicitly so a later lane does not read the coincidence as a miss; the **2027 FOMC dates** (all eight on the Fed's published list already tracked, checked individually, plus `fomc-2028-01-26`); and the **2027-04-29 recap trade date** (a settlement mechanic inside a tracked event). Registered **FT-…-1** (04-27 cohorts at or below 48%), **FT-…-2** (the 2027 rebalance calendar publishes four capping dates again, not more — scored 2026-12-31, long before this date, because it bears on four ledgers), **FT-…-3** (the 45% reset sensitivity holds at ≥10pp across a 44–47% start on an independent rebuild). | — (stance set: **stand aside** Today/week, **stand aside; hold the entry, and mark the monthly reading below even** this month, **stand aside; watch 2026-10-30 for the tape's first word on the cadence** this quarter; the refusal rests on an owner-published but prefix-gapped conditional date whose two source documents now conflict *asymmetrically*, a path-simulated **19.63%** breach probability that is better than 4-to-1 against, a dead single-name leg, zero house-playbook hits, and a ~$475M fire case — with the split verdict itself the session's finding: the entry's usefulness and the entry's reality moved in opposite directions) | 2026-10-09 (band `low:15+`, every 30d; tightens to `low:0+`, every 7d, on 2027-04-15). Close-out by 2027-05-06 |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint notes any
row past ~1,200 chars): it is a note to the next session, not an essay, and a stance *change* earns its
sentence in the Stance section with the row as its receipt. The adjacency sweep (peer prints · macro
surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in every row; a dated
adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-russell-style-month-end-capping-effective-2027-04-30.json`
(`status: "estimate"`) in the same PR — your own file, never another event's canonical one (#1717).
Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from
memory — after which this doc goes quiet.
