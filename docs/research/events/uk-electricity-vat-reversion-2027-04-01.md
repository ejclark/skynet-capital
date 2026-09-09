# UK domestic-electricity VAT reverts 0% to 5% in Great Britain (SI 2026/987 lapses 31 March 2027) — the drag drops out of April's CPI, and a second, larger base effect lands in October 2027 — uk-electricity-vat-reversion-2027-04-01

**Kind:** macro-print · **Date:** 2027-04-01 (estimate, NEWS: — the prefix is a taxonomy artifact, not a doubt about the mechanism: the sunset is written into article 1 of SI 2026/987, `legislation.gov.uk/uksi/2026/987/made`, fetched direct 2026-09-09, which has effect only "for supplies made in the period beginning with 1st October 2026 and ending with 31st March 2027"; corroborated by HMRC's tax information and impact note and by Revenue and Customs Brief 10 (2026). The `estimate` label carries one real contingency — a fresh statutory instrument extending the relief before 2027-03-31 — and one schema gap: `market-events-data.ts` has no confirmed prefix for legislation.gov.uk, HMRC or ONS) · **Impact:** low
**Last assessed:** 2026-09-09
<!-- probe-ref: {"symbols":{},"vix":16.51,"daysBand":"low:15+","adjacentIds":["boj-summary-of-opinions-2027-03-29","case-shiller-hpi-2027-03-30","consumer-confidence-2027-03-30","eia-steo-2027-04-06","fhfa-hpi-2027-03-30","ftc-v-amazon-antitrust-trial-2027-03-29","japan-food-tax-cut-2027-04-01","russell-style-quarter-end-capping-effective-2027-03-31","sifma-japan-early-close-2027-03-29","sifma-uk-bond-market-closure-2027-03-29","sp-select-sector-secondary-reweight-2027-03-31","tic-quarterly-external-debt-2027-03-31"],"screenStreak":0,"blocked":[{"url":"https://www.ofgem.gov.uk/information-consumers/energy-advice-households/energy-price-cap-default-tariff-levels","status":"404","at":"2026-09-09"},{"url":"https://www.ofgem.gov.uk/energy-price-cap/energy-price-cap-default-tariff-levels","status":"404","at":"2026-09-09"},{"url":"https://www.ons.gov.uk/economy/inflationandpriceindices/methodologies/consumerpriceinflationincludingowneroccupiershousingcostsupdatingweights","status":"404","at":"2026-09-09"}]} -->

## At a glance

**TL;DR.** **The proposal that created this entry said the lapse hands back "the same −0.10pp, back the
other way." That conclusion is right, the reason given for it is wrong, and two errors happen to
cancel — which is worth knowing, because only one of them stays cancelled.** Removing 5% VAT cuts a
VAT-inclusive price by **5/105 = 4.7619%**; putting it back raises the now-VAT-free price by
**5/100 = 5.0%**, which is **5% more** than the cut took out. What offsets that is a weighting
convention, not tax arithmetic: ONS price-updates each year's CPI weights to **December of the prior
year** (January index) and **January of the current year** thereafter — and both of those months sit
**inside** the zero-rate window, so the 2027 electricity weight is price-updated through a VAT-free
price and comes in at ≈1/1.05 of its counterfactual. **(1/1.05) × (5/100) = 5/105, exactly.** What
does *not* cancel is the **weight vintage**: the cut used the published **2026** weight (CJXA
**20.6065**/1000, fetched today); the reversion uses the **2027** weight, unknown until the January
print on **2027-02-17**, and CJXA has moved **27.0 → 23.31 → 19.15 → 20.61** across 2023–2026. That
maps the April step to **≈0.091–0.129pp**, not a known 0.10. **And the bigger finding: there are four
dated VAT steps in the UK CPI year-on-year path, not two.** The drag lands in the October 2026 print,
persists to March 2027, **drops out** in the April 2027 print (**2027-05-19**), and then a **second,
upward base effect appears in the October 2027 print (2027-11-17)** and runs to March 2028 — because
that print measures a normal-rated month against a **zero-rated base**. Nobody has diarised the
October 2027 one; it is proposed onto the calendar in this PR. **None of it is ours to trade.**
`symbols: []`; the calendar tracks eight US mega-caps and no UK listing, utility, gilt or sterling
instrument. Date is **estimate** — the lapse needs no act, but an **extension** is procedurally
*cheap* (a fresh negative-procedure SI, no Commons vote, layable up to 2027-03-31), which is a
correction to the proposer's "the ratchet runs one way."

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — there is no instrument here, and there is no instrument 204 days from here | High | `symbols: []`, and the calendar's whole tracked universe is AAPL/AMZN/AVGO/CRWV/GOOG/META/MRVL/MSFT — no UK listing, no utility, no gilt, no sterling leg. A foreign consumption-tax reversion has no channel into an equity-and-earnings book | Any tracked name moving **>2%** on a session between **2026-09-09 and 2027-04-01** attributable to UK electricity VAT policy — the "no price channel" premise is then false and this doc is rebuilt |
| This week | **Watch one procedural clock and nothing else: the 40-day annulment window on SI 2026/987, which closes around 2026-10-18** | High | The Order was **laid 2026-09-08**, so under **Statutory Instruments Act 1946 s.5** (fetched) either House has **40 days** to resolve on annulment. That is the only live way the whole notch — cut *and* reversion — comes off the board. It is **not** the 28-day clock the sibling ledger cites; that is VATA s.97(3)'s made-affirmative approval period, which does not apply to this Order | A **prayer motion against SI 2026/987 tabled in the Commons before ~2026-10-18** — the 2026-10-01 cut and this 2027-04-01 reversion both stop existing |
| This month | **Do not diarise 2027-04-01 yet. Diarise 2026-10-28** — the Budget is the one venue that can plausibly delete this date | Medium | The government's own words on 21 July 2026 are narrower than the press gloss: *"Any further action, including on funding for longer-term measures, will be taken at the Budget alongside an OBR forecast"* — not "an extension will be considered." Against that, the costing is **"around £850 million in 2026-27"**, scoped to the financial year that *ends* on the lapse date, so the published costing books no extension | The **2026-10-28** Budget extending the zero rate beyond **2027-03-31**, or **any fresh SI to that effect laid before 2027-03-31** (**FT-uk-electricity-vat-reversion-2027-04-01-1**) — this event is then redated or dropped, not researched |
| This quarter | **Carry the attribution rule, not the event — and carry the October 2027 half of it, which nobody else is carrying** | Medium | Two mechanical steps follow the lapse, on ONS-published dates: the drag **drops out** in the April 2027 print (**2027-05-19**), and a symmetric **upward** base effect **appears** in the October 2027 print (**2027-11-17**) and holds to March 2028. Both look like inflation news and neither is | The January 2027 CPI weights, published with the January print on **2027-02-17**, showing an electricity weight **outside 19–27 per 1000** — the ≈0.091–0.129pp bound on both steps is then wrong and the arithmetic is rebuilt |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit, hedge or size is keyed to 2027-04-01. This is a foreign consumption-tax
  reversion with no instrument in this book.
- **The arithmetic to carry, and it is not the cut's arithmetic run backwards** — the reversion raises
  the VAT-free price by **5/100 = 5.0%**, not 4.7619%. It only *looks* symmetric because the 2027 CPI
  weight is price-updated through a zero-rated December 2026 / January 2027 and lands ≈1/1.05 lower.
- **The number is a range, not a point** — the 2027 electricity weight is undrawn until **2027-02-17**.
  At CJXA's 2023–2026 spread (19.15–27.0 per 1000) the step is **0.091–0.129pp**; at the 2026 weight
  it is **0.098pp**.
- **Attribution rule one (2027-05-19)** — a UK April 2027 CPI print coming in ~0.1pp *hotter* than a
  naive model is the **VAT drag dropping out**. It is not re-acceleration, and it is not a hawkish
  surprise. Check the ONS contributions table before it is read as one.
- **Attribution rule two (2027-11-17), the one nobody has diarised** — the *same* ~0.1pp reappears as
  an **upward base effect** in the October 2027 print and runs through March 2028, because that print
  compares a normal-rated month with a **zero-rated base**. A hot UK autumn-2027 print is arithmetic.
- **Pass-through is permitted on the way up, not forced** — Ofgem's cap *netted the VAT out* on the way
  down ("VAT is not included in electricity bills for people covered under the energy price cap
  between 1 October and 31 December 2026"). On reversion the April–June 2027 cap simply **rises**,
  which permits the increase rather than compelling it. Default tariffs sit at the cap, so it lands —
  but the mechanism is weaker in this direction and should not be described as automatic.
- **The operational gap, dated** — **Revenue and Customs Brief 10 (2026)** publishes meter-reading
  apportionment guidance for billing periods spanning **1 October 2026** and says **nothing** about
  periods spanning **1 April 2027**, though VATA 1994 **s.88** plainly covers it ("a change … in the
  descriptions of exempt, zero-rated or reduced-rate supplies"). Watch for a follow-up brief before
  2027-04-01.
- **Keep the two 1 April notches apart** — `japan-food-tax-cut-2027-04-01` is a **second** mechanical
  consumption-tax notch on the same date, in the **opposite** direction and roughly ten times the size,
  in a different national CPI (both `estimate`).
- **Watch (dated)** — annulment window closes ~**2026-10-18** (est) · **UK Autumn Budget 2026-10-28**
  (est — OBR costing + any extension) · Jan–Mar 2027 cap announced **2026-11-25** (Ofgem, fetched) ·
  **2027 CPI weights + January print 2027-02-17** (ONS, provisional) · Apr–Jun 2027 cap announced
  ~late Feb 2027 (cadence-derived) · MPC **2027-03-18** · **lapse 2027-04-01** · MPC + MPR
  **2027-04-29** · **April CPI 2027-05-19** (ONS, provisional — the scoring venue) · MPC **2027-06-17**
  (first to *see* the print) · **October CPI 2027-11-17** (ONS, provisional — the second base effect).

## Initial research

### The question, plainly

This entry arrived by **proposal**. The [`uk-electricity-vat-zero-rate-2026-10-01`](uk-electricity-vat-zero-rate-2026-10-01.md)
lane filed `proposals/uk-electricity-vat-reversion-2027-04-01.from-uk-electricity-vat-zero-rate-2026-10-01.json`
on 2026-09-09, reasoning that "the half nobody diarises is the half that gets misread" and asserting
the lapse hands back "the SAME −0.10pp, back the other way." That proposal was read in full before
anything here was written, per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md).

So the question is narrow and checkable: **is the reversion actually the cut in reverse — same size,
same date-arithmetic, same mechanics — or does something about running the notch backwards break the
symmetry?** And secondarily: **does the lapse happen at all**, given that six months is a long time
for a popular tax cut to survive its own sunset?

**One-line verdict:** the symmetry claim is **true in its number and false in its reasoning**, and the
distinction matters — the tax arithmetic is *asymmetric* (+5/100 vs −5/105) and is rescued only by an
ONS weighting convention that happens to cut the other way by exactly the same factor; strip that
coincidence and what is left is a **range, not a number**, plus a **second dated base effect in
October 2027** the proposal did not identify and nothing on this calendar was carrying.

### Method

Sourced web research per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md); no price instruments
run, because `symbols: []` and there is no issuer. Every primary was fetched **direct on 2026-09-09**,
not inherited from the proposer or from the sibling ledger:

- **legislation.gov.uk** — `uksi/2026/987/made` (the Order: made/laid/in-force dates, enabling powers,
  article 1's period of effect, the Schedule 8 Group 24 / Schedule 7A mechanics); **VATA 1994 s.88**
  (supplies spanning a change of rate); **Statutory Instruments Act 1946 s.5** (the annulment window).
- **gov.uk** — HMRC's tax information and impact note (content API, first published
  **2026-09-08T17:00:05+01:00**) and its HTML attachment; **Revenue and Customs Brief 10 (2026)**;
  the **21 July 2026** announcement (`new-pm-cuts-tax-on-household-electricity-bills-…`).
- **ONS** — CPI electricity weight series **CJXA** and RPI series **CZXL** (MM23) as CSV; the
  **release calendar**, swept across all 37 pages of upcoming releases to extract every scheduled CPI
  publication date through January 2028; the **2026 updating-weights** methodology article.
- **Bank of England** — the **2027** MPC announcement dates and which carry a Monetary Policy Report.
- **Ofgem** — the 2026-08-26 cap release for 1 October–31 December 2026.
- **VIX 16.51** (Yahoo `^VIX`, 2026-09-09 close; 15.72 on 09-08, 14.32 on 09-03 — a ~2.2pt lift over
  four sessions, still a low-vol regime).

Three fetches failed and are recorded in `probe-ref.blocked`: two Ofgem cap-level URLs and one ONS
methodology URL, all **404** (wrong path, not an egress block). The Ofgem cap *cadence* below is
therefore derived from Ofgem's own next-announcement statement in a release that did fetch, and the
widely-repeated "23 February 2027" announcement date is **secondary and unverified** — it is not
relied on.

### Leg 1 — "The lapse is the cut run backwards, same size." **MIXED — right answer, wrong reason, and only one of the two errors stays cancelled.**

This is the leg the entry exists for, and it does not survive first contact with the arithmetic.

**The tax arithmetic is asymmetric.** Removing a 5% VAT rate from a VAT-inclusive price *P* leaves
*P*/1.05, a fall of **5/105 = 4.7619%**. Restoring it takes *P*/1.05 back to *P*, a rise of
**5/100 = 5.0%**. The rise is **5% larger than the fall**, for the ordinary reason that percentage
moves do not commute. At the 2026 weight that is 20.6065/1000 × 5.0% = **0.1030pp** against the cut's
**0.0981pp** — a 0.005pp difference, below CPI's published precision but real.

**ONS's weighting convention offsets it, exactly.** From the published 2026 updating-weights article
(fetched): weights are derived from expenditure two years back and *price-updated* — "we apply a
factor to the underlying expenditure based on the change in price between December 2025 and the
average of 2024" for the January index, with "the second update" shifting to January prices for
February through December. Applied to 2027, that means the electricity weight used all through 2027 is
price-updated to **December 2026** and **January 2027** — **both inside the zero-rate window**. The
price it is updated through is therefore ≈1/1.05 of its counterfactual, so the weight itself is
≈1/1.05 of what it would otherwise have been. And:

> (1/1.05) × (5/100) = 5/105 = **4.7619%**

The two errors cancel **exactly**, not approximately. The proposal's number is right. Its stated
reason — "the same −0.10pp, back the other way" — is not the reason it is right.

**What does not cancel: the weight vintage.** The cut was applied to the *published* 2026 weight. The
reversion will be applied to the **2027** weight, drawn from **2025** expenditure and not published
until the January 2027 index on **2027-02-17**. CJXA's own recent history says that is a real
uncertainty, not a rounding one:

| CPI electricity weight (ONS CJXA, per 1000) | 2023 | 2024 | 2025 | 2026 |
|---|---|---|---|---|
| Weight | **27.0000** | **23.3142** | **19.1488** | **20.6065** |
| × 4.7619% ⇒ step | 0.129pp | 0.111pp | 0.091pp | **0.098pp** |

So the honest statement of size is **a step of roughly 0.091–0.129pp**, centred near **0.098pp** if the
2027 weight lands near 2026's — **not** a known 0.10pp. That is the correction this lane makes to the
proposal, and it is checkable on a date: **2027-02-17**.

*(RPI, for completeness: CZXL 2026 = **27**/1000, unchanged from 2025. Nothing in this book turns on
RPI and the sibling's unresolved 0.129 vs 0.14pp gap is not re-litigated here.)*

### Leg 2 — "There is one dated arithmetic event, in April 2027." **REFUTED — there are four, and the second one is unowned.**

Trace a zero-inflation electricity index through the notch. Let the counterfactual index be 100 in
every month; the zero rate makes it 100/1.05 = **95.238** from October 2026 to March 2027, and 100
again from April 2027.

| Print (month) | Published | Current vs base | VAT effect on y/y | Step vs prior print |
|---|---|---|---|---|
| **October 2026** | 2026-11-18 | zero-rated vs normal | **−4.762%** on electricity ⇒ ≈**−0.098pp** headline | **−0.098pp** (drag appears) |
| November 2026 – March 2027 | to 2027-03-24 | zero-rated vs normal | drag persists | ~0 |
| **April 2027** | **2027-05-19** | normal vs normal | **0** | **+0.098pp** (drag drops out) |
| May – September 2027 | to 2027-10-20 | normal vs normal | 0 | ~0 |
| **October 2027** | **2027-11-17** | normal vs **zero-rated base** | **+5.0%** on electricity ⇒ ≈**+0.098pp** headline | **+0.098pp** (base effect appears) |
| November 2027 – March 2028 | — | normal vs zero-rated base | boost persists | ~0 |
| April 2028 | ~2028-05 | normal vs normal | 0 | −0.098pp (boost drops out) |

Two things fall out that the proposal did not carry.

**First, the April 2027 observable is a *level* move, not the y/y step.** The electricity index rises
**+5.0% month-on-month** in April 2027 from VAT alone — a large, visible, testable number — while the
*headline y/y* only steps up ≈0.098pp. Conflating the two is the easiest mistake available here, and
it is the one the phrase "the same −0.10pp, back the other way" invites.

**Second, and this is the finding: the October 2027 print carries a second, upward step of the same
size, and nothing on this calendar was carrying it.** A UK CPI print in **November 2027** that runs
~0.1pp hot is a **zero-rated base month**, not re-acceleration — eighteen months after the cut, with
every commentator who diarised the cut long since done with it. Both venues are proposed onto the
calendar in this PR (`uk-cpi-2027-05-19`, `uk-cpi-2027-11-17`) precisely so they get their own lanes,
because **this ledger goes quiet at close-out in April 2027 and cannot score them itself.**

*(All four figures use ≈0.098pp for readability; per Leg 1 the honest band on each is 0.091–0.129pp,
resolving on 2027-02-17.)*

### Leg 3 — "The lapse is automatic, so the date is safe." **SUPPORTED on the mechanism, MIXED on the outcome — and the proposer's ratchet argument is one-sided.**

The mechanism is not in doubt. Article 1 of SI 2026/987 gives the Order effect only for supplies made
"in the period beginning with 1st October 2026 and ending with 31st March 2027." No act, vote or
instrument is needed for the 5% reduced rate to resume; HMRC has already budgeted ≈100 suppliers for
"updating systems **again** to change the rate from 0% to 5% when the temporary zero rate comes to an
end on 31 March 2027." The default is lapse.

**But the sibling ledger's "the ratchet runs one way — cheap to start, cheap to end on schedule,
expensive to end early" is missing a rung, and the missing rung is the one that matters here.** Its
own analysis of VATA 1994 s.97(4) is correct: an order *abolishing* the new Group 24 early would be
caught by s.97(4)(c)(iii) and need an affirmative Commons vote within 28 days. What that analysis does
not then ask is what an **extension** would cost. By the identical logic it costs almost nothing: an
order *continuing* or re-making a zero-rated group is not "increasing the rate" (s.97(4)(c)(i)), not
moving a supply from reduced to standard rate ((c)(iia)), and not abolishing a zero rate ((c)(iii)).
It falls to **s.97(5)** — negative procedure, no vote — and the Treasury may lay it at any time up to
2027-03-31, at a fiscal event or not. The ratchet is therefore **cheap to start, cheap to extend,
cheap to lapse, expensive only to end early**, which makes extension a materially more live risk to
this date than the proposer implied.

**The near-term procedural clock is also different from the sibling's.** The one live route by which
the whole notch disappears is **annulment** of SI 2026/987, and that window is **40 days from laying**
under **Statutory Instruments Act 1946 s.5** ("the period of forty days beginning with the day on
which a copy thereof is laid before it") — laid 2026-09-08, so closing around **2026-10-18** on a
calendar count. The **28 days** the sibling cites is s.97(3)'s made-affirmative *approval* clock,
which applies to a different class of order and not to this one. A search for a tabled prayer motion
against SI 2026/987 on 2026-09-09 returned nothing; the Order was laid the previous day, so that is a
near-vacuous negative and is recorded as such rather than as evidence of safety.

### Leg 4 — "The Autumn Budget will decide whether it is extended." **MIXED — the press says this; the government did not.**

The widely-syndicated framing is that an extension "will be considered at the Autumn Budget." The
government's own words on **21 July 2026** (gov.uk, fetched) are narrower:

> "Any further action, including on funding for longer-term measures, will be taken at the Budget
> alongside an OBR forecast."

That is a commitment about *further action generally*, not a commitment to consider extending this
relief. Two published facts cut against extension being the base case, and one cuts for it:

- **Against:** the costing is "around **£850 million in 2026-27**" — scoped to the financial year that
  ends **on the lapse date**. The published number books no extension.
- **Against:** HMRC's TIIN has already funded suppliers for the 0%→5% switch-back as a planned one-off
  cost, which is what a department does when it expects the sunset to bite.
- **For:** the funding source named on 21 July is the cancellation of the Digital ID programme, "which
  was going to cost **£1.8 billion over the next three years**" — i.e. the offset has headroom beyond
  a single £850m year, so an extension is fundable without a new revenue measure.

**One correction to the sibling ledger, in its favour.** It recorded that "press figures near £850m
have **no primary source** in the TIIN." That is true of the TIIN — whose Exchequer-impact table is
genuinely empty and deferred to "scrutiny by the Office for Budget Responsibility … at a future fiscal
event" — but the **21 July gov.uk announcement carries the £850m directly**. The figure is a
departmental pre-OBR estimate with a named primary, not a press invention. Its OBR-certified successor
still lands at the **2026-10-28** Budget.

### Leg 5 — "Pass-through will work in reverse the way it worked forwards." **MIXED — the cap forces a cut through and only permits a rise.**

The sibling established that Ofgem's cap closes the pass-through question on the way down, and the
2026-08-26 release (fetched) is explicit: "**VAT is not included in electricity bills for people
covered under the energy price cap between 1 October and 31 December 2026.**" The cap is a
VAT-inclusive **maximum**; when VAT comes out, the maximum falls, and a supplier cannot decline to
pass on what the cap has already netted out. Pass-through down is **mechanical**.

Upward, the logic does not run backwards. When VAT returns, the April–June 2027 cap is reset **higher**
— but a higher ceiling **permits** a price rise, it does not **compel** one. In practice the near
totality of default-tariff customers are priced *at* the cap and suppliers have already been funded
for the system change, so the increase will land; the point is that its certainty rests on **market
behaviour**, where the cut's rested on **arithmetic**. Graded MIXED for that reason, and it is why the
registered pass-through test keys on an **observable index move** rather than on the cap.

**The cap timing, honestly bounded.** Ofgem's October release states the next announcement as
"**25 November 2026** – period 1 January 2027 to 31 March 2027," roughly five weeks ahead of the
period. On that cadence the **1 April–30 June 2027** cap — the first to carry VAT again — is announced
around **late February 2027**. A secondary source gives 23 February 2027; that URL is unverified here
and both Ofgem cap-level pages **404**'d, so the cadence-derived window is what this ledger carries.

### Leg 6 — "The MPC will see it." **REFUTED on the sequencing — the committee that must publish a forecast of it never sees the print.**

From the Bank of England's published 2027 MPC dates (fetched; the Bank marks 2027 as provisional) laid
against ONS's release calendar (fetched), the sequence around the lapse is unusually unhelpful:

| Date | Event | What it knows |
|---|---|---|
| 2027-03-18 | MPC, no report | Last meeting **before** the lapse; has the February print (2027-03-24 is still ahead — in fact it has only up to January) |
| 2027-03-24 | February 2027 CPI | Last print with the drag still in |
| **2027-04-01** | **The lapse** | — |
| 2027-04-21 | March 2027 CPI | Still drag-in; the last pre-reversion read |
| **2027-04-29** | **MPC + Monetary Policy Report** | Must publish a forecast **embedding** the reversion, having seen **no** post-reversion data |
| **2027-05-19** | **April 2027 CPI** | The first observation of the reversion |
| 2027-06-17 | MPC, no report | **First committee to see it** |

So the **April 2027 MPR forecasts the step and the June meeting observes it**, and the two are seven
weeks apart. That is the same structure the sibling found on the way down (November MPR embedded the
cut; the October print landed after the November vote) — which is the strongest available support for
its core claim, inherited and endorsed here: **a self-reversing tax notch whose forecast and
observation never coincide is exactly the kind of thing a committee looks through.** It moves printed
numbers; it does not move votes. `boe-decision-2027-04-29` is proposed onto the calendar in this PR as
the venue where a forecast that books it would first be visible.

### Leg 7 — "It reaches this book." **REFUTED, on the same measurement the sibling ran.**

`symbols: []`. The calendar's entire tracked symbol universe is **AAPL, AMZN, AVGO, CRWV, GOOG, META,
MRVL, MSFT** — eight US mega-caps, no UK listing, no utility, no energy retailer, no gilt or sterling
instrument, and no house playbook keyed to rates, FX or fiscal policy. A pre-announced, legislated,
mechanically-sized reversion of a foreign consumption tax 204 days out is not within reach of the one
transmission channel this repo has ever measured (the gilt→Treasury pipe in
[`uk-autumn-budget-2026-10-28`](uk-autumn-budget-2026-10-28.md), which opens only on the worst ~1% of
gilt days).

**The date's own corridor is quiet, with one collision worth naming.** Twelve tracked events sit
within five days of 2027-04-01 — quarter-end mechanics (`russell-style-quarter-end-capping-effective-2027-03-31`,
`sp-select-sector-secondary-reweight-2027-03-31`), US housing and confidence prints on 03-30, the
`ftc-v-amazon-antitrust-trial-2027-03-29` start, and a **UK bond-market closure on 2027-03-29** (Easter
Monday), which means the last UK trading session before the reversion is Wednesday 2027-03-31. The
collision that actually matters is **`japan-food-tax-cut-2027-04-01`**: a *second* mechanical
consumption-tax notch on the *same date*, in the **opposite direction** and roughly **ten times the
size** (Japan food 8%→1%, that lane's own estimate ≈1.0–1.4pp of Japanese CPI), in a different
national index. Anyone writing "1 April 2027 tax-driven CPI distortion" needs both, kept apart. Both
are `estimate`.

### Leg 8 — "The mechanics of the switch-back are settled." **REFUTED — HMRC has published the transition guidance for the start and not for the end.**

**VATA 1994 s.88** (fetched) is triggered by "a change in the rate of VAT in force under section 2 or
29A **or in the descriptions of exempt, zero-rated or reduced-rate supplies**" — the second limb, which
is precisely what 1 April 2027 is. Under s.88(2) the supplier "may elect" to determine liability
without regard to the normal tax-point rules in s.6(4)–(10), i.e. on when the electricity was actually
consumed.

**Revenue and Customs Brief 10 (2026)** gives the operational form of that election for the *start* of
the window: "Where a billing period includes **1 October 2026**, suppliers may determine the VAT
liability of supplies based on the date the energy is consumed. HMRC recommends using meter readings
to work out how much of a supply is subject to each VAT rate." The Brief says **nothing** about billing
periods spanning **1 April 2027** — and quarterly-billed households will have periods spanning it.

Nothing turns on this for a trading book. It is recorded because it is a **dated, checkable gap in a
primary source** and the natural watch item: a follow-up brief or an update to VAT Notice 701/19 before
2027-04-01. If none appears, the reversion's first weeks carry more supplier-level apportionment
variance than the cut's did — which is a small, honest reason to expect the April 2027 electricity
index to be *slightly* noisier than the arithmetic alone implies.

### Honest limits

- **The weight-cancellation argument is this lane's inference from published methodology, not an ONS
  statement about this case.** ONS describes price-updating in general terms; it has not said how it
  will treat a VAT-distorted December 2026 electricity price when drawing the 2027 weight. A special
  adjustment would break the exact cancellation in Leg 1 and make the reversion step ≈5% larger than
  the cut's. **Resolves 2027-02-17**, when the 2027 weights publish.
- **Weight renormalisation is ignored.** A ≈1/1.05 shave on a 2% basket item slightly raises every
  other weight; the effect on the electricity weight itself is second-order and is not modelled.
- **The 0.091–0.129pp band is an empirical range, not a forecast.** It is the span of CJXA's last four
  published values, used as a proxy for how far the 2027 draw can move. It is not a distribution.
- **No annulment or extension base rate.** The claim that lapse is the base case rests on procedure and
  on the £850m costing's scope, not on a measured historical rate of VAT-relief extensions.
- **The Apr–Jun 2027 cap announcement date is cadence-derived.** Both Ofgem cap-level URLs 404'd; only
  the 25 November 2026 announcement is primary-sourced. The circulating "23 February 2027" is not used.
- **The 40-day annulment count is calendar days.** SIA 1946 s.7(1)'s exclusions for dissolution,
  prorogation and long adjournment were not fetched; the real window may close later than 2026-10-18.
  Recess dates were not checked.
- **Two of the three registered forward tests score after this ledger goes quiet.** Close-out lands
  within 6 days of 2027-04-01; FT-…-2 scores 2027-05-19 and FT-…-3 scores 2027-11-17. That is why both
  print venues are proposed onto the calendar here — the mechanism, not a workaround, but it does mean
  this doc's `## Outcome` will record them as open rather than scored.
- **A standing taxonomy gap, firing again.** This is at least the eighth entry filed `estimate` purely
  because `market-events-data.ts` has no confirmed prefix for a credible non-US primary (here:
  legislation.gov.uk, HMRC, ONS, Ofgem and the Bank of England, five primaries, none admissible).
  Flagged for the calendar's owner rather than self-resolved; the schema is not this lane's to widen.

## Stance & kill switches

**Stance (date: estimate — the lapse needs no act, but an extension needs only a negative-procedure SI;
the underlying Order is in force).** **Stand aside at every horizon.** There is no instrument in this
book with a channel to a British consumption-tax reversion, and none is claimed. The entry's
operational value is threefold and none of it is a trade:

1. **A corrected number, with its resolution date.** The reversion is not "the cut, negated." Its tax
   arithmetic is 5% *larger* (5/100 vs 5/105) and is offset — exactly — only by ONS price-updating the
   2027 weight through a zero-rated December 2026 / January 2027. The residual uncertainty is the
   **weight vintage**, and it resolves on **2027-02-17**: the step is **0.091–0.129pp**, near 0.098pp
   if the 2027 weight lands near 2026's.
2. **Two attribution rules, not one.** The drag **drops out** in the April 2027 print (**2027-05-19**)
   and a symmetric **upward base effect appears** in the October 2027 print (**2027-11-17**), running
   to March 2028. Both look like inflation news; neither is. The second is the one this calendar was
   not carrying, and it is now proposed onto it.
3. **A raised estimate of extension risk.** The sibling's ratchet argument is one-sided: an early
   repeal is expensive (affirmative procedure), but an **extension is cheap** — negative procedure, no
   vote, layable up to 2027-03-31. The government's 21 July words commit to "further action … at the
   Budget," not to considering an extension, and the £850m costing is scoped to 2026-27; but the
   Digital ID offset has three years of headroom. **2026-10-28** is the fork, and it is not the only
   possible venue.

**Kill switches** — any one of these and the stance is rebuilt, not adjusted:

- **A tracked name moves >2%** on a session between 2026-09-09 and 2027-04-01 attributable to UK
  electricity VAT policy → the "no price channel" premise is false.
- **A prayer motion against SI 2026/987 is tabled before the 40-day window closes (~2026-10-18), or the
  Order is annulled** → the cut and the reversion both come off the board.
- **The 2026-10-28 Budget extends the zero rate beyond 2027-03-31, or any fresh SI to that effect is
  laid before 2027-03-31** → this event is redated or dropped, not researched
  (**FT-uk-electricity-vat-reversion-2027-04-01-1**).
- **The January 2027 CPI weights (published 2027-02-17) put the electricity weight outside 19–27 per
  1000** → the 0.091–0.129pp band is wrong and Leg 1's arithmetic is rebuilt.
- **ONS publishes a special adjustment to the 2027 electricity weight for the VAT distortion** → the
  exact cancellation in Leg 1 breaks and the reversion step becomes ≈5% larger than the cut's.
- **The April 2027 CPI electricity index rises less than 4.0% m/m (2027-05-19)** → upward pass-through
  did not land as the cap-behaviour argument assumes
  (**FT-uk-electricity-vat-reversion-2027-04-01-2**).
- **The October 2027 print (2027-11-17) carries no upward VAT base effect in ONS's own contributions
  table** → Leg 2's four-step path is wrong (**FT-uk-electricity-vat-reversion-2027-04-01-3**).

**Registered forward tests:** `FT-uk-electricity-vat-reversion-2027-04-01-1` (the lapse happens on
schedule, score by 2027-03-31), `-2` (upward pass-through, score by 2027-05-19) and `-3` (the October
2027 base effect, score by 2027-11-17), in
[`forward-tests/uk-electricity-vat-reversion-2027-04-01.md`](../forward-tests/uk-electricity-vat-reversion-2027-04-01.md).

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-09 | 204 | **Initial research; canonical file written from `proposals/…from-uk-electricity-vat-zero-rate-2026-10-01.json`, read in full first.** THE PROPOSAL'S "SAME −0.10pp, BACK THE OTHER WAY" IS RIGHT FOR THE WRONG REASON: reversion arithmetic is **+5/100 = 5.0%**, not 5/105 = 4.7619% — 5% larger — and is offset **exactly** because ONS price-updates the 2027 weight to Dec-2026/Jan-2027, both **inside** the zero-rate window (2026 updating-weights article, fetched): (1/1.05)×(5/100) = 5/105. **What doesn't cancel is the weight vintage** — CJXA 27.0/23.31/19.15/20.61 (2023–26, fetched) ⇒ step **0.091–0.129pp**, resolving **2027-02-17**. **FOUR y/y steps, not two:** drag appears Oct-26, drops out in the **April 2027 print (2027-05-19)**, and a second **upward** base effect **appears in the October 2027 print (2027-11-17)** to Mar-28 — unowned until now. **Extension is cheap, correcting the sibling's one-way ratchet:** continuing a zero rate isn't caught by VATA s.97(4), so a negative-procedure SI, no vote, up to 2027-03-31; only early repeal is expensive. **Annulment clock is 40 days from laying (SIA 1946 s.5, fetched), closing ~2026-10-18** — not the sibling's 28 (that's s.97(3) affirmative approval). **£850m HAS a primary** (21 Jul gov.uk), completing the sibling's "no primary in the TIIN"; costing scoped to 2026-27, i.e. books no extension; government's words are "further action … at the Budget," not "extension considered." **Pass-through is permitted, not forced, upward** — the cap netted VAT out on the way down; on reversion it only rises. **MPC sequencing:** 2027-04-29 MPR must forecast it with no post-lapse data; 2027-06-17 is the first to see it (BoE 2027 dates, fetched). **s.88 covers the reversion but R&C Brief 10 publishes apportionment only for 1 Oct** — gap flagged. Adjacency: 12 events within 5 days; `japan-food-tax-cut-2027-04-01` is an opposite-direction, ~10× consumption-tax notch on the **same date**; UK bond market shut 2027-03-29 (Easter Monday). VIX 16.51 (09-09), up ~2.2pt over four sessions. Three 404s recorded in `probe-ref.blocked`. Proposed: `uk-cpi-2027-05-19`, `uk-cpi-2027-11-17`, `boe-decision-2027-04-29`. | **Stance set: stand aside at every horizon** — with two corrections to the proposing lane on the record: the size is a **range resolving 2027-02-17**, not a known 0.10pp, and **extension risk is higher** than its one-way-ratchet framing implies. FT-…-1, -2 and -3 registered. | 2026-10-09 (low band, 30d interval) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-<this-event-id>.json` (`status: "estimate"`) in the
same PR — your own file, never another event's canonical one (#1717). Close-out fills `## Outcome` below from re-run instrument
data (cache busted first), never from memory — after which this doc goes quiet.
