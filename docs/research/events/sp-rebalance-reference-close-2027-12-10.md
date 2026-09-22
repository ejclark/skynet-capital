# S&P Select Sector Indices December rebalance — the Quarterly Qualification Date close — sp-rebalance-reference-close-2027-12-10

**Kind:** sector · **Date:** 2027-12-10 (estimate — EST: date derived by applying an SEC-filed rule to the 2027 calendar, the rule re-fetched and re-read in full by this session. SEC EDGAR, Select Sector SPDR Trust Form 497, accession `0001193125-26-031948`, document `d85739d497.htm`, fetched direct 2026-09-09 (HTTP 200, 2,388,335 bytes): *"If on the second Friday of any calendar quarter-end month (a 'Quarterly Qualification Date') … "* and *"The rebalancing … occurs at the closing prices of the second Friday of March, June, September and December. Changes will become effective after the market close on the third Friday …"*. December 2027's Fridays are the 3rd, **10th**, 17th, 24th and 31st. Stays `estimate` on three counts — the filing dates the RULE not this instance, this lane may not self-confirm an in-sweep discovery, and **the operative filing is under live amendment**, see leg 2) · **Impact:** low
**Last assessed:** 2026-09-09
<!-- probe-ref: {"symbols":{},"vix":15.72,"daysBand":"low:15+","adjacentIds":["fomc-2027-12-08","ndx-annual-reconstitution-announcement-2027-12-10","vix-expiration-2027-12-15"],"screenStreak":0,"blocked":[]} -->

## At a glance

**TL;DR.** **Stand aside — and the reason to read this one is that the calendar's own primary source
is being withdrawn, and nobody had noticed.** 2027-12-10 is the Quarterly Qualification Date whose
closing prices set the capped weights eleven Select Sector SPDRs must trade into the 2027-12-17
witching. Three things are new here. **(1) The SEC filing that dates this event — and four sibling
events — is under live amendment, and the amendment deletes the rule.** Post-Effective Amendment
No. 60 (`485APOS`, accession `0001193125-26-303372`, filed **2026-07-14**, fetched direct today)
carries a complete Statement of Additional Information with the **entire capping methodology absent**:
zero occurrences of "second Friday", "Quarterly Qualification", "Asset Diversification", "Component
Stock", "4.8%" or the January 497's "CONSTRUCTION AND MAINTENANCE" heading, against 2 / 2 / 6 / 29 /
several / 1 in the operative filing — and its table-of-contents preamble quietly drops the words
*"the Select Sector Indices"* from the sentence naming what was sourced externally. It goes effective
around **2026-09-27** (75 days after filing under Rule 485(a)(2)). The *rule* is S&P DJI's and is very
unlikely to change; what changes is that this calendar may lose its only fetchable primary for it,
because S&P DJI's own methodology PDFs `403` this runner. Registered as `FT-…-1`. **(2) The
reference-to-effective wedge is sized for the first time, and it dies on its own placebo — which is
the point.** The caps are priced at this close but the trade prints five sessions later, so drift
resizes it: across ten mega-cap/sector-ETF pairs over **944** quarterly windows (1999–2026), the mean
absolute wedge is **2.37%**, median **1.47%**, p90 **5.23%** — which on a 24.36%→23.00% cap moves
the trade by **20%** of its priced size at the median, **32%** at the mean, **71%** at p90, and a
−7.4% wedge (**5.1%** of windows) erases the trim entirely. It is **not** an anomaly: December is
indistinguishable from the other quarterly legs (MW **p=61.0%**), the sign is a coin flip (**118/232**
positive), and a placebo over all **59,765** overlapping five-session windows on the same pairs is
slightly *wider* (2.49% / 1.53% / 5.58%). **(3) The corridor is the inverse of March's.**
[`sp-rebalance-reference-close-2027-03-12`](sp-rebalance-reference-close-2027-03-12.md) recorded that
its close carries no macro print at all; here [`fomc-2027-12-08`](fomc-2027-12-08.md) — the year's
final SEP meeting — sits **two sessions** before the prices are struck. This lane refuses to build an
FOMC-proximity rule on that, and the refusal is measured, not stylistic. Date is `estimate`; that
widens caution and licenses nothing, and no house playbook is index-flow-keyed.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** | High | D-457, `symbols: []`, and no house playbook is rebalance-, opex- or index-flow-keyed — `trade-playbooks.md` and `multi-symbol-sweep.md` re-grepped this session for `rebalanc\|index effect\|select sector\|capping\|reconstitut\|closing auction` → **zero hits** in both | A house index-flow or closing-auction instrument landing in `trade-playbooks.md` before **2026-10-09**, this event's next scheduled pulse — there would then be a mechanism to point at this date, and this sheet gets rebuilt on measured house data |
| This week | **Go archive the rule text before it disappears — trade nothing** | High | PEA No. 60's SAI, fetched today, contains **none** of the capping methodology, and it goes effective ~**2026-09-27**; S&P DJI's own methodology PDFs `403` this runner, so the January 497 is the last fetchable primary this calendar has for the second-Friday rule | The first definitive SAI filed off accession `0001193125-26-303372` (CIK `0001064641`, on or after **2026-09-12**) containing "second Friday" — the deletion was a draft artifact, the primary survives, and this whole leg is a false alarm. Registered `FT-sp-rebalance-reference-close-2027-12-10-1` |
| This month | **Watch the 2026-12-11 → 2026-12-18 cycle as the out-of-sample draw on the wedge** | Medium | The identical rule runs on the identical eleven funds one year earlier, and it is the cheapest test of whether the reference→effective window really is ordinary dispersion rather than an index-flow signature this study failed to find | The ten-pair mean \|wedge\| over **2026-12-11 → 2026-12-18** printing **outside 1.0%–3.5%**, a band covering 23 of 27 historical December cycles — the window would not be ordinary and the null below needs rebuilding. Registered `FT-sp-rebalance-reference-close-2027-12-10-2` |
| This quarter | **Do not reinstate an FOMC-proximity corridor rule on the gap-+2 shape** | High | `fomc-2027-12-08` sits two sessions before this close, and `scripts/research/fomc-expiration-proximity.mjs` — re-run fresh today — shows the raw +2 result (**2.147 vs 1.862** relvol, **P=0.002**) dying era-ranked (**P=0.326**) and **reversing** inside the modern era (**−0.080**, **P=0.535**) | A modern-era-only (2013+) test of gap +2 turning **positive at P < 0.05** on new prints before **2027-12-10** — the era control would stop explaining the effect away and the corridor rule earns a rebuild |

**Signals & conditions** — the buy/sell/hold triggers:

- Date is `estimate` (`EST:`, rule-derived) — it widens caution about the 2027-12-17 close and licenses no date-keyed action.
- **The primary is expiring.** PEA No. 60 (filed 2026-07-14, effective ~2026-09-27) removes the capping methodology from the SAI. Archive the 497 text; re-check CIK `0001064641` every pulse.
- **Never trade the capping.** The pro-forma goes to S&P DJI clients after this close; the public sees weights only after the fact.
- **Two independent tests, re-read verbatim this session.** Single name > **24%** → cut to 23%; Σ of names each > **4.8%** > **50%** → cut the cohort to 45%.
- **A reference close does not determine the trade — it determines about two-thirds of it.** Median wedge moves the executed size **20%** off the priced size; p90 moves it **71%**; **5.1%** of windows erase a 1.36pp trim outright.
- **The wedge is ordinary, not anomalous** — December MW **p=61.0%** vs other quarters, and a 59,765-window placebo is *wider*. Any future pulse that "finds" a wedge effect has re-found five sessions of dispersion.
- **FOMC at T−2 is a known trap, already instrumented.** `fomc-expiration-proximity.mjs` exists to stop this exact reinstatement; run all three of its numbers or none.
- **The NDX reconstitution is announced after this same close** ([`ndx-annual-reconstitution-announcement-2027-12-10`](../../../src/domain/market-events/proposals/ndx-annual-reconstitution-announcement-2027-12-10.from-sp-quarterly-rebalance-effective-2027-12-20.json)) — strictly *after* the cap prices are struck, so it cannot contaminate the arithmetic; it can only move the 12-13 → 12-17 wedge.
- Dated chain: NDX reference close **2027-11-30** → FOMC **2027-12-08** → **this QQD 2027-12-10** + NDX announcement after the close → implementation at the **2027-12-17** witching close → effective open **2027-12-20** → conditional secondary reweighting test **2027-12-30** / effective **2027-12-31** (proposed `estimate`, this PR).

## Initial research

### The question

This id reached the calendar as one proposal, filed 2026-09-08 by the
[`sp-quarterly-rebalance-effective-2027-12-20`](sp-quarterly-rebalance-effective-2027-12-20.md) initial
research. That proposal is honest and largely right, and it explicitly hands forward a size figure it
did **not** re-measure and a volume premium it had already refused to call December-specific. Three
sibling ledgers ([March 2027](sp-rebalance-reference-close-2027-03-12.md),
[December 2026](sp-rebalance-reference-close-2026-12-11.md), and the proposer) have between them
already established the mechanism, the two cap tests, the ~$1.1B family size, the
proportionate-vs-iterative rule fork and the December-is-not-special volume null.

So the question is not "what is this event" — it is answered. It is: **what does a fourth session on
the same mechanism owe the reader that the first three do not already carry?** This session took two
swings and one refusal.

**One-line verdict:** the load-bearing find is a **sourcing** one — the SEC filing every one of these
ledgers dates itself from is being amended out of existence, weeks from now, and no sibling caught it;
the second is a **measurement** that a reference close leaves roughly a third of its own trade
undetermined and that this is entirely ordinary; and the third is a **refusal** to build the
FOMC-proximity corridor rule the December 2027 calendar shape invites.

### Method

Macro / market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — the entry
carries `symbols: []`, so no symbol-keyed instrument applies and `scripts/research/` owns no
index-flow instrument. Nothing was taken from the proposal or from a sibling on faith.

- **The proposal was read in full first**, per the canonical-file rule (#1449): this session writes
  `src/domain/market-events/sp-rebalance-reference-close-2027-12-10.json` itself and the proposal
  becomes inert.
- **SEC EDGAR, Form 497** acc. `0001193125-26-031948` — re-fetched direct (HTTP 200, **2,388,335
  bytes**, byte-identical to four prior sibling fetches) and the *whole* four-step capping
  methodology plus the secondary-reweighting sentence extracted verbatim, not the timing quote alone.
- **EDGAR submissions** (`data.sec.gov/submissions/CIK0001064641.json`) — every filing since
  2026-01-01 enumerated. This is where the sibling checks stopped short: they named the 2026-04-24
  `485BPOS` and the 2026-06-12 `497` and concluded "neither moves the rule". A **`485APOS` filed
  2026-07-14** sits between those two dates and neither named it.
- **The 485APOS itself** (acc. `0001193125-26-303372`, `d137905d485apos.htm`) — fetched direct
  (HTTP 200), tag-stripped, and both its prospectus and its SAI term-counted against the 497's, plus
  the accession's own file index pulled to confirm the amendment is a **single** document (the SAI is
  inside it, not a missing exhibit).
- **`scripts/research/fomc-expiration-proximity.mjs --fresh`** — the house trap detector, re-run with
  both caches busted (130 quarterly witchings 1994+, 289 scheduled decisions).
- **Yahoo split/dividend-adjusted daily bars** via `scripts/research/market-data.mjs`, caches busted
  first per the cache-discipline rule — ten mega-cap/sector-ETF pairs, used to build the wedge study
  and its placebo from scratch (no such instrument existed).
- House sources: `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md` grepped for
  `rebalanc|index effect|select sector|capping|reconstitut|closing auction` → **zero hits**; all three
  sibling ledgers and the NDX proposal read in full.

### Conviction legs, tested

1. **The 2027-12-10 date is right — SUPPORTED.** The 497 names the *defined term* directly: *"If on
   the second Friday of any calendar quarter-end month (a 'Quarterly Qualification Date')…"*, and
   separately *"The rebalancing … occurs at the closing prices of the second Friday of March, June,
   September and December. Changes will become effective after the market close on the third
   Friday…"*. December 2027's Fridays, computed mechanically here: 12-03 / **12-10** / 12-17 / 12-24 /
   12-31. The second is 12-10; the third, 12-17, is independently `confirmed` on OCC's own 2027
   calendar by [`opex-2027-12-17`](opex-2027-12-17.md). December 2027's one equity closure is
   2027-12-24 (Christmas Day is a Saturday), which falls **after** both dates and displaces neither.

2. **The filing this calendar depends on is being amended, and the amendment deletes the rule —
   SUPPORTED, and this is the session's load-bearing find.** `485APOS` Post-Effective Amendment
   No. 60, accession `0001193125-26-303372`, filed **2026-07-14**, is a single document (its accession
   index lists one `.htm` plus five graphics) containing both a prospectus and a complete SAI — the
   SAI's own header reads *"THE SELECT SECTOR SPDR® TRUST (THE 'TRUST') STATEMENT OF ADDITIONAL
   INFORMATION [-], 2026"* and its table of contents is section-for-section identical to the January
   497's (Disclaimers · General Description of the Trust · Investment Policies · … · Financial
   Statements · Appendices). Term counts, pending SAI versus operative 497:

   | Term | Operative 497 (2026-01-30) | Pending PEA No. 60 (2026-07-14) |
   |---|---|---|
   | `CONSTRUCTION AND MAINTENANCE` | 1 | **0** |
   | `second Friday` | 2 | **0** |
   | `Quarterly Qualification` | 2 | **0** |
   | `Asset Diversification` | 6 | **0** |
   | `Component Stock` | 29 | **0** |
   | `4.8%` | several | **0** |
   | `float-adjusted` | 1 | **0** |
   | `24%` (cap sense) | yes | **0** — both hits are backup-withholding boilerplate |

   The pending prospectus retains only *"The Index is rebalanced on a quarterly basis in March, June,
   September and December"* — the cadence with the mechanism stripped out. The fingerprint that this
   is deliberate rather than a drafting gap: the 497's TOC preamble reads *"The information contained
   herein regarding **the Select Sector Indices**, securities markets and The Depository Trust Company
   … was obtained from publicly available sources"*; the pending SAI's reads *"The information
   contained herein regarding securities markets and The Depository Trust Company …"*. The index
   clause was edited out of the sentence that exists to disclaim it.

   **What this does and does not mean.** The rule belongs to **S&P DJI**, not to SSGA; a fund removing
   a restatement of its index provider's methodology from its own SAI is a disclosure decision, and
   the overwhelmingly likely reading is simplification-by-reference. So the **mechanism is very
   unlikely to change** and this ledger does not claim it will. What changes is **what this lane can
   cite**: S&P DJI's `methodology-sp-select-sector-indices.pdf`, `methodology-sp-us-indices.pdf` and
   the Index Policies & Practices PDF have all `403`'d this runner on two separate sessions (recorded
   in the December-2026 sibling's `probe-ref.blocked`), so the January 497 is the *only* fetchable
   primary the calendar has for the second-Friday rule — and it is the one under amendment. Rule
   485(a)(2) puts effectiveness ~75 days after filing, i.e. around **2026-09-27**. Registered as
   `FT-sp-rebalance-reference-close-2027-12-10-1`.

3. **A reference close fixes the cap, not the trade — and the gap is now sized — SUPPORTED.** Test (i)
   measures *"prices as of the reference date and membership, shares outstanding and investable weight
   factors as of the rebalancing effective date"*. So the **target** is struck on 2027-12-10 prices and
   never moves; the fund's **actual** weight keeps drifting to the 2027-12-17 close, and the trade it
   must print is the difference. The March sibling named this mechanic (its leg 3) and stopped there.
   Sizing it: for a name at reference weight *w* drifting *r* relative to its sector, the effective
   weight moves by ≈ *w·r·(1−w)*. Measured across ten mega-cap/sector-ETF pairs — XOM/XLE, AMZN/XLY,
   META/XLC, NVDA/XLK, MSFT/XLK, JPM/XLF, LLY/XLV, AAPL/XLK, GOOGL/XLC, WMT/XLP — over every
   quarter-end second-Friday → third-Friday window 1999–2026, **n = 944**:

   | | mean \|wedge\| | median | p90 |
   |---|---|---|---|
   | All quarters (n=944) | **2.37%** | **1.47%** | **5.23%** |
   | December only (n=232) | 2.38% | 1.45% | — |
   | Mar/Jun/Sep (n=712) | 2.37% | 1.48% | — |

   Applied to the concrete single-name case the December-2026 sibling put on the record (AMZN at
   **24.36%**, capped to **23.00%**, priced trim **1.36pp**): the median wedge moves the executed
   trade **0.267pp = 20%** of its priced size, the mean **0.439pp = 32%**, p90 **0.964pp = 71%**. The
   drift that erases the trim entirely is **−7.38%**, observed in **5.1%** of all windows and **4.3%**
   of December windows. So a fund can arrive at the witching close needing materially more, materially
   less, or none of the trade its reference prices implied.

4. **The wedge is ordinary dispersion, and its own placebo says so — SUPPORTED, and it is why leg 3 is
   a size and not a signal.** Two controls, both run before the number was written down. **December
   versus the other quarterly legs:** Mann-Whitney **z = 0.510, P = 61.0%** (232 vs 712) — no December
   step, consistent with the proposer's own finding that December's rebalance mechanics are a null.
   **Signed drift:** **118 of 232** December windows positive — a coin flip, so there is no
   directional "names drift up into the effective close" story to trade. **The placebo:** every
   overlapping five-session window on the same ten pairs since 1999, **n = 59,765** — mean **2.49%**,
   median **1.53%**, p90 **5.58%**, i.e. *marginally wider* than the QQD→effective window itself. The
   reference→effective corridor is, if anything, a slightly calmer week than average. **This kills the
   tempting inference before anyone draws it**: a later pulse that measures the wedge and calls it an
   index-flow signature has re-found five sessions of ordinary single-name-vs-sector dispersion. The
   value of leg 3 survives that intact, because its claim was never "the wedge is special" — it was
   "the wedge is big relative to the trade," and 20%–71% of a 1.36pp trim is big whether or not the
   dispersion generating it is remarkable.

5. **The corridor is the inverse of March's, and the invited corridor rule is refused — SUPPORTED.**
   Within five days this calendar tracks three ids: [`fomc-2027-12-08`](fomc-2027-12-08.md) (**high**,
   `estimate`, the year's final SEP meeting) at **T−2**,
   `ndx-annual-reconstitution-announcement-2027-12-10` (`estimate`, proposal) on **this very session**,
   and `vix-expiration-2027-12-15` (`estimate`, proposal) at **T+5**. The March sibling's leg 10 read
   *"2027-03-12 currently has no macro print scheduled on it at all … the caps are struck on an
   ordinary tape"*; December 2027 is the opposite shape, and it is exactly the shape that tempts a
   lane into a "treat the decision and the pricing close as one window" rule. **This house already
   built the instrument that says no.** `scripts/research/fomc-expiration-proximity.mjs` exists as a
   trap detector — three ledgers proposed, withdrew and refused to reinstate that rule — and re-run
   fresh today it prints: raw gap +2 **2.147 vs 1.862** relative volume, **P = 0.0020**;
   era-ranked **0.558 vs 0.505**, **P = 0.3260**; modern-era-only (2013+) **2.197 vs 2.277**,
   **P = 0.5351** — the sign **reverses**. The +2 cohort is 92% dated 2013 or later against 20% of the
   rest; the effect is the calendar moving, not the Fed. **Two honest caveats this ledger will not
   paper over:** that instrument measures the gap to an *expiration* session, not to a QQD, so it is a
   cousin of this event's shape rather than a test of it — and this event's own FOMC gap to the
   *witching* close is **+7**, not +2, because the decision precedes the QQD, not the implementation.
   The refusal therefore rests on the control discipline plus the absence of any measured mechanism,
   not on a direct test.

6. **The NDX reconstitution announcement lands on this session and cannot touch the caps —
   SUPPORTED.** Nasdaq's methodology (fetched by the proposer 2026-09-08, quoted in
   `proposals/ndx-annual-reconstitution-announcement-2027-12-10.from-sp-quarterly-rebalance-effective-2027-12-20.json`)
   dates the annual reconstitution announcement *"after the close on the sixth trading day prior to
   the Reconstitution Effective Date"*, which for a 2027-12-20 effective open is after the close on
   **2027-12-10** — this event's own session. The ordering is what matters and it is unambiguous:
   the Select Sector cap prices are the **closing** prices of 2027-12-10, and the NDX membership list
   publishes **after** that close. So the announcement is mechanically incapable of contaminating the
   cap arithmetic. What it *can* do is sit inside the wedge window of leg 3: any name added to or
   deleted from NDX on 12-10 spends 12-13 → 12-17 repricing, and if it is also a Select Sector
   cap-cohort member its drift moves the size of the trade printed into the witching close. This
   ledger makes **no** claim that such an overlap will exist in 2027 — the membership list does not
   exist yet — and registers none.

7. **The family size and the December volume premium are inherited, explicitly not re-measured —
   MIXED, by design.** The ~**$1.10B** one-way capping trade against ~**$391B** of Select Sector SPDR
   assets is the March sibling's measurement on State Street's own holdings files, self-dated
   2026-09-03, corroborated within 0.8% by the December-2026 sibling's issuer-derived **$394.62B**.
   Re-measuring it today would produce a *2026* number for a *2027* event and would be worth nothing
   more than the inherited one; every weight in that figure is one full capping reset — several, by
   2027-12-10 — away from anything that survives. Likewise SPY's December third-Friday relative volume
   (**1.639×** mean / **1.789×** median vs **1.420×** / **1.377×** for the other quarterly legs) is the
   proposer's, along with its own refusal to call it December-specific (**MW p = 13.6%**, n = 21);
   only the step over an *ordinary monthly* opex Friday is established (**p = 1.89%**). MIXED because
   both figures are load-bearing for how a reader should size the corridor and neither is this
   session's work.

8. **No house playbook is index-flow-keyed — SUPPORTED, re-verified not inherited.**
   `trade-playbooks.md` and `multi-symbol-sweep.md` grepped this session for
   `rebalanc|index effect|select sector|capping|reconstitut|closing auction` → **zero hits** in both.
   S1/G1 are earnings-dated run-ups, S2 the never-hold-the-print guard, S3 an earnings reaction-day
   fade (blocked on shorting), S4 an overnight-vs-buy-and-hold structural note, E1 a
   don't-trade-the-open execution rule. The only contact remains **S4 execution hygiene**, whose
   close-side preference runs into this rebalance's MOC on 2027-12-17 — a guard
   [`opex-2027-12-17`](opex-2027-12-17.md) already carries.

9. **One dated adjacency is missing from the calendar and is proposed — SUPPORTED.** The same 497
   sentence-block dates a **conditional secondary reweighting**: *"if, on the second to last business
   day of March, June, September, or December a company has a weight greater than 24% or the sum of
   the companies with weights greater than 4.8% exceeds 50%, a secondary reweighting will be triggered
   with the reweighting effective date being after the close of the last business day of the month."*
   The calendar tracks this backstop for 2026-09-30, 2026-12-31, 2027-03-31 and 2027-06-30 and stops.
   December 2027's weekdays end 12-27 / 12-28 / 12-29 / **12-30** / **12-31**; the month's one equity
   closure is 2027-12-24 and 2027-12-31 is a session (`sifma-bond-early-close-2027-12-31` is an *early
   close*, and `fed-board-closure-2027-12-31`'s own federalreserve.gov K.8 source has the Reserve
   Banks open with only the Board shut). So the test day is **2027-12-30** and the effective day
   **2027-12-31**, proposed in this PR as `estimate`. It is the rule's own answer to leg 3's wedge:
   if drift over the rest of the quarter pushes a name back through a limit, the filing re-caps.

10. **What is deliberately *not* proposed.** PEA No. 60's effectiveness (~2026-09-27) is dated,
    primary-sourced and material to this calendar — and it is **not** a market event. Filing a
    registration-statement amendment as a tracked entry would put a non-market date on a market
    calendar to serve this lane's own bookkeeping; it belongs in a kill switch and a forward test,
    which is where it is. Nor is a pro-forma release date proposed: the March sibling established
    that the 497 is primary evidence for the reference close and the effective date and for **neither**
    pro-forma release, and nothing fetched today changes that.

### What the conditions support

Nothing directional, at any horizon, 457 days out. What the conditions support is **one archival
action, one number, and one refusal**:

- **Archive.** The operative rule text should be quoted into this repo's own ledgers *before* PEA
  No. 60 goes effective, because after that the only fetchable primary may be gone and S&P DJI's own
  PDFs `403` this runner. That is done here — the full four-step methodology and the
  secondary-reweighting sentence are now quoted verbatim across this ledger and two calendar entries.
- **Measure.** A reference close leaves roughly a third of its own trade undetermined (median 20%,
  p90 71%), and that is ordinary dispersion rather than a signature — a number the next three sessions
  on this mechanism do not have to rediscover, and a placebo that stops them mistaking it for one.
- **Refuse.** The gap-+2 FOMC shape does not get a corridor rule, and the refusal now has this
  event's name on it so the next December lane does not reopen it from scratch.

### Honest limits

Every dollar and weight figure inherited from a sibling is dated **2026-09-03/04** and describes
September 2026, not the 2027-12-10 reference close 457 days away; they size the *mechanism* and
forecast nothing about which names bind in 2027. The wedge study uses **today's** mega-cap/sector
pairs projected backwards — XOM has not been XLE's top name for all 27 years, XLC did not exist
before 2018 (META and GOOGL contribute 8 windows each, not 27), and the pair list is chosen for
continuity of listing rather than by any rule about which names actually breached a cap in a given
quarter; it measures *the dispersion a large name experiences against its sector over that window*,
which is the right quantity for sizing the mechanic and is **not** a study of historical cap breaches.
The wedge→trade-size conversion is a first-order approximation (*w·r·(1−w)*) applied to one
illustrative weight, and it ignores the effective-date share-count and investable-weight-factor
changes the filing also applies. `|wedge|` is computed on split- and dividend-adjusted closes, so it
carries ordinary adjustment noise; the 1999–2002 December cycles (up to 7.25% cross-pair mean) are
dot-com-era outliers that inflate the full-sample mean and are left in rather than trimmed. The
485APOS finding is a **term-count and TOC comparison of two documents**, not a redline: this session
did not diff them line by line, and it makes no claim about SSGA's intent beyond what the deleted
TOC clause shows. Rule 485(a)(2)'s 75-day arithmetic is applied by this session; the filing's
effectiveness checkbox could not be read from the tag-stripped text, so **2026-09-12** (485(a)(1),
60 days) is the earlier bound and both are carried. The FOMC instrument measures gaps to expiration
sessions, not to Quarterly Qualification Dates — leg 5 says so explicitly and its refusal rests on
control discipline plus an absent mechanism, not on a direct test. Nothing above is a position:
shorting is blocked house-wide, no house playbook is index-flow-keyed, and the date is `estimate`.

## Stance & kill switches

**Stance (date `estimate`, `EST:` rule-derived).** Treat 2027-12-10 as a **known-mechanism,
low-impact market-structure close** — the session whose prices fix the caps that eleven Select Sector
SPDRs trade into the 2027-12-17 witching. No position, paper or otherwise, is licensed by it; the
`estimate` label bars date-keyed action independently and no house playbook is index-flow-keyed
regardless. Three things are this session's, and they are what the next pulse should start from.
**(a) The primary is expiring, and that is the only genuinely urgent thing on this page.** PEA No. 60
(filed 2026-07-14, effective ~2026-09-27) carries an SAI with the entire capping methodology absent,
and S&P DJI's own methodology PDFs `403` this runner — so this calendar is weeks away from possibly
having no fetchable primary for a rule five of its entries derive their dates from. The mechanism is
very unlikely to change; the citability is what is at risk, and the rule text is archived here
against that. **(b) A reference close determines about two-thirds of its own trade.** The
reference→effective wedge moves the executed size by **20%** of the priced size at the median, **32%**
at the mean, **71%** at p90, and **5.1%** of windows erase a 1.36pp single-name trim outright — so
any statement of the form "this close sizes the trade" is now quantifiably an over-claim, including
the ones in this event's own seeding note. **(c) The wedge is ordinary, and the placebo is part of
the finding, not a footnote.** December is indistinguishable from the other quarterly legs
(**P = 61.0%**), the sign is a coin flip, and 59,765 arbitrary five-session windows are *wider*. A
future pulse that revives the wedge as an index-flow signature has re-found December. The standing
refusal to carry forward: **no FOMC-proximity corridor rule on the T−2 shape**, on the house
instrument's own era-ranked and modern-era controls.

**Kill switches:**

- **The first definitive SAI filed off accession `0001193125-26-303372` (CIK `0001064641`, on or
  after 2026-09-12) contains "second Friday"** — the deletion was a draft artifact, the primary
  survives, and stance (a) is a false alarm to be struck. Registered as
  `FT-sp-rebalance-reference-close-2027-12-10-1`; check EDGAR at every pulse regardless.
- **The ten-pair mean |wedge| over 2026-12-11 → 2026-12-18 prints outside 1.0%–3.5%** — the
  reference→effective window is not ordinary dispersion after all and legs 3 and 4 rebuild together.
  Registered as `FT-sp-rebalance-reference-close-2027-12-10-2`.
- **A modern-era-only (2013+) test of the FOMC gap-+2 cohort turns positive at P < 0.05** — the era
  control stops explaining the raw result away and leg 5's refusal is withdrawn. Re-run
  `scripts/research/fomc-expiration-proximity.mjs --fresh` at every pulse; observe by **2027-12-10**.
- **S&P DJI or SSGA publishes a methodology change moving the second-Friday reference, the third-Friday
  effective date, or the 24% / 4.8% / 50% thresholds** — every date in this corridor re-derives. The
  operative filing was re-fetched 2026-09-09 and one *pending* amendment identified; re-check CIK
  `0001064641` at every pulse.
- **A 2027-dated S&P DJI or SPDR rebalance schedule becomes fetchable** — this entry promotes off
  `estimate` if it lists 2027-12-10, or the corridor re-dates if it does not. Three S&P DJI PDFs have
  `403`'d this runner across two prior sessions; re-attempt each pulse and record failures in
  `probe-ref.blocked`.
- **A house index-flow or closing-auction instrument gets built** — leg 8's "no playbook is
  index-flow-keyed" stops being a grep result and starts being a measurement, and this sheet is
  rebuilt on house data. Observe by **2026-10-09**, this event's next scheduled pulse.
- **The 2027 NDX reconstitution announcement names a Select Sector cap-cohort member** — leg 6's
  "cannot contaminate the arithmetic, can only move the wedge" becomes a live rather than theoretical
  overlap. Not observable before **2027-12-10** itself.

**Registered forward tests.** `FT-sp-rebalance-reference-close-2027-12-10-1` (score by **2026-10-31**)
and `-2` (score by **2026-12-28**) — see
[`forward-tests/sp-rebalance-reference-close-2027-12-10.md`](../forward-tests/sp-rebalance-reference-close-2027-12-10.md).
Both score inside the next four months, more than a year before this event needs either answer, which
is the point: they settle whether this calendar still has a primary source and whether its one new
measurement holds out of sample, while there is time for the answer to matter.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-09 | D457 | Initial research banked; canonical `sp-rebalance-reference-close-2027-12-10.json` written after reading the one proposal in full (`from-sp-quarterly-rebalance-effective-2027-12-20`, now inert). Probe-ref baseline set: no symbols, **VIX 15.72** (2026-09-08 close), band `low:15+`, 3 adjacents, no blocked fetches this session. SEC 497 acc. `0001193125-26-031948` re-fetched (**2,388,335 b**, byte-identical to four sibling fetches) and the FULL four-step methodology + the secondary-reweighting sentence extracted verbatim; Dec 2027 Fridays recomputed mechanically (03/**10**/17/24/31), one equity closure in the month (12-24) displacing neither date. **LOAD-BEARING FIND — the primary is expiring, and three sibling sessions missed it.** EDGAR submissions enumerated from 2026-01-01: between the 2026-04-24 `485BPOS` and the 2026-06-12 `497` that siblings named as "neither moves the rule" sits **`485APOS` PEA No. 60, acc. `0001193125-26-303372`, filed 2026-07-14** — a single-document amendment (accession index: 1 `.htm` + 5 graphics) carrying a complete SAI whose TOC is section-for-section identical to the 497's and in which the capping methodology is **entirely absent**: `CONSTRUCTION AND MAINTENANCE` 0 vs 1, `second Friday` 0 vs 2, `Quarterly Qualification` 0 vs 2, `Asset Diversification` 0 vs 6, `Component Stock` **0 vs 29**, `4.8%` 0, `float-adjusted` 0 vs 1 (both `24%` hits are backup-withholding boilerplate). Deliberate, not a gap: the TOC preamble drops the words *"the Select Sector Indices"* from the sentence naming externally-sourced content. Effective ~**2026-09-27** (485(a)(2), 75d; 485(a)(1) 60d = 2026-09-12 is the earlier bound). The rule is **S&P DJI's**, so the mechanism is very unlikely to change — but S&P DJI's own methodology PDFs have `403`'d this runner twice, so the 497 is the calendar's ONLY fetchable primary for the second-Friday rule that five entries depend on. Rule text archived into this PR against that. **NEW MEASUREMENT — the reference→effective wedge, sized for the first time.** Caps are struck on this close's prices, the trade prints 5 sessions later, so drift resizes it by ≈`w·r·(1−w)`. Ten mega-cap/sector-ETF pairs, every quarter-end 2nd-Fri→3rd-Fri window 1999–2026, **n=944**: mean \|wedge\| **2.37%**, median **1.47%**, p90 **5.23%**. On the Dec-2026 sibling's concrete case (AMZN 24.36%→23.00%, priced trim 1.36pp) that moves the executed trade **20%** of priced size at the median, **32%** at the mean, **71%** at p90; a **−7.38%** wedge erases the trim entirely and occurs in **5.1%** of windows. **It died on its own controls, which is the finding:** December vs other quarterly legs MW **P=61.0%** (232 vs 712), signed **118/232** positive, and a placebo over all **59,765** overlapping 5-session windows on the same pairs is *wider* (2.49% / 1.53% / 5.58%). So the wedge is one ordinary week of dispersion — big relative to the trade, unremarkable relative to the tape, and not to be revived as an index-flow signature. **Adjacency sweep — peers:** none, `symbols: []`, no tracked-name print in the corridor. **Macro:** 3 tracked ids within 5 days and the shape is the INVERSE of the March sibling's "no macro print at all" — [`fomc-2027-12-08`](fomc-2027-12-08.md) (high, final SEP of 2027) at **T−2**, `ndx-annual-reconstitution-announcement-2027-12-10` after this very close, `vix-expiration-2027-12-15` at T+5. **Refusal registered:** the gap-+2 shape gets NO corridor rule — `fomc-expiration-proximity.mjs --fresh` re-run today prints raw **2.147 vs 1.862, P=0.0020** → era-ranked **P=0.3260** → modern-era-only **−0.080, P=0.5351** (sign reverses); caveat stated in leg 5 that it measures expiration gaps, not QQD gaps. **Volatility:** baseline row, no prior to diff; VIX 15.72 vs 14.53 on 09-04 — calm end of the 2026 range, uninformative at D-457. **Geopolitical:** nothing touching index-capping mechanics. **Event tape:** `trade-playbooks.md` + `multi-symbol-sweep.md` re-grepped for `rebalanc\|index effect\|select sector\|capping\|reconstitut\|closing auction` → **zero hits**. Size (~$1.10B/$391B) and the December volume premium (1.639×/1.789× vs 1.420×/1.377×, MW p=13.6%) explicitly INHERITED and not re-measured — a 2026 weight forecasts nothing about 2027. **One dated adjacency proposed as `estimate` in this PR:** `sp-select-sector-secondary-reweight-2027-12-31` (test 2027-12-30, effective after the 12-31 close), the quarter-end backstop the same 497 dates and the calendar tracks for four other quarters but not this one — it is the rule's own answer to the wedge. **Deliberately NOT proposed:** PEA No. 60's effectiveness date (dated and material, but a registration filing is not a market event — it belongs in a kill switch, and does) and any pro-forma release date (no primary evidence, per the March sibling). Registered **FT-…-1** (the first definitive SAI off acc. `0001193125-26-303372` still contains "second Friday" → the deletion was a draft artifact; score 2026-10-31) and **FT-…-2** (ten-pair mean \|wedge\| over 2026-12-11→2026-12-18 lands in 1.0%–3.5%, the band covering 23 of 27 historical December cycles; score 2026-12-28). | — (stance set: stand aside on all four horizons; the output is an expiring primary archived, the wedge sized and killed on its own placebo, and an FOMC-proximity corridor rule refused) | 2026-10-09 (low, ≥15d band: every 30d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint notes any
row past ~1,200 chars): it is a note to the next session, not an essay, and a stance *change* earns its
sentence in the Stance section with the row as its receipt. The adjacency sweep (peer prints · macro
surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in every row; a dated
adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-sp-rebalance-reference-close-2027-12-10.json`
(`status: "estimate"`) in the same PR — your own file, never another event's canonical one (#1717).
Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from memory —
after which this doc goes quiet.
