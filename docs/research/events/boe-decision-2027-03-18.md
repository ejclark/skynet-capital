# Bank of England MPC decision, Summary and minutes only — the round that votes the day the Fed publishes its SEP and misses the February CPI print by six days — boe-decision-2027-03-18

**Kind:** macro-print · **Date:** 2027-03-18 (estimate, EST: bankofengland.co.uk/monetary-policy/upcoming-mpc-dates, re-fetched direct 2026-09-10 (HTTP 200) — the 2027 panel is headed **"Provisional Dates"** and its 18 March row reads *"March MPC Summary and minutes"* with **no Monetary Policy Report**, against the same page's 2026 panel headed **"Confirmed Dates"**. Filed `estimate` on three counts: the Bank's own **provisional** label, this lane's no-self-confirm limit, and the standing gap that `market-events-data.ts`'s confirmed-prefix taxonomy has `FED:` and no slot for a non-Fed central bank) · **Impact:** medium
**Last assessed:** 2026-09-10
<!-- probe-ref: {"symbols":{},"vix":17.84,"daysBand":"medium:31+","adjacentIds":["boj-decision-2027-03-18","fomc-2027-03-17","japan-cpi-2027-03-19","jpx-market-closure-2027-03-22","opex-2027-03-19","russell-quarterly-ipo-review-effective-2027-03-22","sp-quarterly-rebalance-effective-2027-03-22","tic-monthly-2027-03-18","uk-labour-market-2027-03-16","vix-expiration-2027-03-17"],"screenStreak":0,"blocked":[{"url":"https://www.bankofengland.co.uk/news/2026/march/bank-rate-maintained-at-3-point-75-march-2026","status":"404","at":"2026-09-10"}]} -->

## At a glance

**TL;DR.** **This is the thinnest round the Bank of England runs, and this session can say exactly how
thin, from primaries.** No Monetary Policy Report — the Bank's own 2027 page, fetched today, gives 18
March *"MPC Summary and minutes"* and nothing else, and on the exact 2026 analogue (19 March 2026) the
announcement published **one document, no Report, no Agents' summary, no press conference**. Two
mechanics fall out of that, and both are new to this family. **First, the February CPI print misses
this meeting by six days.** ONS publishes *Consumer price inflation, UK: February 2027* on **2027-03-24
07:00 London** (release page fetched today, *"Provisional release date"*, *"not yet published"*), so the
Committee's freshest inflation reading is the **January print of 2027-02-17 — 29 days old**. That is a
**convention, not a coincidence**: the ONS's **two-stage weights update**, introduced from 2025, pushed
the February bulletin late into March, and the MPC-to-print gap has been **exactly six days three years
running** (2025-03-20 → 2025-03-26; 2026-03-19 → 2026-03-25; 2027-03-18 → 2027-03-24 provisional)
against **minus one day in 2024** under the old single-stage update. The 2026 minutes prove it in the
Bank's own words: *"Twelve-month UK CPI inflation had fallen to 3.0% in January."* **Second, the vote is
taken before the Fed announces, even though it publishes 18 hours after.** The MPC votes at a meeting
**ending the day before** its announcement — three BoE primaries fetched today agree — so this
Committee votes on **2027-03-17**, the day [`fomc-2027-03-17`](fomc-2027-03-17.md) publishes the **first
SEP of 2027** at 14:00 ET / **18:00 London**. A corridor scan that reads "BoE, 18 hours after the Fed"
is right about the *publication* and wrong about the *decision*. Third, the information set is
**asymmetric**: stalest possible inflation, **freshest possible labour** — the 2027-03-16 ONS labour
release (gov.uk, status *"Confirmed"*) lands **D-2**, and the 2026 analogue cites *"the three months to
January"* earnings and unemployment, exactly what a mid-March release carries. **No rate call is made
and no directional Bank Rate test is registered** — centralbank.watch's BoE page, re-fetched today,
still publishes rows only through **2026-12-17**, so there is no 2027 pricing to take a side against.
**None of it is ours to trade**: `symbols: []`, no UK instrument, no rates- or sterling-keyed playbook.
Date is **estimate**, and the Bank's own word for it is **provisional**.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — nothing here is ours to hold, and nothing will be at D-189 | High | `symbols: []`, no rates- or sterling-keyed playbook, and this calendar's tracked universe is AAPL/AMZN/AVGO/CRWV/GOOG/META/MRVL/MSFT — no UK listing, no gilt, no sterling leg. The one UK→US transmission this repo has ever measured is `uk-autumn-budget-2026-10-28`'s gilt-to-Treasury pipe, which opens on roughly the worst 1% of gilt days | A tracked name moving **>2%** in the **08:00–09:30 ET** window on **2027-03-18** attributable to the BoE — the "no price channel" premise is false and this doc is rebuilt |
| This week | **Bank the CPI-gap mechanic — the March MPC systematically votes without the February inflation print, and nobody had written that down** | Medium | Measured from four ONS bulletins and three BoE announcements fetched 2026-09-10: MPC **2025-03-20** → Feb CPI **2025-03-26** (6d); MPC **2026-03-19** → Feb CPI **2026-03-25** (6d); MPC **2027-03-18** → Feb CPI **2027-03-24** (6d, provisional); against **2024-03-21** MPC → **2024-03-20** CPI (**−1d**), before the ONS's two-stage weights update existed | **ONS publishing *Consumer price inflation, UK: February 2027* on or before 2027-03-18** (**FT-boe-decision-2027-03-18-1**) — the two-stage-weights March slot is not a convention, and the whole "blind round" framing collapses to an ordinary one |
| This month | **Read the corridor by decision date, not by announcement time — the BoE votes on Fed day** | Medium | Three BoE primaries fetched today title the document *"…meeting ending on <D-1>"*: 19 March 2025 → announced 20 March; 17 June 2026 → 18 June; 18 March 2026 → 19 March. Applied to **2027-03-18** the meeting ends **2027-03-17**, the day the Fed's first 2027 SEP publishes at **18:00 London**. The published minutes may discuss what the vote could not | The **2027-03-18** document titled with a **meeting end date other than 17 March 2027** (**FT-boe-decision-2027-03-18-3**) — the D-1 convention is not one, and the vote/publication split stops being a real distinction |
| This quarter | **Do not diarise 2027-03-18 as fixed. Carry it as the Bank's own "provisional" and re-check the calendar each pulse** | Medium | The 2027 panel is headed *"Provisional Dates"* where the 2026 panel is headed *"Confirmed Dates"* — a materially weaker label, and the honest reason `estimate` sits here on top of the taxonomy gap. Five of the Bank's eight 2027 rounds now sit on this calendar; **2027-07-29, 2027-09-16 and 2027-12-16 have neither a canonical file nor a proposal** | The Bank re-publishing its 2027 schedule with **18 March moved, or with a Monetary Policy Report attached to it** (**FT-boe-decision-2027-03-18-4**) — the header, the "leanest document set" framing and the other three tests void together |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit, hedge or size is keyed to 08:00 ET on 2027-03-18. A `medium`-tiered `estimate` event on a foreign central bank with `symbols: []` licenses nothing.
- **The honest headline is still an absence.** There is **no published market pricing for this meeting**; centralbank.watch's BoE page (re-fetched 2026-09-10, data as-of 2026-09-09) stops at **2026-12-17**. Any later session quoting a 2027 BoE probability must name its source and date.
- **The clock is 08:00 ET, not the usual 07:00.** 2027-03-18 sits in the two-week transatlantic DST gap — US EDT from **2027-03-14**, UK BST not until **2027-03-28** — so 12:00 London is **08:00 ET**, 30 minutes before the US 08:30 data window rather than 90.
- **Mechanic one to carry — the March MPC votes without the February CPI print.** Six days, three years running, because the ONS's two-stage weights update moved the February bulletin late into March. The same question generalises to every round: *which CPI print does this Committee actually have?*
- **Mechanic two to carry — an MPC meeting ends the day before it announces.** For this round that is **2027-03-17**, Fed-SEP day. The vote precedes the SEP; only the publication follows it.
- **The information set, stated plainly** — inflation: **January 2027**, published 2027-02-17, **29 days** stale. Labour: **three months to January 2027**, published **2027-03-16**, **2 days** old. Policy steps it can neither observe nor forecast on the record: **`uk-fuel-duty-rise-2027-03-01`** (17 days before, first visible in the March CPI print of 2027-04-21) and **`uk-electricity-vat-reversion-2027-04-01`** (14 days after).
- **Attribution reverts to the December rule — it does NOT invert as it does at 04-29.** Per [`fomc-2027-03-17`](fomc-2027-03-17.md)'s own fetched header the Fed's `March 16-17*` row carries the SEP asterisk, so here the **Fed** is the one arriving with a full projection round and the **BoE** the one with minutes only. It outranks the BoE for interpretive content **and** for price. At `boe-decision-2027-04-29` that ranking inverts; this is the round where it does not.
- **Anything at 08:00 ET on 2027-03-18 is running into quad witching.** [`opex-2027-03-19`](opex-2027-03-19.md) (**high**) is the next morning and [`vix-expiration-2027-03-17`](vix-expiration-2027-03-17.md) settled the day before; [`boj-decision-2027-03-18`](boj-decision-2027-03-18.md) lands the same day, hours earlier. Any UK attribution must clear all four first.
- **Watch (dated)** — **BoE 2026-09-17** · **UK Budget 2026-10-28** · **BoE 2026-12-17** (est) · **BoE MPR 2027-02-04** (est, proposed by two sibling lanes) · **UK CPI 2027-02-17** (this round's last inflation reading; the first 2027 weights update) · **UK fuel duty 2027-03-01** · **jobs 2027-03-05** (est) · **UK labour market 2027-03-16** (est; D-2) · **FOMC + first 2027 SEP 2027-03-17** · **this meeting 2027-03-18** (est) · **opex 2027-03-19** · **UK CPI 2027-03-24** (est; D+6, the print this round misses) · **VAT reversion 2027-04-01** · **BoE MPR 2027-04-29** (est).

## Initial research

### The question, plainly

This id reached the scanner as `never-assessed` with **no canonical file at all** — it existed only as
two sibling proposals, `proposals/boe-decision-2027-03-18.from-uk-cpi-2027-04-21.json` and
`.from-uk-labour-market-2027-01-19.json`, each filed 2026-09-09 by a lane that found it while
researching something else. Both proposed it for a **structural** reason and both explicitly declined
to take a rate view: the CPI lane called it *"the BOUNDARY that makes the April committee's information
set countable"*, the labour lane called it *"the round the first wholly post-Budget labour print
precedes by two days"*. Neither had researched the meeting itself.

So the question is: **at D-189, on a non-Report round nobody has priced, what can this ledger establish
that the two proposals and the four sibling BoE ledgers did not — and what must it refuse?**

**One-line verdict:** the refusal is the same as the April sibling's (no 2027 pricing exists, so **no
rate call and no directional Bank Rate test**), but the round turns out to have two **measurable
structural properties** nobody in this family had written down — the March MPC **systematically votes
without the February CPI print**, and an MPC **votes the day before it announces**, which here means it
votes on **Fed-SEP day**.

**Method:** sourced web research per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md). Both
proposals read in full first. Fetched direct 2026-09-10: the **BoE MPC announcement-dates page** (2026
confirmed + 2027 provisional panels); the BoE **March 2026**, **March 2025** and **June 2026** Monetary
Policy Summary-and-minutes pages; the **ONS February 2027 CPI release page**; the ONS **February 2026**,
**February 2025** and **February 2024** CPI bulletins; **centralbank.watch**'s BoE page; and Yahoo
`^VIX` via the chart API (**17.84** close 2026-09-10; prior close **16.46**). One fetch 404'd and is
recorded in `probe-ref.blocked`. Calendar arithmetic — weekday, DST boundaries, gaps — computed
locally and shown below. No price instruments run: `symbols: []`, no issuer, and `earnings-cycle.mjs` /
`intraday-edges.mjs` have no macro mode.

### Conviction legs, tested

1. **The payload is minutes only, and the 2026 analogue shows exactly how lean that is.** SUPPORTED,
   from two BoE primaries. The 2027 panel's 18 March row reads *"March MPC Summary and minutes"* with no
   Report; the 2026 panel's exact analogue reads the same for **Thursday 19 March**. Fetching the
   **March 2026** announcement itself, the page offers **one** document — *"Monetary Policy Summary and
   minutes of the Monetary Policy Committee meeting ending on 18 March 2026 (PDF 0.3MB)"* — and
   **no** Monetary Policy Report, Agents' summary, market notice or press conference. The Bank's four
   2027 Report rounds are **4 February, 29 April, 29 July and 4 November**; this is not one of them, and
   the annual QT/APF review belongs to the September round (per `boe-decision-2027-04-29`'s inherited
   reading of the 19 June 2026 APF notice). So the document set here is the Bank's **minimum**.

2. **The February CPI print misses this meeting by six days, and it is a convention rather than a
   coincidence.** SUPPORTED, and it is this session's headline contribution. The measurement:

   | Year | March MPC announcement | February CPI bulletin | Gap | ONS weights method |
   |---|---|---|---|---|
   | 2024 | **21 March 2024** | **20 March 2024** | **−1 day** (print **before**) | single annual update — *"In line with usual practice at the start of each year, the basket… have been updated"* |
   | 2025 | **20 March 2025** | **26 March 2025** | **+6 days** | *"The **second update** has been introduced, along with the usual basket update, in the February indices"* |
   | 2026 | **19 March 2026** | **25 March 2026** | **+6 days** | *"The second update has been introduced, along with the usual basket update, with the February indices"* |
   | **2027** | **18 March 2027** (prov.) | **24 March 2027** (prov.) | **+6 days** | two-stage, per the ONS's own 2026 statement of intent |

   Every cell is a fetched primary: the three BoE announcement pages, the three ONS bulletins, and the
   ONS release page for February 2027 (*"Provisional release date: 24 March 2027 7:00am"*, *"This
   release is not yet published"*). The **cause is identified, not merely correlated**: from 2025 the
   ONS splits its annual weights update into two stages — the first with the January indices, the
   second with the February indices alongside the annual basket update — and that pushed the February
   bulletin from the third week of March into the fourth. 2024, the last single-stage year, is the
   counter-case and it lands on the other side of the MPC. Registered as
   **FT-boe-decision-2027-03-18-1**.

3. **Therefore this Committee's freshest inflation reading is 29 days old, and the 2026 minutes say so
   in the Bank's own words.** SUPPORTED, and this is the leg that turns leg 2 from arithmetic into a
   fact about a committee. The last UK CPI publication before 2027-03-18 is
   [`uk-cpi-2027-02-17`](uk-cpi-2027-02-17.md), carrying **January 2027** data — **29 days** before the
   meeting, and no other UK CPI release sits between them on this calendar. The 2026 analogue confirms
   the consequence directly: the **19 March 2026** minutes state *"Twelve-month UK CPI inflation had
   fallen to 3.0% in January from 3.4% in December"* and *"Services consumer price inflation had been
   4.4% in January"* — **January**, because February did not exist yet. Registered as
   **FT-boe-decision-2027-03-18-2**, which is deliberately a claim about **the minutes' own citation**
   rather than about the release calendar, so it scores independently of FT-1.

4. **An MPC votes at a meeting ending the day before it announces — so this Committee votes on Fed-SEP
   day.** SUPPORTED, three BoE primaries, and it is the session's second transferable mechanic. The
   Bank titles the document by the meeting's **end** date, not the announcement date:

   | Announcement | Document's own "meeting ending on…" | Gap |
   |---|---|---|
   | 20 March 2025 | *"…meeting ending on 19 March 2025"* | 1 day |
   | 19 March 2026 | *"…meeting ending on 18 March 2026"* | 1 day |
   | 18 June 2026 | *"At its meeting ending on 17 June 2026, the Monetary Policy Committee (MPC) voted by a majority of 7–2…"* | 1 day |

   Applied to **2027-03-18**, the meeting ends **2027-03-17**. [`fomc-2027-03-17`](fomc-2027-03-17.md)
   announces at **14:00 ET**, which on that date is **18:00 London** — after a committee day has
   ordinarily closed. The precise claim is therefore narrow and testable: **the vote is taken on Fed
   day, and the SEP publishes at the end of it.** What the minutes then discuss is a separate question
   the minutes themselves will answer. Registered as **FT-boe-decision-2027-03-18-3**, written as a
   claim about the published title — the one part that is observable — rather than about what the
   Committee knew, which is not.

5. **The information set is asymmetric: stalest possible inflation, freshest possible labour.**
   SUPPORTED, and verified on the analogue. The labour side is the mirror image of legs 2–3. The ONS
   labour-market release sits at **2027-03-16 07:00 London / 03:00 ET** (gov.uk statistics-announcement
   register, fetched by the `uk-labour-market-2027-01-19` lane 2026-09-09, status *"Confirmed"*,
   announced 30 June 2026) — **D-2**. That it is genuinely *in* the set is not assumed: the **19 March
   2026** minutes cite *"annual growth in private sector regular Average Weekly Earnings in the three
   months to January had been 3.3%"* and *"The Labour Force Survey unemployment rate had been 5.2% in
   the three months to January, unchanged from December"* — the **three-months-to-January** window,
   which is exactly what a mid-March release carries. The proposing labour lane's headline claim, that
   the 2027-03-16 release is the first whose AWE window (**Nov 2026–Jan 2027**) is **wholly after the
   2026-10-28 Autumn Budget**, therefore lands **two days before this vote**. That lane's own honest
   limit is carried, not re-derived: UK employer-cost measures conventionally take effect the
   **following April**, so even that window may show nothing.

6. **Two dated UK price-level policy steps bracket this meeting, and it can neither observe nor forecast
   either.** SUPPORTED, mechanical, and it is what makes "blind" the right word rather than a flourish.
   [`uk-fuel-duty-rise-2027-03-01`](uk-fuel-duty-rise-2027-03-01.md) takes effect **17 days before** the
   vote, but ONS collects prices around the Tuesday nearest the 13th, so its first CPI observation is
   the **March** index published **2027-04-21** — a month after this meeting.
   [`uk-electricity-vat-reversion-2027-04-01`](uk-electricity-vat-reversion-2027-04-01.md) takes effect
   **14 days after** it. And with **no Monetary Policy Report**, this round publishes **no projection**
   in which to book either. The first document that forecasts the VAT step is the **2027-04-29** MPR
   (which per its own ledger books it with no observation of it); the first that observes it is the
   **2027-05-19** CPI print. This round sits in the gap and says nothing on the record about either —
   which is a reason to expect the *April* Report to carry the content, not this one.

7. **There is still no 2027 rate pricing, so no rate call is made and no directional test registered.**
   SUPPORTED, and re-verified today rather than inherited. `boe-decision-2027-04-29` named "re-check
   whether any curve source has extended to 2027" as its first pulse's task; done here at no extra cost.
   centralbank.watch's Bank of England page, fetched **2026-09-10** (its own data as-of **2026-09-09**),
   publishes exactly three rows — **2026-09-17** (3.77% implied, 90.9% no change), **2026-11-05**
   (3.91%, 58.5% higher) and **2026-12-17** (4.15%, 98.9% higher) — and **no 2027 row**. The December
   ledger's decomposition identity has nothing here to apply to. Bank Rate on the record is **3.75%**
   (the 18 June 2026 minutes, fetched today: *"voted by a majority of 7–2 to maintain Bank Rate at
   3.75%"*). Extrapolating a March 2027 distribution from a December 2026 cumulative probability would
   be worse than the aggregator error this calendar was seeded to avoid: not a wrong source but no
   source.

8. **Attribution reverts to the December rule here; the April round is the exception, not the pattern.**
   SUPPORTED, mechanical, and worth stating because a session reading the April ledger alone would
   carry the wrong rule into March. Ten tracked events sit within five days:
   [`uk-labour-market-2027-03-16`](uk-labour-market-2027-03-16.md) (proposed),
   [`fomc-2027-03-17`](fomc-2027-03-17.md) (**high**),
   [`vix-expiration-2027-03-17`](vix-expiration-2027-03-17.md),
   [`boj-decision-2027-03-18`](boj-decision-2027-03-18.md) (**medium**),
   [`tic-monthly-2027-03-18`](tic-monthly-2027-03-18.md),
   [`japan-cpi-2027-03-19`](japan-cpi-2027-03-19.md),
   [`opex-2027-03-19`](opex-2027-03-19.md) (**high**),
   [`jpx-market-closure-2027-03-22`](jpx-market-closure-2027-03-22.md),
   [`russell-quarterly-ipo-review-effective-2027-03-22`](russell-quarterly-ipo-review-effective-2027-03-22.md)
   and
   [`sp-quarterly-rebalance-effective-2027-03-22`](sp-quarterly-rebalance-effective-2027-03-22.md).
   `boe-decision-2027-04-29` inverted December's *"a projection round outranks a set of minutes"* rule
   on the specific ground that the Fed's **April 27-28** row carries **no SEP asterisk** while the BoE
   had a Report. **Here both halves flip.** The Fed's own calendar, as parsed verbatim in
   `fomc-2027-03-17`'s header, reads `March 16-17*` under the footnote *"\* Meeting associated with a
   Summary of Economic Projections"* — the **first SEP of 2027** — and the BoE arrives with minutes
   only. So the Fed outranks the BoE here for interpretive content **and** for price, which is
   December's rule unmodified. The practical consequence for the morning of 03-18 is stronger than
   usual: an 08:00 ET print lands **18 hours after a Fed SEP**, on the same day as a BoJ decision, and
   **the day before quad witching** — a UK attribution has to survive all three.

9. **Three corrections to the proposals, all mechanical.** SUPPORTED; writing the canonical file is the
   moment to make them, per the April sibling's precedent.
   - **`kind`: `rates` → `macro-print`.** Both proposals filed `rates`. On this calendar `rates` means
     bond-auction and rates-market plumbing — **all 118** entries carrying it are JGB/Bund auctions,
     liquidity-enhancement operations and SIFMA bond sessions, and **not one** is a central-bank
     decision. All five sibling decision entries (`boe-decision-2026-09-17`, `-2026-11-05`,
     `-2026-12-17`, `-2027-04-29`, `boj-decision-2027-03-18`) are `macro-print`.
   - **`impact`: `low` / `medium` → `medium`.** The two proposals disagreed. Resolved on the April
     sibling's stated argument: the `symbols: []` reasoning is right and is why the **call** is a
     stand-aside at **high** confidence, but it applies identically to all five siblings, every one of
     which is `medium`. At `low` this event screens every 30 days, at `medium` every 21 until D-31;
     tiering one class two ways buys no safety.
   - **Clock: `07:00 ET` → `08:00 ET`.** The labour proposal's title said 07:00 ET, the CPI proposal's
     said 08:00 ET, and the CPI proposal is right. 2027-03-18 falls in the **two-week transatlantic DST
     gap** — US EDT from **2027-03-14** (second Sunday), UK BST not until **2027-03-28** (last Sunday)
     — so London is GMT, New York is EDT, and 12:00 London is **08:00 ET**. Verified by computing the
     boundaries and the conversion locally rather than asserting the usual offset.

10. **No new dated adjacency was discovered, and nothing is proposed in this PR.** SUPPORTED by a
    negative result, stated rather than filled in. Every dated event in this corridor is already
    canonical or already proposed by a sibling: the D-2 labour release, the D+6 CPI print, the Fed, the
    BoJ, TIC, Japan CPI, opex, the JPX closure and the two 03-22 index effectives. The Bank's **eight**
    2027 rounds are now **five** covered — `2027-02-04` (two proposals), **this one**, `2027-04-29`
    (canonical), `2027-06-17` (two proposals), `2027-11-04` (one proposal) — and **three absent**:
    **2027-07-29, 2027-09-16 and 2027-12-16**, which have neither a canonical file nor a proposal. They
    are **noted, not proposed**, on the `uk-cpi-2027-04-21` lane's stated precedent — nothing on the
    calendar depends on them yet, and they were not discovered by this sweep but read off a page two
    sibling lanes had already fetched. The trigger that would motivate them is a lane making a claim
    about the second-half 2027 rounds; the Bank's page lists all eight verbatim when one does.

11. **No tracked symbol carries a sterling channel, and no play is proposed.** SUPPORTED, stated as a
    null claim. `symbols: []`. The house playbooks (S1/S2/E1/S3/S4 + G1,
    [`trade-playbooks.md`](../../plans/trade-playbooks.md)) are equity- and earnings-keyed; none is
    rates-keyed, let alone sterling-rates-keyed. The only measured UK→US transmission in this repo is
    the gilt-to-Treasury pipe quantified in
    [`uk-autumn-budget-2026-10-28`](uk-autumn-budget-2026-10-28.md), which opens on roughly the worst 1%
    of gilt days. The "Today" kill switch is written as a **measurable price test** rather than a
    restatement, because a null claim's failure mode is that a channel exists and is simply not
    instrumented here.

### What plays the conditions support (date estimate)

**None.** No entry, exit, hedge or size is keyed to 2027-03-18. Four rules:

- **Read-only, and read the minutes for the information set before the vote.** The document set is one
  PDF. The first thing to check is **which CPI month the minutes cite** — this session's FT-2 — because
  it determines how everything else in the document should be read.
- **Search order when it lands** — (1) the **latest CPI month cited** (expected: January 2027); (2) the
  **meeting end date in the title** (expected: 17 March 2027); (3) whether the **three-months-to-January
  AWE** figure from the D-2 release appears, and whether the minutes attribute anything in it to the
  2026-10-28 Budget; (4) whether the **2027-04-01 VAT reversion** or the **2027-03-01 fuel duty rise**
  is mentioned at all, given the round publishes no projection to book either in; (5) the **vote split**
  against whatever the meetings between now and then produce, never against June 2026's 7–2, which
  several meetings will have re-based.
- **The anti-attribution rule, unmodified from December's.** Any read of the 03-18 tape that has not
  first accounted for **`fomc-2027-03-17` and the first 2027 SEP 18 hours earlier**,
  **`boj-decision-2027-03-18`** the same day and **`opex-2027-03-19`** the next morning is not entitled
  to its attribution. This is the round where the Fed outranks the BoE on both axes.
- **The branch to pre-decide** — if a 2027 rate strip becomes fetchable before this meeting, leg 7's
  refusal expires and this ledger **should** register a rate-direction test at that pulse, saying so in
  the row. Until then the refusal is the position.

### Honest limits

**The CPI-gap mechanic rests on three years, and one of them is provisional.** Leg 2 — this session's
headline — has **two** settled observations (2025, 2026) at exactly six days, a **third** that is the
ONS's own provisional date, and **one** counter-case (2024) whose difference is explained rather than
merely noted. Three points with an identified cause is stronger than the April sibling's two-point
conditioning-window regularity, but it is still a convention by assumption, and the ONS can move a
provisional date. **FT-1 is written a shade wider than the measured six days** (any publication date
strictly after the meeting) so that a pass is informative about the *ordering* rather than about a
specific gap. It is also **falsifiable early and cheaply**: the ONS release page is one fetch at any
pulse.

Four further limits. **Nothing here prices the meeting**, by construction (leg 7) — a reader wanting a
rate view will not find one, and that is the state of the sources, not an omission. **Leg 4's claim is
about a published title, not about a committee's knowledge**: that the minutes are titled *"meeting
ending on 17 March 2027"* is observable; whether the Committee reconvened on announcement morning, or
what it made of an 18:00 London SEP, is not, and the test is scoped to the observable half on purpose.
**The labour-market evidence is partly inherited** — the gov.uk *"Confirmed"* status and the 16 March
2027 07:00 timing come from the `uk-labour-market-2027-01-19` lane's 2026-09-09 fetch, not this
session's, as does the Budget-effect caveat; what this session added is the 2026 analogue proving the
window actually reaches the minutes. **One fetch 404'd** (the BoE's March 2026 news-release URL
constructed by pattern) and is in `probe-ref.blocked`; it did not matter, because the
summary-and-minutes page served the same publication set from a better source. Finally, **a clock
discrepancy in the sibling record is noted rather than silently harmonised**: `boe-decision-2027-04-29`
records VIX **16.19** as the 2026-09-09 close; the Yahoo chart API fetched today returns **16.46** for
that session and **17.84** for 2026-09-10. This ledger records its own reading and its own source.

## Stance & kill switches

**Stance (date `estimate`, and provisional in the Bank's own words):** **stand aside completely, make
no rate call, and bank two mechanics.** This book holds nothing with a sterling-rates channel and none
is proposed; the ledger's positions are **analytical**, and the first is a **refusal** inherited and
re-verified rather than assumed — centralbank.watch publishes no 2027 BoE rows (re-fetched 2026-09-10,
data as-of 2026-09-09), so **no directional Bank Rate test is registered**.

What this session adds to the family is two measured regularities and one characterisation. **First,
the March MPC systematically votes without the February CPI print.** The ONS's two-stage weights
update, introduced from 2025, moved the February bulletin late into March, and the MPC-to-print gap has
been **exactly six days three years running** — 2025-03-20 → 2025-03-26, 2026-03-19 → 2026-03-25,
2027-03-18 → 2027-03-24 (provisional) — against **−1 day in 2024** under the old single-stage update.
The consequence is confirmed in the Bank's own words on the 2026 analogue: *"Twelve-month UK CPI
inflation had fallen to 3.0% in January."* **Second, an MPC votes at a meeting ending the day before it
announces** — three BoE primaries agree — so this Committee votes on **2027-03-17**, the day the Fed
publishes the **first SEP of 2027** at 14:00 ET / **18:00 London**. A corridor scan reading "BoE, 18
hours after the Fed" is right about the publication and wrong about the decision. **Third, the
resulting information set is asymmetric**: the stalest possible inflation reading (**January**, 29 days
old) beside the freshest possible labour reading (**three months to January**, published **D-2**), with
two dated UK price-level policy steps — fuel duty **2027-03-01**, electricity VAT **2027-04-01** —
bracketing a round that has **no projection in which to book either**.

Two further commitments. **Attribution reverts to December's rule here**: the Fed's `March 16-17*` row
carries the SEP asterisk and the BoE arrives with minutes only, so the Fed outranks it for interpretive
content **and** for price — `boe-decision-2027-04-29`'s inversion is the exception, not the pattern, and
a session must not carry it backwards into March. And **three corrections were made writing the
canonical file**: `kind` `rates` → `macro-print` (all 118 `rates` entries are bond plumbing; every
central-bank decision here is `macro-print`), `impact` → `medium` (the two proposals disagreed; every
sibling decision entry is medium), and the clock → **08:00 ET** (the two-week transatlantic DST gap,
US EDT from 2027-03-14, UK BST from 2027-03-28).

Every horizon call is graded **medium** except the stand-aside, which is **high**, for one stated
reason: the mechanics rest on three and three observations respectively, and the date underneath them
is the Bank's own **provisional**. Estimates widen caution and license nothing.

**Kill switches:**

- **Channel kill (the one that would rebuild this doc):** a tracked name (AAPL/AMZN/AVGO/CRWV/GOOG/
  META/MRVL/MSFT) moving **>2%** in the **08:00–09:30 ET** window on **2027-03-18** in a way the tape
  attributes to the BoE. Leg 11's "no price channel" claim would be false. Score by **2027-03-19**.
- **CPI-gap kill (registered):** ONS publishing *Consumer price inflation, UK: February 2027* **on or
  before 2027-03-18**. The two-stage-weights March slot is not a convention and legs 2, 3 and 5's
  asymmetry all collapse together. Registered as **FT-boe-decision-2027-03-18-1**, score by
  **2027-03-25**. **Falsifiable early and cheaply** — one fetch of the ONS release page at any pulse.
- **Information-set kill (registered):** the **2027-03-18 minutes** citing a **February 2027** UK CPI
  12-month rate. The "29-day-stale inflation picture" characterisation is wrong, whatever the release
  calendar did. Registered as **FT-boe-decision-2027-03-18-2**, score by **2027-03-19**.
- **Vote-date kill (registered):** the **2027-03-18** document titled with a meeting end date **other
  than 17 March 2027**. The D-1 convention is not one, and the vote-precedes-the-SEP distinction stops
  being real. Registered as **FT-boe-decision-2027-03-18-3**, score by **2027-03-19**. Also falsifiable
  early: any pulse that fetches two more announcements settles the convention years ahead.
- **Date / payload kill (registered):** the Bank re-publishing its 2027 schedule with **18 March moved,
  or with a Monetary Policy Report attached**. The header and the "leanest document set" framing break
  together, and the other three tests void rather than fail. Registered as
  **FT-boe-decision-2027-03-18-4**, score by **2027-03-19**; re-check the Bank's calendar every pulse.
  This is deliberately **its own row** rather than a read of
  **FT-boe-decision-2027-04-29-2**: that test scores 29 April only, and a schedule change touching just
  18 March would leave it passing with nothing said about this round.
- **Attribution kill:** the **2027-03-17 FOMC** losing its SEP (the Fed's calendar states each 2027 date
  is *"tentative until confirmed at the meeting immediately preceding it"*, so the trigger is the
  **2027-01-26/27** meeting). Leg 8's "December's rule, unmodified" would need re-deriving, and the
  interpretive ranking could invert as it does at 04-29. Re-check at the first pulse after
  **2027-01-27**.
- **Method-availability branch (not a kill, a scope change):** a **fetchable 2027 BoE rate strip** —
  centralbank.watch extending its table, or a second curve source. Leg 7's refusal expires and this
  ledger **should** register a rate-direction test at that pulse. Record it as a scope change in the
  row, not a stance reversal. Re-check every pulse.
- **Budget-effect kill (inherited, not registered):** the **2027-03-16** labour release showing no
  detectable Budget effect in the Nov-2026–Jan-2027 AWE window. That is the proposing labour lane's own
  caveat — UK employer-cost measures conventionally bite the **following April** — and it is carried,
  not re-registered here. Reading a sibling's result is not owning it.

Four forward tests registered in
[`forward-tests/boe-decision-2027-03-18.md`](../forward-tests/boe-decision-2027-03-18.md) — **-1** (the
February 2027 CPI print publishes after this meeting), **-2** (the minutes' latest CPI month is
January), **-3** (the document is titled *"meeting ending on 17 March 2027"*) and **-4** (the date and
the minutes-only payload both survive). **No rate-direction test is registered, deliberately** — there
is no published 2027 pricing to take a side against, and no house instrument that would price one.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-10 | D-189 | Initial research banked (above) on an id that existed only as **two** sibling proposals (`from-uk-cpi-2027-04-21`, `from-uk-labour-market-2027-01-19`) — both read in full first, then the canonical `src/domain/market-events/boe-decision-2027-03-18.json` written in this PR **with three mechanical corrections**: `kind` **`rates` → `macro-print`** (all **118** `rates` entries on this calendar are bond auctions / liquidity operations / SIFMA sessions — **zero** central-bank decisions; all five sibling decision entries are `macro-print`), `impact` **`low`/`medium` → `medium`** (the proposals disagreed; resolved on `boe-decision-2027-04-29`'s stated argument that the `symbols: []` reasoning belongs in the **call**, not the tier), and the clock **`07:00 ET` → `08:00 ET`** (2027-03-18 sits in the two-week transatlantic DST gap — US EDT from 2027-03-14, UK BST from 2027-03-28 — so 12:00 London is 08:00 ET; the CPI proposal was right, the labour proposal wrong). **Two new mechanics, both from primaries fetched today.** (i) **The March MPC systematically votes without the February CPI print.** Measured: MPC **2025-03-20** → Feb CPI **2025-03-26** (**+6d**); MPC **2026-03-19** → Feb CPI **2026-03-25** (**+6d**); MPC **2027-03-18** → Feb CPI **2027-03-24** (**+6d**, ONS release page fetched today, *"Provisional release date: 24 March 2027 7:00am"*, *"not yet published"*); against **2024-03-21** MPC → **2024-03-20** CPI (**−1d**). The **cause is identified**: from 2025 the ONS splits its annual weights update in two — *"The second update has been introduced, along with the usual basket update, in the February indices"* (Feb 2025 and Feb 2026 bulletins, both fetched) — which pushed the February bulletin from the third into the fourth week of March; 2024, the last single-stage year, sits on the other side. **Confirmed in the Bank's own words on the 2026 analogue:** the 19 March 2026 minutes read *"Twelve-month UK CPI inflation had fallen to 3.0% in January from 3.4% in December"*. So this Committee's freshest inflation reading is the **January print of 2027-02-17 — 29 days old**. (ii) **An MPC votes at a meeting ending the day before it announces** — three BoE primaries fetched today: *"…meeting ending on 19 March 2025"* (announced 20 Mar), *"…meeting ending on 18 March 2026"* (announced 19 Mar), *"At its meeting ending on 17 June 2026, the MPC voted by a majority of 7–2 to maintain Bank Rate at 3.75%"* (announced 18 Jun). Applied here the meeting ends **2027-03-17**, the day `fomc-2027-03-17` publishes the **first SEP of 2027** at 14:00 ET / **18:00 London** — so the **vote precedes the SEP and only the publication follows it**, and a corridor scan reading "BoE, 18 hours after the Fed" is right about one and wrong about the other. (iii) **The payload is the Bank's minimum**: the 2027 panel gives 18 March *"MPC Summary and minutes"* with no Report, and the 2026 analogue's announcement page offers **one** PDF — no Report, no Agents' summary, no press conference. (iv) **Asymmetric information set**: stalest inflation (January, **29d**) beside freshest labour (**three months to January**, published **D-2** on 2027-03-16, gov.uk *"Confirmed"*) — verified on the analogue, whose minutes cite *"the three months to January"* for both AWE (**3.3%**) and LFS unemployment (**5.2%**). Two dated UK price-level steps bracket it with **no projection to book either in**: `uk-fuel-duty-rise-2027-03-01` (**D-17**, first observed in the 2027-04-21 CPI) and `uk-electricity-vat-reversion-2027-04-01` (**D+14**). Adjacency sweep: **peers** — none, `symbols: []`. **Macro** — the run-in is the **D-2 labour release** and nothing else; the February CPI print is **D+6**. **Volatility** — VIX **17.84** close 2026-09-10 (Yahoo `^VIX` chart API), prior close **16.46**; noted honestly, the 04-29 sibling records **16.19** for the 09-09 session and this ledger records its own fetch rather than harmonising. **Geopolitical/policy** — the live vectors are other lanes' (the VAT reversion's survival, the fuel-duty step size); neither is re-registered here. **Event tape — attribution REVERTS to December's rule and does NOT invert as it does at 04-29.** Ten tracked events within five days (labour 03-16 · **FOMC 03-17, high** · VIX expiry 03-17 · **BoJ 03-18** · TIC 03-18 · Japan CPI 03-19 · **opex 03-19, high** · JPX closure 03-22 · Russell IPO review 03-22 · S&P rebalance 03-22): per `fomc-2027-03-17`'s own fetched header the Fed's row reads **`March 16-17*`** under *"\* Meeting associated with a Summary of Economic Projections"*, so **the Fed has the forecast round and the BoE has minutes** — the exact inverse of the 04-29 cluster, and the Fed outranks it on **both** axes. **No pricing, still:** centralbank.watch's BoE page re-fetched today (data as-of 2026-09-09) publishes rows only through **2026-12-17** — 2026-09-17 3.77%/90.9% no-change, 2026-11-05 3.91%/58.5% higher, 2026-12-17 4.15%/98.9% higher — **no 2027 row**, so **no rate call and no directional Bank Rate test**; this discharges the 04-29 sibling's named first-pulse task. Bank Rate on the record: **3.75%**. **NOTHING PROPOSED, stated as a negative result:** every dated event in this corridor is already canonical or already proposed by a sibling. The Bank's **eight** 2027 rounds are now **five** covered (02-04 ×2 proposals, this one, 04-29 canonical, 06-17 ×2, 11-04 ×1) and **three absent** — **2027-07-29, 2027-09-16, 2027-12-16** — **noted, not proposed**, on the uk-cpi lane's precedent: nothing on the calendar depends on them yet and they were not discovered by this sweep. **Named weakness, up front:** the CPI-gap mechanic has **two settled years plus one provisional date** and an explained counter-case, so FT-1 is written wider than the measured six days; leg 4's test is scoped to the **published title**, not to what the Committee knew; the labour timing and the Budget-effect caveat are **inherited** from the `uk-labour-market-2027-01-19` lane. One fetch **404'd** (a pattern-constructed BoE news-release URL) and is in `blocked`; it did not matter, the summary-and-minutes page being the better source. | — (stance set: stand aside, no position, no play; and one **refusal carried and re-verified** — **no rate call, no directional Bank Rate test**, because no 2027 pricing exists. Four analytical commitments: the **six-day March CPI gap** and its cause; the **D-1 meeting-end convention**, which puts this vote on Fed-SEP day; the **asymmetric information set** — 29-day-old inflation, two-day-old labour; and **December's attribution rule unmodified**, the Fed outranking the BoE on both axes here) | 2026-10-01 (medium, 31+d band: every 21d — lands at D-168, still deep inside the same band; that pulse's tasks are to re-fetch the **ONS February 2027 release page** (FT-1 is settleable early) and the **Bank's 2027 calendar** (FT-4), and to re-check whether any curve source has extended to 2027) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-boe-decision-2027-03-18.json` (`status: "estimate"`)
in the same PR — your own file, never another event's canonical one (#1717). Close-out fills
`## Outcome` below from re-run instrument data (cache busted first), never from memory — after
which this doc goes quiet.
