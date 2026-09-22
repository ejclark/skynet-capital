# Bank of Japan Monetary Policy Meeting decision (MPM Sep 17-18) — boj-decision-2026-09-18

**Kind:** macro-print · **Date:** 2026-09-18 (estimate, NEWS: boj.or.jp "Monetary Policy Meetings" schedule page (en/mopo/mpmsche_minu/), re-read direct 2026-09-05 — the September row reads "Sept. 17 (Thurs.), 18 (Fri.)"; filed estimate because the confirmed-prefix taxonomy has `FED:` and no slot for any other central bank, not because the date is doubted) · **Impact:** medium
**Last assessed:** 2026-09-19
<!-- probe-ref: {"symbols":{},"vix":14.81,"daysBand":"closed","adjacentIds":["boe-decision-2026-09-17","bowman-stress-testing-2026-09-18","fomc-2026-09-16","house-vote-ratepayer-protection-act-2026-09-17","industrial-production-2026-09-18","japan-cpi-2026-09-18","meta-connect-2026-09-23","opex-2026-09-18","treasury-2y-note-2026-09-22","uk-retail-sales-2026-09-18"],"adjacentStrongIds":["fomc-2026-09-16","opex-2026-09-18"],"screenStreak":0} -->

## At a glance

**TL;DR.** **Stand aside — and at D-3 the one thing that made this entry different from the ECB's is
gone: the tail collapsed.** Initial research (09-05) built every leg on a *live* **~16–20% no-hike
tail** against the ECB's 1.1%, and flagged the press-aggregated 80/84/99% dispersion as its own
load-bearing weakness. That dispersion is now resolved from a direct fetch, and it resolved to the
top: Polymarket's per-meeting September book prices **hike-25 at 98.25%** and **no change at 1.05%**
on an **$830.6k** event (pulled 2026-09-15 16:39Z). This is the ECB's setup after all — **dead
information**, not a two-sided event. The method finding that gets there is reusable across all
twelve BoJ entries on this calendar: a futures-derived read of **61%** (centralbank.watch, "data as
of September 14") is not a disagreement but an **artifact**, because Japan lists 3-month futures
while the BoJ meets roughly twice a quarter, so one price is split across two meetings by
assumption; a per-meeting venue book has no such confound. Everything else moved the same way —
Q2 GDP revised **+1.1% → +1.4%** annualised (09-07), July wages up the most in ~30 years, and
Bessent doubling down on 09-01 (*"I have information that the market doesn't have"*). The **politics
kill did not fire; it reversed.** Two live complications the initial research did not have: Japan's
national **August CPI prints 2026-09-18, hours before the decision** (this ledger's own data-kill
trigger, proposed to the calendar in this PR), and the **Fed hikes 09-16 at ~86–91%** — two 25bp
hikes 36 hours apart leave the differential roughly where it started, which is a mechanical argument
*for* FT-1's yen null. Date is **estimate**; it widens caution and licenses nothing.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — nothing here is ours to hold | High | `symbols: []`, no house playbook is rates- or FX-keyed, and at D-3 there is no position this event could be sized into | A tracked name (NVDA/AVGO/MRVL/CRWV) moving **>2%** on any session **2026-09-05 → 2026-09-17** that the tape attributes to a BoJ headline — the "no price channel" premise would be wrong and this doc is rebuilt. *Status 09-15: magnitude met many times over (09-14 alone: NVDA **−3.36%**, AVGO **−4.77%**, MRVL **−7.32%**, CRWV **−6.75%**), attribution met zero times — that tape is the hot 09-11 CPI and the Fed repricing, not Tokyo* |
| This week | **Stand aside; the week's fork is the FOMC on 09-16, not Japan** | High | The BoJ prints 36 hours after a Fed decision priced at ~86–91% hike, into the same corridor; nothing in the 09-15 → 09-18 US tape is BoJ-keyed first | September hike odds on a **per-meeting venue book** falling **below ~50%** before 09-18 — at **98.25%** this now needs a 48-point collapse, so the realistic kill is the **09-18 08:30 JST CPI** printing far enough off to reopen the decision |
| This month | **Do not read the 2026-09-18 US open as the BoJ's verdict until the opex leg is checked** | High | The decision lands overnight ET and hits the tape at the open, where SPX index options AM-settle via SET on a **$6.2T** witching (Citadel GMI, 08-31) inside the 9/12→9/18 corridor — perfectly confounded with any BoJ effect, and now with a Fed hike two days stale | **USD/JPY moving more than ±2.0%** from its **2026-09-17** close to its **2026-09-18** close — the yen leg would be live, a carry unwind mechanically possible, and the confound resolves toward Japan (registered as **FT-boj-decision-2026-09-18-1**) |
| This quarter | **Never size a US position to a non-Fed central bank on this calendar** | High | Japanese policy reaches this book only second-order (yen funding, global term premium), and both channels are already owned by [`fomc-2026-09-16`](fomc-2026-09-16.md); neither is instrumented here | The policy rate standing **above 1.25%** at the **2026-10-30** decision — back-to-back hikes mean a faster cycle than this doc assumes and the yen leg earns a real weight (registered as **FT-boj-decision-2026-09-18-2**; the October venue book prices **no change at 88.0%**, so the market now sides with the test) |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit or hedge is keyed to the 2026-09-18 decision or to the 09-18 open.
- **The 09-15 change, stated plainly** — the hike is no longer "likely but not settled." At **98.25%** on a per-meeting venue book it is **priced**, and the event's information content has moved entirely to the **statement, the vote split and the pace guide**.
- **How to read a BoJ probability on this calendar (reusable)** — prefer a **per-meeting** venue book over any futures-derived number. Japan lists 3-month futures against a roughly twice-a-quarter meeting grid, so a futures-derived split between September and October is an assumption, not a price. Registered as **FT-boj-decision-2026-09-18-3**.
- **The correction that mattered most** — the policy rate is **1.0%**, not 0.75%. Anything downstream that assumed 0.75% was reasoning one hike behind the tape.
- **The reason this is not August 2024, now stronger** — the US Treasury publicly *asked* for the hike and joined the intervention, and Bessent repeated it on **09-01**. The intervention was also **bigger than this ledger first recorded**: **¥15.39–15.4tn (~$96bn) between 07-30 and 08-26**, the largest on record, not ~$59B in one session (NEWS:, MoF announcement 08-28; Japan's FX reserves fell a record **~$80bn** in August).
- **The two numbers to read on the day** — (1) the **vote split**: Takata already dissented for 1.25% in July, so a 1.25% hike carried 9-0 or 8-1 says something different from one carried 5-4; (2) whether the statement repeats the Outlook's "**clearly above 2 percent** from the second half of fiscal 2026."
- **The attribution rule (this entry's practical job), now three-way** — before crediting the BoJ with anything in the 2026-09-18 US session, check the yen first (FT-1's ±2.0% test), the SET/opex leg second, and the **09-16 Fed hike** third. On a record witching two days after an FOMC, Tokyo is the *last* explanation to reach for, not the first.
- **The one genuinely novel finding, and it runs the wrong way** — the BoJ's own July Outlook names "the increase in global AI-related demand" as a driver of Japanese prices. That is a real link between this book's names and the BoJ's reaction function, but the causality is AI demand → Japanese inflation → BoJ hikes. It is a feedback loop to note, not a trade to take.
- **Watch (dated)** — **FOMC 09-16** · 10Y TIPS + UNSC Iran vote + **BoE decision 09-17** · **Japan national August CPI 09-18, 08:30 JST** (est, proposed in this PR), hours ahead of · **this decision 09-18** (est), overnight ET, on **triple-witching 09-18** · Summary of Opinions **2026-10-01** (est, resolved this pulse; already on the calendar) · next BoJ MPM **2026-10-29/30** (est), FT-2's scoring venue.

## Initial research

### The question, plainly

This is the **second non-Fed central bank this calendar tracks**, and like the ECB entry it was
added on placement — discovered 2026-09-05 during the [`fomc-2026-09-16`](fomc-2026-09-16.md)
adjacency sweep. But it is not the ECB's question. The ECB's hike was 98.9% priced and therefore
dead information; this one is **80–84% priced with a live tail**, and it carries a transmission
mechanism — the yen carry trade — that has an actual, violent precedent in August 2024 involving
exactly this book's kind of names. So the question is: **is the carry channel live enough to
matter to a US AI-equity book on 2026-09-18, and if not, what is this entry for?**

**One-line verdict:** the hike is probable but not certain, and the carry-unwind story that would
make it dangerous is **contradicted by this year's own tape and by the politics** — the US Treasury
publicly asked for the hike, a joint intervention already did the yen's repricing in July, and
June's 30-year-high hike moved the Nikkei less than half a percent; what is left is an
**attribution problem**, because the decision reaches the US tape at the open of a record
triple-witching and will otherwise be handed credit for it.

**Method:** sourced web research per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md).
Primaries fetched and parsed directly today (2026-09-05): the BoJ's **31 July 2026 Statement on
Monetary Policy** (PDF, text-extracted — the source of the rate correction), the **July 2026
Outlook for Economic Activity and Prices** (PDF, text-extracted), the BoJ's **Monetary Policy
Meetings schedule** page, the **US Treasury readout sb0619** of the Bessent–Ueda meeting, and the
**Japanese MoF's Katayama statement** confirming the joint intervention. Market pricing, CPI
prints, FX levels and the June/July decision-day tape are **press-cited at their as-of dates** —
`rateprobability.com` and every CNBC URL returned **HTTP 403** to WebFetch, and the Japan Times
returned **402**, so no futures/OIS strip was fetched directly. No price instruments run:
`symbols: []`, no issuer, and `earnings-cycle.mjs`/`intraday-edges.mjs` have no macro mode.

### Conviction legs, tested

1. **The calendar's own policy-rate figure was wrong by one hike — this is the correction.**
   REFUTED (the prior claim), replaced by primary. The event entry's `source` read "Policy rate
   0.75%, its highest since 1995." The BoJ's **31 July 2026 Statement on Monetary Policy**, fetched
   and text-extracted today, reads verbatim: *"The Bank will encourage the uncollateralized
   overnight call rate to remain at around 1.0 percent,"* decided *"by an 8-1 majority vote."* The
   dissent is the informative part and it is hawkish: *"Voting against the action: TAKATA
   Hajime… He proposed that the Bank set the guideline… to remain at around 1.25 percent."* The
   0.75% figure is the **December 2025** level, superseded by a **June 2026** hike to 1.0% — "the
   highest in over 30 years," on a 7-1 vote with Asada dissenting for a hold and Ueda absent
   (press-cited, CNBC 2026-06-16 via search snapshot; the URL itself 403s). This PR corrects the
   JSON. Anything reasoning from 0.75% was reasoning one hike behind the tape.

2. **The hike to 1.25% is likely but NOT priced to the ECB's certainty — the tail is real.**
   SUPPORTED, and it is the reason this entry is not a copy of the ECB one. Bloomberg reported
   **2026-09-03** that the BoJ *"is leaning toward raising its benchmark interest rate by a quarter
   point in the two-day meeting ending on September 18,"* while remaining *"flexible on future
   path."* Ueda, at the **G20 in Asheville on 09-01**, said *"We'll fully discuss (a rate increase)
   at every policy meeting, including the next one,"* and that underlying inflation is *"quite
   close"* to target; on **09-02** he said officials will decide *"with upside price risks in
   mind"* and that *"as the underlying inflation rate approaches 2%, we have come to believe that
   we need to pay greater attention than before to upside risks."* On pricing the sources
   **disagree and the dispersion is recorded rather than resolved**: OIS-implied September odds are
   cited at **~80%** and, more recently, **~84%** (with ~96.5bp of cumulative 12-month tightening);
   a separate aggregator claim puts it at **~99%**; Polymarket reportedly moved from **~21% to
   ~84%** after the July inflation data. Take even the top of the OIS range and **~16% of the
   distribution is a hold** — an order of magnitude more surprise capacity than the ECB's 1.1%.

3. **The hawkish case is entirely forward-looking; the realised data is still below target.**
   SUPPORTED, and it is the sharpest tension in this event. Japan's **national core CPI (ex fresh
   food) was 1.8% y/y in July 2026** — *below* the 2% target for a **sixth consecutive month**;
   headline was 1.9%, and core-core (ex fresh food and energy) 1.9%. August's Tokyo core was 1.8%
   with core-core easing to 1.9% from 2.0% (press-cited). The July **Outlook Report** (fetched,
   verbatim) is what carries the hawkish weight instead: core CPI *"is likely to accelerate to a
   level clearly above 2 percent from the second half of fiscal 2026,"* driven by pass-through of
   wage increases, *"the rise in crude oil prices to date,"* *"the rise in the prices of
   semiconductors and other items, reflecting the increase in global AI-related demand,"* and
   *"the recent depreciation of the yen."* On risk balance it is explicit: *"Regarding the outlook
   for the CPI, risks are skewed to the upside… there is a risk that it will deviate upward to a
   level above the price stability target of 2 percent."* So the BoJ is hiking on a **projection
   and a currency**, not on a print. That is a legitimate central-bank posture and also a genuine
   source of hold risk if the board wants one more month of data.

4. **The US Treasury is publicly lobbying for this hike — which is what makes it unlike August
   2024.** SUPPORTED, primary, and it is this ledger's load-bearing argument. Treasury's own
   readout **sb0619** (dated **2026-08-30**, fetched today) of the Bessent–Ueda bilateral states
   verbatim: *"Secretary Bessent also expressed strong support for Japan's decisive market and
   monetary steps to address the substantial undervaluation of the yen and noted the role of yen
   weakness in contributing to domestic inflationary pressures in Japan,"* alongside *"the
   importance of sound formulation and communication of monetary policy to anchor inflation
   expectations and avoid excess exchange rate volatility."* Press coverage reads it the same way —
   *"cementing the case for a Japanese rate hike this month."* The 2024 unwind was a **hawkish
   surprise landing into a US growth scare**; a 2026 hike that the US Treasury asked for in a
   published readout is the opposite setup. This does not make the hike harmless, but it removes
   the specific ingredient — an unwelcome, unanticipated tightening — that the carry-unwind
   analogy depends on.

5. **The yen's big 2026 repricing already happened, and policy did not cause it.** SUPPORTED,
   primary. Japan's Minister of Finance **Katayama Satsuki** stated (**2026-08-03**, mof.go.jp,
   fetched verbatim): *"On Friday 31st, July (U.S. Eastern Time), Japan's Ministry of Finance
   purchased the Japanese yen in coordination with the U.S. Department of the Treasury… pursuant to
   the U.S.-Japan Finance Ministers' Joint Statement issued in September 2025… We will not hesitate
   to conduct further joint intervention,"* adding that Japan *"plans to utilize the Federal
   Reserve's Foreign and International Monetary Authorities (FIMA) Repo Facility in the future."*
   Press puts the size at roughly **$59B sold on 07-30**, with USD/JPY at a **40-year low of
   163.73** before it and **157.57** after — a ~6-figure move in two sessions. USD/JPY was
   **156.23 on 2026-09-04** and the 10Y JGB **2.91%**, off its highest-since-1996 level near 3.00%.
   So the yen has already round-tripped most of its stress **on intervention and hike
   anticipation**, not on the decision that has not happened yet. A carry unwind needs a *surprise*
   yen surge; a lot of that move has been pre-spent.

6. **The carry channel has been tested twice in 2026 and reached nothing.** SUPPORTED, press-cited.
   The **June 2026** hike took the policy rate to **1.0%, the highest since 1995** — a genuinely
   landmark decision — and the tape's response was: **Nikkei 225 +0.46%**, USD/JPY **160.22** (a
   marginal yen *strengthening*), JGB yields up. One account puts it plainly: the yen *"barely
   flinched"* and went *"almost nowhere,"* because *"the outcome matched expectations almost
   exactly."* The **July 31** hold was a non-event by construction. Against that, the 2024 analogy
   is real but dated: the yen surged ~12% in a month, the **Nikkei fell ~20% between 2024-07-31 and
   2024-08-05**, and the most violent unwinds hit **US momentum stocks** — i.e. this book's
   neighbourhood. The honest reconciliation is that 2024's unwind required a *surprise* hike, a
   crowded position, and a coincident US growth scare; **2026 has supplied a well-telegraphed
   hike, a partly-unwound position** (one estimate puts the carry trade at **~$261B**, with no
   year-over-year growth in the last quarter, against claims of trillions) **and no US growth
   scare** — the 09-04 payrolls printed **+162k vs ~55k** consensus. Two of three ingredients are
   missing.

7. **Placement is the point, and it is worse than the ECB's: the decision hits the US tape inside
   the opex corridor.** SUPPORTED from this calendar's own entries. The decision publishes at the
   MPM's conclusion **on 09-18 JST**, i.e. **overnight ET**, so for a US book it is a **09-18 open**
   event. That open is the SET settlement of a quarterly **triple-witching** — the
   [`opex-2026-09-18`](opex-2026-09-18.md) ledger records **$6.2T of notional expiring that day**
   (~23% of all US options exposure, Citadel Securities GMI, **2026-08-31**), inside a
   **9/12 → 9/18** corridor in which two stabilizers fade: >$1.1T of buyback authorizations enter
   blackout from ~09-12, then dealer gamma rolls off. Standard SPX/index options **AM-settle via
   the SET at Friday's open**; single-stock options and the S&P quarterly rebalance settle at the
   close. So a BoJ headline and the largest single-date options settlement of the year land in the
   same thirty minutes, and they are **perfectly confounded**. This entry's practical job is to
   stop the next session attributing that open to Tokyo by default. It is the same discipline the
   ECB ledger banked for the 09-10 30Y auction, pointed at a different confound.

8. **No tracked symbol carries a yen channel this calendar instruments — and no play is proposed.**
   SUPPORTED, and the honesty sits here rather than in a hedge. `symbols: []`. The house playbooks
   (S1/S2/E1/S3/S4 + G1, [`trade-playbooks.md`](../../plans/trade-playbooks.md)) are equity- and
   earnings-keyed; none is rates-keyed, FX-keyed or funding-keyed. The two channels that exist are
   both second-order and both already owned elsewhere: **yen funding costs** (the carry leg, which
   legs 5–6 argue is largely pre-spent) and **global term premium**, the discount-rate channel
   [`fomc-2026-09-16`](fomc-2026-09-16.md) already tiers for NVDA/AVGO/MRVL/CRWV. Neither justifies
   a position, and inventing one from a `medium`-tiered `estimate` event would be exactly the
   over-reach this calendar's date policy forbids.

9. **The BoJ names AI demand in its own reaction function — a real link, pointing the wrong way.**
   SUPPORTED, primary, and recorded because it is novel rather than because it is tradable. The
   July Outlook cites *"an increase in global AI-related demand"* as a support for Japanese growth
   **and** *"the rise in the prices of semiconductors and other items, reflecting the increase in
   global AI-related demand"* as a driver of Japanese inflation. That is the only non-second-order
   connection found between this book's names and this event — but the arrow runs **from** the AI
   cycle **to** BoJ policy, not back. It means a stronger AI capex cycle marginally raises the odds
   of Japanese tightening, which is a feedback loop worth naming and not a signal worth sizing.

### What plays the conditions support (date estimate)

**None.** No entry, exit, hedge or size is keyed to 2026-09-18. Three rules and one branch:

- **Read-only, and cheaply.** The hike is ~80–84% priced, the two 2026 precedents produced nothing
  in the US tape, and this book holds nothing with a yen channel.
- **Search order when it lands** — (1) the **vote split** against July's 8-1 (Takata already at
  1.25%); (2) whether the statement keeps the Outlook's *"clearly above 2 percent"* language while
  realised core sits at 1.8%; (3) any guidance on pace, which is what would move FT-2.
- **The attribution rule.** Any read of the 2026-09-18 US open that has not first checked the yen
  (FT-1's ±2.0% test) and the SET/opex leg is not entitled to attribute the session to the BoJ. On
  a $6.2T witching the expiration is the default explanation.
- **The branch to pre-decide** — if the BoJ *does* surprise (a hold, or a hike with a hawkish pace
  guide that moves the yen through FT-1's threshold), the consequence for this book is not a yen
  trade; it is that the **global term-premium** leg of the `fomc-2026-09-16` tiering gets heavier
  and the carry leg stops being dismissible. That change should be written **there**, not here.

### Honest limits

The **rate correction in leg 1 is primary and firm**; almost everything about *market pricing* is
not. No OIS or futures strip was fetched — `rateprobability.com` returned **HTTP 403** and the
80% / 84% / ~99% figures are search-aggregated press citations whose as-of dates are imprecise;
that dispersion is the load-bearing weakness in leg 2 and must be re-tested every pulse. CNBC
(the June-hike and July-hold decision-day tape, leg 6) and the Japan Times (Ueda's 09-02 remarks)
both refused WebFetch — **403** and **402** respectively — so those levels are quoted from search
snapshots, not from a fetched page. **A specific research hazard was hit twice and is recorded so
the next session does not repeat it:** searches for "BoJ September" surfaced *September 2025*
articles quoting a **0.50%** policy rate and a *December 2025* preview quoting **0.75%**, both
presented as current; the primary PDF is the only thing that settled it. Treat any BoJ figure not
traced to a fetched primary or a dated 2026 article as suspect. The **Summary of Opinions date is
unresolved**: the schedule page's September row reads as **Oct. 1** while the calendar entry's own
note says **09-28**, and the table's offset structure makes both readable — no event is proposed
for it, deliberately, and the next pulse should settle it from a cleaner fetch. VIX **14.53** is
the 2026-09-04 close as carried by the sibling FOMC and ECB ledgers; the `opex-2026-09-18` ledger
records **14.07** as an intraday 2026 low the same day — consistent, but the two numbers are not
the same measurement. The date stays **estimate** despite being read off the BoJ primary, per this
lane's no-self-confirm limit and the absence of any confirmed prefix for a non-Fed central bank; it
widens caution and licenses nothing. Finally, leg 8 is an argument that *nothing* connects — the
honest failure mode of a null claim is that a channel exists and is simply not instrumented here,
which is why FT-1 is written as a measurable **FX** test rather than as a restatement of the claim.

## Stance & kill switches

**Stance (date `estimate`):** **stand aside completely.** A 25bp hike to **1.25%** is the probable
outcome (~80–84% OIS, Bloomberg 09-03 "leaning toward") but is **not** the settled fact the ECB's
09-10 hike was, so this is a real two-sided event — for **Japan**. For this book it is not, and the
ledger takes two *analytical* positions rather than any positional one. First, it **sides against
the carry-unwind narrative for this particular meeting**: the hike is US-endorsed in a published
Treasury readout, the yen's 2026 repricing already ran through a **$59B joint intervention** rather
than through policy, and the two 2026 decisions that actually happened moved the Nikkei **+0.46%**
and the yen not at all. Second, on placement it commits the calendar to an **attribution
discipline**: because the decision reaches the US tape at the **09-18 open** — the SET settlement
of a **$6.2T** triple-witching inside the 9/12→9/18 corridor — no move in that session may be
credited to the BoJ until the yen and the opex leg have both been checked. And it books one factual
correction: **the policy rate is 1.0%, not 0.75%.** Estimates widen caution and license nothing.

**Stance amendment, 2026-09-15 (D-3) — the reasoning changed, the call did not.** The *call* is
unchanged and always was unconditional: stand aside, `symbols: []`, zero capital. What died is the
premise the initial research used to distinguish this event from
[`ecb-decision-2026-09-10`](ecb-decision-2026-09-10.md) — a **live ~16–20% no-hike tail**. Pulled
direct at **2026-09-15 16:39Z**, Polymarket's per-meeting September book prices **hike-25 98.25%**
(bid 98.2 / ask 98.3, $296.9k) against **no change 1.05%** on an **$830.6k** event, so the tail is
**~1%** and this *is* the ECB's dead-information setup. Leg 2's own flagged weakness — the
unresolved 80/84/99% press dispersion — is therefore **resolved, and resolved against leg 2's
framing**. The ledger takes one new *method* position in its place, because it generalises to the
twelve BoJ entries this calendar carries: **a futures-derived BoJ probability is structurally
weaker than a per-meeting venue book**, since Japan lists 3-month futures against a roughly
twice-a-quarter meeting grid and one contract price must be split across two meetings by assumption
— which is exactly what produces centralbank.watch's **61%** ("data as of September 14") beside a
venue **98.25%**. Registered as **FT-boj-decision-2026-09-18-3**, scoreable 2026-09-19 at near-zero
cost. Two facts strengthened rather than changed the existing legs: the intervention behind leg 5
was **¥15.39–15.4tn (~$96bn) across 07-30 → 08-26** and not ~$59B in a session, and leg 4's
politics did not retreat — Bessent repeated the position on **09-01**. Two new confounds join leg 7:
Japan's **national August CPI prints 08:30 JST on decision day**, and the **Fed hikes 09-16**, so
the 09-18 US open now has three explanations ahead of Tokyo.

**Kill switches:**

- **Channel kill (the one that would rebuild this doc):** a tracked name (NVDA/AVGO/MRVL/CRWV)
  moving **>2%** on any session **2026-09-05 → 2026-09-17** that the tape attributes to a BoJ
  headline. Leg 8's "no price channel" claim would be false and the stand-aside needs re-argument.
  Re-check every pulse; score by **2026-09-18**.
- **Carry kill (registered):** **USD/JPY moving more than ±2.0%** from its **2026-09-17** close to
  its **2026-09-18** close. A carry unwind is mechanically impossible without a yen move; a move
  that size means legs 4–6 under-read the surprise and the 09-18 attribution flips toward Tokyo.
  Registered as **FT-boj-decision-2026-09-18-1**, score by **2026-09-19**.
- **Path kill (registered):** the policy rate standing **above 1.25%** at the **2026-10-30**
  decision — i.e. back-to-back hikes. The cycle is faster than this doc assumes and the yen leg
  earns a real weight in this calendar. Registered as **FT-boj-decision-2026-09-18-2**, score by
  **2026-10-31**.
- **Priced kill:** OIS September hike odds falling **below ~50%** before 09-18. Leg 2's "likely"
  dies, the decision becomes a genuine coin flip, and everything downstream is re-derived rather
  than patched. Re-check every pulse.
- **Politics kill:** any US retreat from the Bessent position — a readout, statement or report
  walking back support for BoJ tightening or for further joint intervention. Leg 4 is this doc's
  load-bearing argument and it rests on one dated readout; if Washington's stance changes, the
  "this is not 2024" claim weakens immediately. Re-check every pulse.
- **Data kill:** Japanese national core CPI printing **at or above 2.0%** before the decision.
  Leg 3's "hiking on a projection, not a print" framing is wrong, the hold tail shrinks toward the
  ECB's, and the event becomes dead information rather than two-sided. Score by **2026-09-18**.
- **Date kill:** the BoJ moving the 09-17/18 MPM, or the meeting producing no decision. Breaks the
  header. Re-check every pulse.

**Kill-switch status, 2026-09-15 (D-3).** *Channel kill* — **not fired, and the reason is
attribution rather than magnitude.** Every tracked name cleared >2% on 09-14 alone (NVDA **−3.36%**,
AVGO **−4.77%**, MRVL **−7.32%**, CRWV **−6.75%**; bars pulled today), but that tape belongs to the
hot 09-11 CPI and the Fed repricing, not to any BoJ headline. Recorded honestly as a weakness in the
switch itself: on these names in this tape a 2% threshold is met most weeks, so the switch's entire
discriminating power sits in its subjective attribution clause. *Priced kill* — **not fired and now
remote**: 98.25% would need a 48-point collapse. *Politics kill* — **not fired; it moved the other
way.** *Data kill* — **live but nearly unactionable**: the trigger print (national August core CPI)
publishes **08:30 JST on 2026-09-18**, roughly 3–4 hours before the decision itself. *Date kill* —
**not fired**; the BoJ schedule page re-read today still shows "Sept. 17 (Thurs.), 18 (Fri.)".

Three forward tests registered in
[`forward-tests/boj-decision-2026-09-18.md`](../forward-tests/boj-decision-2026-09-18.md) —
**FT-boj-decision-2026-09-18-1** (the yen null, which is the carry channel's own precondition),
**FT-boj-decision-2026-09-18-2** (the October path) and **FT-boj-decision-2026-09-18-3** (registered
2026-09-15: the per-meeting venue book beats the futures-derived read on this decision). No
equity-shaped test is registered: the 09-18 session is confounded by a record witching, so any
tracked-name test scored that day would be unscoreable by construction — which is leg 7's point, not
a gap in it.

**Kill-switch status, close-out (2026-09-19).** *Channel kill* — **not fired**, unchanged from the
D-3 reading (its window closed 09-17, before the decision reached the tape). *Carry kill* — **not
fired**: USD/JPY moved **155.69 → 157.89** (Frankfurter ECB reference series, 09-17 → 09-18), a
**+1.41%** move, inside the ±2.0% band — see FT-1 below. *Path kill* — **undetermined until
2026-10-30**; FT-2 stays open past this close-out's window (`closeOutWithinDays: 6` clamps the wait,
per `EVENT-RESEARCH.md`'s "close-out waits for its own predictions"). *Priced kill* — **not fired**:
the venue book's 98.25% read was correct, never approached 50%. *Politics kill* — **not fired**; no
US retreat from the Bessent position surfaced in this session's search. *Data kill* — **not fired**:
Japan's national core CPI for August, printed 2026-09-18, read **1.7% y/y** (press-cited: FX.co /
tradingeconomics, both citing the Statistics Bureau release; the primary stat.go.jp page did not
yield the specific figure to a direct fetch this session), below the 2.0% target and actually a
touch softer than July's 1.8% — the hike happened on the projection, exactly as leg 3 argued, not on
an accelerating print. *Date kill* — **not fired**; the MPM ran 09-17/18 as scheduled.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-05 | D-13 | Initial research banked (above). **Correction first: the policy rate is 1.0%, not the 0.75% this entry's own source line carried** — BoJ's **31 July 2026** statement, fetched and text-extracted today, reads *"remain at around 1.0 percent,"* **8-1**, Takata dissenting *for* **1.25%**; 0.75% was the Dec-2025 level, superseded by a **June 2026** hike (7-1, Asada dissenting to hold, Ueda absent). JSON fixed in this PR. **The decision is likely but not settled:** Bloomberg **09-03** — BoJ *"leaning toward"* 25bp to **1.25%** on 09-18, *"flexible on future path"*; Ueda **09-01** (G20 Asheville) *"We'll fully discuss (a rate increase) at every policy meeting, including the next one,"* underlying inflation *"quite close"* to 2%; **09-02** deciding *"with upside price risks in mind."* Pricing is **dispersed and unresolved**: OIS ~**80%**, more recently ~**84%** (~96.5bp cumulative 12m); a separate claim ~**99%**; Polymarket ~21%→~84% post-July-CPI — so a **~16–20% hold tail**, unlike the ECB's 1.1%. **The hawkish case is forward-looking:** national core CPI **1.8%** July, *below* 2% for a **6th month** (headline 1.9%, core-core 1.9%; Aug Tokyo core 1.8%), while the July **Outlook** (fetched) projects *"clearly above 2 percent from the second half of fiscal 2026"* on wage pass-through, crude, yen depreciation and *"the rise in the prices of semiconductors… reflecting the increase in global AI-related demand,"* with CPI risks *"skewed to the upside."* **Why this is not August 2024 — the load-bearing leg:** Treasury readout **sb0619** (**2026-08-30**, fetched) has Bessent expressing *"strong support for Japan's decisive market and monetary steps to address the substantial undervaluation of the yen"*; MoF's **Katayama** (**2026-08-03**, fetched) confirms a **joint US-Japan intervention** on 07-31 ET (~**$59B**, USD/JPY 40-yr low **163.73** → **157.57**) and *"will not hesitate to conduct further joint intervention."* Adjacency sweep: **peers** — none, `symbols: []`. **Macro** — US 09-04 payrolls **+162k vs ~55k**; no US growth scare, removing one of 2024's three unwind ingredients. **Volatility** — VIX **14.53** (09-04 close per sibling ledgers; `opex-2026-09-18` logs **14.07** intraday, a 2026 low — dispersion recorded, not resolved). **Geopolitical** — the Middle East crude shock is named by the BoJ's own Outlook as a push-down on growth and push-up on prices; US Treasury pressure on the yen is itself the policy story. **Event tape** — **the channel has been tested twice and reached nothing**: June's hike to **1.0%** (highest since 1995) left the **Nikkei +0.46%**, USD/JPY **160.22**, yen *"barely flinched"*; July was a hold. USD/JPY **156.23** and 10Y JGB **2.91%** on 09-04, off the ~3.00% highest-since-1996. Carry-trade size estimated ~**$261B**, no y/y growth last quarter. **Placement is worse than the ECB's:** the decision publishes overnight ET, hitting the US tape at the **09-18 open** — the SET settlement of a **$6.2T** triple-witching (~23% of US options exposure, Citadel GMI 08-31) inside the **9/12→9/18** corridor, so BoJ and opex are perfectly confounded. **One dated adjacency proposed as `estimate`:** **`boj-decision-2026-10-30`** (the next MPM, "Oct. 29 (Thurs.), 30 (Fri.)" on the schedule page read today) — FT-2's scoring venue. **Not proposed, deliberately:** the September Summary of Opinions, because the schedule row reads **Oct. 1** while this entry's note says **09-28** and the table offset makes both readable; left for the next pulse. **Honest weaknesses:** no OIS strip fetched (rateprobability.com **403**), CNBC **403** and Japan Times **402** so the decision-day tape is search-snapshot-cited; and searches surfaced *2025* articles quoting 0.50%/0.75% as current — the primary PDF was the only thing that settled the rate. | — (stance set: stand aside, no position, no play; three commitments — correct the rate to 1.0%, side against the carry-unwind narrative for this meeting, and check the yen and the opex leg before crediting the BoJ with anything in the 09-18 session) | 2026-09-12 (medium, 8+d band: every 7d) |
| 2026-09-15 | D-3 | **Adjacency sweep — the tail leg 2 was built on is gone, and the dispersion it flagged resolves against it.** Written intraday ET; every "live" figure carries its own stamp. **Why this pulse reached a session:** VIX **14.53 → 17.56** (live, stamp 16:23Z; 09-14 close **17.10**) is **+3.03**, over the screen's 3-point band, *and* the cadence band transitioned **medium:8+ → medium:0+** (interval 7d → 2d) — either alone is material. **THE HEADLINE — this is the ECB's setup after all.** Polymarket's per-meeting September book, **gamma API direct, stamp `2026-09-15T16:39:40Z`**: **hike-25 98.25%** (bid 98.2 / ask 98.3, $296.9k), **no change 1.05%** ($244.8k), hike-50+ 0.80%, cut-25 0.05%, cut-50+ 0.25%, **event volume $830.6k**, lines summing 100.4%. Against the **~16–20% hold tail** this doc registered at D-13, the tail is now **~1%**. Leg 2's explicitly-flagged weakness — the unresolved 80 / 84 / ~99% press dispersion — is **resolved by fetch, and it resolves to the top**. **The method finding, and it generalises to all twelve BoJ entries here.** centralbank.watch, **fetched direct** (page states *"Data as of September 14, 2026"*): policy rate **1.00%**, September **hike 61% / no change 38.5% / cut 0.0%**, October cumulative 89.7% at an implied **1.34%**, December cumulative 96.7% at **1.51%**, *"51 bp … about 2.0 hikes … across the next 3 meetings."* A 37-point gap to the venue book is not disagreement — the same page carries its own explanation, that **Japan lists 3-month futures against a roughly twice-a-quarter meeting grid, so one price covers two meetings**. A per-meeting book has no such confound; a futures-derived BoJ split is an assumption wearing a probability. **Registered as FT-boj-decision-2026-09-18-3**, score 2026-09-19. (Same page dates the next MPM "October 28" against the BoJ primary's **Oct. 29–30** — a second sign its meeting grid is approximate.) **FT-2 now has the market on its side:** the October venue book ($88.2k) prices **no change 88.0%** / hike-25 11.5% / hike-50+ 1.2% — i.e. ~12.7% of back-to-back risk, against the futures-derived 89.7% cumulative. The two reads disagree about **October**, not September, which is exactly the confound above. **Adjacency sweep. Peers** — none, `symbols: []`. **Macro** — Japan Q2 GDP revised **+1.1% → +1.4%** annualised (Bloomberg 09-07) and July wages up the most in ~30 years, both hawkish; **US core CPI printed hot 09-11** (+0.3% m/m / 2.4% y/y, [`cpi-2026-09-11`](cpi-2026-09-11.md) close-out) and the **Fed is now 86–91% to hike 09-16** ([`fomc-2026-09-16`](fomc-2026-09-16.md)) — **two 25bp hikes 36 hours apart leave the differential roughly unchanged, a mechanical argument *for* FT-1's yen null.** **Volatility** — VIX regime shifted up (14.53 → 17.56) but on US CPI/Fed/opex, not Tokyo. **Geopolitical / policy — the politics kill did not fire, it reversed:** Bessent, **09-01** at the G20, *"I have information that the market doesn't have, and it's my belief that the Japanese government and the BOJ will do the things that will lead to a stronger yen"* (press-cited); Bloomberg's counter-read the next day, *"Bessent Leaves BOJ in No-Win Situation,"* is recorded as the honest other side. **Event tape** — USD/JPY **156.25 (09-04) → 155.00 (09-15)**, ECB daily reference series via frankfurter.dev, fetched direct; the real repositioning was **160.16 (09-01) → 156.01 (09-03)**, with a 09-09 low of **153.27**. Leg 5 upgrades: the intervention was **¥15.39–15.4tn (~$96bn) across 07-30 → 08-26**, the largest monthly total on record, not ~$59B in one session, with 2026 cumulative **>¥27tn** against the prior annual record ~¥15tn (MoF announcement 08-28, **press-cited — the MoF intervention page 404'd**, recorded in `probe-ref.blocked`); Japan's FX reserves fell a record **~$80bn** in August. **TWO NEW CONFOUNDS ON DECISION DAY. (1)** Japan's **national August CPI publishes 2026-09-18**, 08:30 JST — hours before the decision and this doc's own data-kill trigger. Verified from stat.go.jp's release-schedule table (fetched direct; its column pairing corroborates twice against [`japan-cpi-2026-11-20`](../../../src/domain/market-events/japan-cpi-2026-11-20.json)'s independent cell-by-cell parse: Japan Oct → Nov 20, Japan Nov → Dec 18). **Proposed in this PR** as `japan-cpi-2026-09-18`, `estimate`. **(2)** the **09-16 Fed hike**, two days stale into the same open. The attribution rule is now three-way: yen, then SET/opex, then the Fed — Tokyo last. **The Summary-of-Opinions question the D-13 row left open is settled:** boj.or.jp's schedule re-read direct today gives September `['Sept. 17 (Thurs.), 18 (Fri.)', '-', 'Oct. 1 (Thurs.)']` against the header *Date of MPM \| Outlook Report \| Summary of Opinions*, self-checked by the October row (Outlook Report **Oct. 30** = day two of that MPM, as an Outlook must be). **Summary of Opinions = 2026-10-01**; the "09-28" this entry's note carried is the **July** MPM's *Minutes* row, not September's Summary. The calendar already holds `boj-summary-of-opinions-2026-10-01` — nothing to propose. **Channel kill: not fired, on attribution not magnitude** — 09-14 alone ran NVDA **−3.36%**, AVGO **−4.77%**, MRVL **−7.32%**, CRWV **−6.75%** (bars pulled today), all CPI/Fed-attributed; recorded as a weakness in the switch, since a 2% bar on these names is met most weeks and the discrimination sits entirely in the subjective attribution clause. **Scoring hygiene banked before the event, not at scoring:** FT-1 says "close to close" without naming a series, and USD/JPY has no single close — the close-out should score it on the **ECB daily reference series used here** (155.00 on 09-15), stating the series, or on 17:00 ET bars, stating that instead; either is honest, source-shopping at scoring time is not. **Blocked, recorded:** rateprobability.com **403** (second consecutive pulse), vantagemarkets **403**, stooq served a JS bot-challenge, MoF intervention page **404**. **One stale-article trap re-hit:** an ING "BoJ preview: 25bp hike incoming" page fetched cleanly but returned a **2024** publication date against 2026-shaped content — unresolved, so **not cited for any figure**, exactly as this doc's D-13 limits warned. | **Stance amendment (call unchanged, reasoning changed):** the ~16–20% tail that distinguished this event from the ECB's is dead at ~1%, so this is dead information rather than a two-sided event; one new *method* position replaces it — prefer a per-meeting venue book to any futures-derived BoJ probability (FT-3). Stand aside, zero capital, unchanged. | 2026-09-17 (medium, 0+d band: every 2d) |
| 2026-09-17 | D-1 | **Deterministic screen (no Claude session).** Readings — VIX 16.0 (-1.6pt since last), band unchanged (medium:0+), 53 adjacent event(s) tracked, new in corridor since last pulse: `bowman-stress-testing-2026-09-18`, `eia-weekly-petroleum-status-2026-09-16`, `eia-weekly-petroleum-status-2026-09-23`, `house-vote-ratepayer-protection-act-2026-09-17`, `japan-cpi-2026-09-18`, `jpx-market-closure-2026-09-21` +5 more (recorded, not assessed). Nothing tracked crossed its threshold. | — (screen; no assessment made) | 2026-09-19 |
| 2026-09-19 | D+1 | **Close-out (below).** BoJ hiked 25bp to **1.25%**, 7-2 (Asada, Sato dissenting to hold — both dovish, unlike July's single hawkish dissent). USD/JPY **155.69 → 157.89** (+1.41%, Frankfurter ECB reference series), inside FT-1's ±2.0% band. FT-1 and FT-3 scored PASS; FT-2 stays open past the `closeOutWithinDays` ceiling, scoreable 2026-10-30. | — (stance was already stand aside, zero capital; close-out confirms the call, no change) | — (closed; scanner goes quiet on this event) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new `src/domain/market-events/<id>.json`
(`status: "estimate"`) in the same PR. Close-out fills `## Outcome` below from re-run instrument
data (cache busted first), never from memory — after which this doc goes quiet.

## Outcome

**Close-out (2026-09-19, D+1 — inside the `closeOutWithinDays: 6` deadline).** Macro-print mode runs
no `earnings-cycle` / `intraday-edges` instrument (`symbols: []` by design, as at initial research);
the cache was busted first (`rm -rf node_modules/.cache/earnings-cycle node_modules/.cache/intraday-edges`)
though nothing in this ledger reads it. "Re-run instrument data" here means re-fetching every cited
source direct: the BoJ's own **`k260918a.pdf`** Statement on Monetary Policy for the September MPM
(fetched direct, PDF text-extracted via `pdfminer.six` after a first extraction attempt through a
non-CID-aware Tj/TJ parser returned only page furniture — the same stale-tooling trap this doc's D-13
row banked against a different source, now hit against its own primary), the Frankfurter ECB daily
reference series for USD/JPY, Cboe's VIX daily series (Yahoo Finance chart API), and search-corroborated
press for the vote detail and Japan's August CPI print.

**The headline verdict: the call was right, and right for the reason leg 4 gave rather than the
reason the initial tail (leg 2) worried about.** The BoJ hiked 25bp to **1.25%**, the highest since
1995 — the modal outcome every reading from D-13 onward carried, last measured at **98.25%** on the
per-meeting venue book (09-15). But the vote was **7-2, not the 8-1 hawkish-dissent shape of
July**: Governor Ueda's majority (Himino, Uchida, Takata, Tamura, Koeda, Masu) was joined against by
**Asada Toichiro** and **Sato Ayano**, both dissenting *to hold* — Asada on "the rate of increase in
the CPI... being below 2 percent recently," Sato on prices not having "substantially accelerated"
(BoJ statement, `[Note]`, fetched verbatim). Takata and Tamura voted **for** the hike but separately
opposed the outlook's price-risk description as too cautious — a hawkish objection to the *words*,
not the *vote*. Two dovish dissents against one hawkish dissent in July is new information the
initial research could not have had, and it is consistent with the yen's muted reaction below: the
market read the dissent count as guidance, not just the headline rate.

**FT-1 (the yen null) — PASS.** USD/JPY closed **155.69** on 2026-09-17 and **157.89** on 2026-09-18
(Frankfurter, ECB daily reference series, the series this doc's own D-3 row pre-committed to for
scoring hygiene) — a **+1.41%** move, inside the ±2.0% band. The yen *weakened* on a hike rather than
strengthening, which press coverage frames as "BOJ hike fails to lift yen" on the two-dissent
disappointment — but the move stayed well short of anything carry-unwind-shaped. Leg 4's argument
(a US-endorsed, well-telegraphed hike with the yen's stress already pre-spent through intervention)
holds. The mechanical FOMC argument the D-3 row added also holds: the Fed hiked 25bp on 09-16
([`fomc-2026-09-16`](fomc-2026-09-16.md), confirmed 12-0), so both sides of the pair moved together
36 hours apart and the differential barely shifted.

**FT-3 (venue book beats futures-derived read) — PASS.** The **98.25%** per-meeting venue read
called the outcome; the **61%** futures-derived read left roughly 4-in-10 on the wrong side of a
decision that was not, in the event, close. This is scored as **one observation on one decision**,
exactly as registered — it establishes that the futures contract's twice-a-quarter/once-a-meeting
mismatch produced the weaker read here, not that venue books are generally superior, and the next
BoJ ledger on this calendar can re-test it for free.

**FT-2 (no back-to-back hike through October) stays open, by design.** Its score-by is
**2026-10-31**, past this event's `closeOutWithinDays: 6` ceiling (09-24) — `scripts/event-scan.mjs`
named it in `forwardTestsBeyondWindow` and dispatched this close-out anyway rather than holding
past the deadline, exactly as `EVENT-RESEARCH.md`'s "close-out waits for its own predictions" section
specifies. It is recorded here **unscoreable at close-out on purpose**, not a gap: the 7-2 vote's two
*dovish* dissents (against one hawkish dissent in July) if anything support the "no back-to-back
hike" prediction, but that is a read of the vote shape, not a score — the test itself can only be
settled by the 2026-10-30 decision.

**Kill switches, final.** Channel (not fired), carry (not fired — see FT-1), priced (not fired),
politics (not fired), date (not fired) all resolve as recorded in the close-out kill-switch status
above. Path stays undetermined, tracking FT-2.

**Honest limits.** The BoJ's own PDF is a primary source but is CID-font-encoded in a way that
defeated a byte-level Tj/TJ text extraction (returned only headers and the boilerplate Outlook
paragraph, silently dropping the decision paragraph and the vote note) — `pdfminer.six` decoded it
correctly on retry; a future session hitting the same file with a naive extractor should not trust a
partial-looking result as complete. Japan's August national core CPI (**1.7% y/y**, below 2% and
softer than July's 1.8%) is press-cited (FX.co, tradingeconomics, both citing the Statistics Bureau)
rather than read from a fetched stat.go.jp release page, which returned only the CPI methodology
page's own text to a direct fetch and not the August figure. Equity moves on 09-18 itself
(AVGO **+2.97%**, NVDA **+1.34%**, MRVL **+1.45%**, CRWV **+1.85%**, Yahoo Finance) are noted but not
scored against any test — leg 7's confound (a record triple-witching opex sharing the session)
applies exactly as this doc's D-13 row argued, and AVGO's move alone cannot be attributed to Tokyo,
the SET, or the two-day-stale Fed hike without more than a same-day price check. This document goes
quiet from here for its own event — `scripts/event-scan.mjs` will not surface it again — but FT-2
remains an open row in
[`forward-tests/boj-decision-2026-09-18.md`](../forward-tests/boj-decision-2026-09-18.md) until the
2026-10-30 decision settles it.
