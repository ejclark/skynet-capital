# VIX December 2027 expiration (SOQ settlement) — vix-expiration-2027-12-15

**Kind:** opex · **Date:** 2027-12-15 (estimate, EST: the OIC/OCC's published row, which this research finds is a **seven-day publisher error** — Cboe's own rule, read from the primary this session, and Cboe's own realized settlement history both give **2027-12-22**) · **Impact:** low
**Last assessed:** 2026-09-09
<!-- probe-ref: {"symbols":{},"vix":15.72,"daysBand":"low:15+","adjacentIds":["ndx-annual-reconstitution-announcement-2027-12-10","sp-rebalance-reference-close-2027-12-10","opex-2027-12-17","sp-quarterly-rebalance-effective-2027-12-20"],"screenStreak":0,"blocked":[{"url":"https://cdn.cboe.com/resources/futures/Cboe_Futures_Exchange_Holiday_Calendar.pdf","status":"403","at":"2026-09-09"},{"url":"https://cdn.cboe.com/api/global/delayed_quotes/futures/VX.json","status":"403","at":"2026-09-09"},{"url":"https://cdn.cboe.com/data/us/futures/market_statistics/final_settlement_prices/VX.csv","status":"403","at":"2026-09-09"}]} -->

## At a glance

**TL;DR.** **Stand aside, and take the correction — it is the whole deliverable.** This event is
almost certainly not real. The OIC/OCC expiration calendar publishes a December-2027 VIX settlement
on **2027-12-15**; Cboe's own rule, its own realized settlement prints, and the file's own internal
arithmetic all say **2027-12-22**. Three things settle it, all run this session rather than
inherited. **(1) The rule, read from the primary today** — a sibling recorded this text as
unreadable, and it is not; it sits in the page's flight payload: settlement is "the Wednesday that
is 30 days prior to the third Friday of the calendar month immediately following". January 2028's
third Friday is **2028-01-21**, so settlement is **2027-12-22**, and no holiday clause fires.
**(2) The published row is self-refuting** — 2027-12-15 plus 30 days is **2028-01-14**, the
*second* Friday of January 2028, not a standard monthly series at all. **(3) The calendar twin,
new to this class and decisive.** 2010 and 2027 are the *same calendar* (both non-leap, both
starting Friday). Cboe's realized 2010 SOQ prints match the OIC's published 2027 rows in
day-of-month on **ten of twelve** months, May's difference being fully explained by a Juneteenth
clause that did not exist in 2010 — and **December is the only unexplained one: realized
2010-12-22 against published 2027-12-15.** New also: the OCC's **second** artifact, its print 2027
PDF ("accurate as of 12/18/2025"), carries the identical 12-15 mark, so the publisher is
internally **consistent** and wrong — correcting a sibling proposal that called it inconsistent.
The error's mechanism is exact: **2027-12-15 = 2027-11-17 + 28 days**, a four-week carry-forward
that silently agreed with the rule in 2025 and 2026 and breaks here for the first time. Date stays
**`estimate`**; `VX/Z7` is unlisted, so nothing can be confirmed today. **Nothing here licenses a
position at D-462, and nothing would even if the date were right.**

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — treat this id as a probable calendar artifact, not an event | High | D-462, `symbols: []`, `impact: low`; a re-grep of `trade-playbooks.md` + `multi-symbol-sweep.md` for `opex\|expiration\|witching\|volatility settlement\|SOQ` returns **zero hits in both**, run this session | A house vol/opex instrument built and back-tested before **2027-12-15** — the "nothing is settlement-keyed" leg goes stale and this sheet is rebuilt on measured data |
| This week | **Stand aside** — nothing in the 2026-09-09 → 2026-09-13 tape is `VX/Z7`-keyed, and `VX/Z7` is not listed | High | Cboe's listed VX strip stopped at **`VX/K7`** (2027-05-18) as of 2026-09-04 and this session's re-fetch of the futures quote surface returned **403**, so no term-structure statement about this contract exists or is made | Cboe listing `VX/Z7` before **2026-09-13** on either candidate date — the first surface that could settle this at all |
| This month | **Stand aside; the one thing to watch is a publication, not a price** — the OIC/OCC's 2028 expiration calendar | Medium | The 2027 file appeared "accurate as of 12/18/2025", so a 2028 file is due around **2026-12**; December 2028 is the next year the +28 carry-forward diverges from the rule (+28 gives **2028-12-13**, the rule gives **2028-12-20**), making it a clean out-of-sample test of the named mechanism | The 2028 calendar publishing **2028-12-20** — the mechanism named here is wrong, or OCC has fixed its generator, and this document's account of *why* 12-15 exists fails even though the 12-15/12-22 call may stand. Registered as **FT-vix-expiration-2027-12-15-2** |
| This quarter | **Work from 2027-12-22 as the December 2027 settlement and treat this id as the artifact** — the correction this row exists to bank | High | Rule + holiday clause reproduces **217 of 217** available `VRO` monthly prints 2008-07 → 2026-09 and **35 of 36** OIC/OCC volatility rows, sole miss this one; the calendar-twin year **2010** realized **12-22**; the file's own +30d anchor for this row (2028-01-14) is January's *second* Friday | The OIC/OCC reissuing 2027-12-15 unchanged **with** 2028 third-Friday rows present, **or** Cboe listing `VX/Z7` dated 2027-12-15 — the second would make the publisher the venue's record and this derivation the error. Re-check both surfaces at every pulse |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit, hedge or resize is keyed to this date. It is `estimate`, and
  `estimate` widens caution rather than licensing anything. It is also, on this document's own
  finding, probably not a date at all.
- **The correction, and it is the deliverable:** a member or a downstream lane meeting
  "2027-12-15" on a broker or OIC calendar should read **2027-12-22**. Both ids are in this
  calendar on purpose — this one is the publisher's date, `vix-expiration-2027-12-22` (a sibling
  lane's) is the rule's date. They cannot both be real; this lane's call is that the sibling's is.
- **Execution guard, stated for whichever date proves real:** nothing trades that day's opening
  auction. The expiring VX contract's last trade is **09:00 ET** and the SOQ's first prints are
  settlement artifacts, not information. Same guard all VIX siblings carry.
- **Resolution is mechanical, not an argument to be won:** `VX/Z7` appearing on any Cboe settlement
  or expiration-calendar surface. Dated **2027-12-22** → this id is retired. Dated **2027-12-15** →
  this research is wrong, the OCC is the venue's own record, and this id promotes under `OCC:`.
  Neither is available today; `VX/Z7` is unlisted.
- **Method finding banked for the class:** the Cboe VX specification body **is** in the served HTML
  of `cboe.com/tradable-products/vix/vix-futures/specifications` — inside the Next.js
  `self.__next_f.push` flight payload, not the static DOM. The `vix-expiration-2027-12-22` proposal
  recorded it as absent and cited the rule second-hand from a sibling ledger; it does not need to.
  Grep the flight payload before recording this URL as blocked.
- **Second method finding:** the OIC/OCC's print-ready year PDFs are **rasterized single images**
  with no text layer, so `pdftotext`-style extraction returns nothing and looks like an empty
  source. The image inflates out of the PDF's one `/Subtype /Image` object and re-wraps into a PNG
  with `zlib` alone — no imagemagick, no poppler — which is how the second artifact was read here.
- **Structural placement, not a call:** the hypothetical 30-day reference window
  **2027-12-15 → 2028-01-14** is 21 sessions (Christmas 2027-12-24 closed; 2028-01-01 is a
  Saturday); the rule-correct window **2027-12-22 → 2028-01-21** is 20. The ±5-day corridor holds
  [`opex-2027-12-17`](opex-2027-12-17.md) at D+2 (**`confirmed`**, high impact),
  `sp-quarterly-rebalance-effective-2027-12-20` at D+5, and
  `ndx-annual-reconstitution-announcement-2027-12-10` / `sp-rebalance-reference-close-2027-12-10`
  at D−5. `vix-expiration-2027-12-22` sits at **D+7**, outside the corridor.
- **No same-day settlement positioning, VIX open interest by strike, or SPX gamma is quoted.** At
  D-462 those describe a different expiry entirely.

## Initial research

### The question

This id arrived as a **proposal**,
`proposals/vix-expiration-2027-12-15.from-fomc-minutes-2027-12-29.json`, filed 2026-09-08 by the
FOMC-minutes lane, which recorded a seven-day discrepancy against Cboe's settlement rule and
explicitly declined to resolve it: *"This entry follows the FILE, because the OCC is the primary
and the rule is a reconstruction."* A second, **separately owned** proposal —
`proposals/vix-expiration-2027-12-22.from-opex-2027-12-17.json`, filed the same day by the
December-opex lane — took the opposite side and filed the rule-derived date as its own id.

So the question this initial research has to answer is not "what happens on 2027-12-15." It is:
**which of the two dates is the December 2027 VIX settlement, and what is the honest state of a
calendar that now carries both?**

### Method

Everything below was run in-session on 2026-09-09 against primary sources. Nothing is inherited
from a sibling ledger except where explicitly labelled as such.

1. Re-fetch and re-decode the OIC/OCC calendar payload, scoring **all 36** of its volatility rows
   against a coded implementation of Cboe's rule including the holiday clause.
2. Recover Cboe's rule text from the venue's own specification page.
3. Cross-check the OIC/OCC's **second** 2027 artifact — the print-ready PDF — independently of the
   API.
4. Validate the rule against **realized settlement prints**, not against another calendar: Cboe's
   own `VRO` (VIX SOQ) history.
5. Find and test a **historical calendar twin** of 2027, so the disputed row can be checked against
   what actually happened rather than against arithmetic.
6. Name a generating mechanism for the error specific enough to be falsified out of sample.

### Leg 1 — the rule, from the primary. SUPPORTED.

`cboe.com/tradable-products/vix/vix-futures/specifications` (HTTP 200, 461,361 bytes, fetched
2026-09-09) carries the settlement rule verbatim:

> The final settlement date for a contract with the "VX" ticker symbol is on the Wednesday that is
> 30 days prior to the third Friday of the calendar month immediately following the month in which
> the contract expires.

> If that Wednesday or the Friday that is 30 days following that Wednesday is a Cboe Options
> holiday, the final settlement date for the contract shall be on the business day immediately
> preceding that Wednesday.

The VIX **options** specification page carries the same holiday clause word for word, checked the
same session.

Applied to the December 2027 contract: January 2028's Fridays are the 7th, 14th, 21st and 28th, so
the third Friday is **2028-01-21**; the Wednesday 30 days prior is **2027-12-22**. Neither leg is a
Cboe Options holiday — the OCC's own published 2027 holiday set carries nothing between 2027-11-25
and 2027-12-24, and MLK Day 2028 is Monday 2028-01-17. The clause does not fire. **Settlement is
2027-12-22.**

*Correction to a sibling, recorded because it changes what the next session should try.* The
`vix-expiration-2027-12-22` proposal states that this session's fetch returned 200 but that *"its
specification table renders client-side and the 'Final Settlement Date' body was absent from the
served HTML,"* and cites the rule second-hand from `vix-expiration-2027-10-20` rather than reading
it. The body is in the served HTML — inside the Next.js `self.__next_f.push(...)` flight payload
rather than the static DOM. It reads with a grep. That URL should not be carried as blocked.

### Leg 2 — the published row is self-refuting. SUPPORTED.

The rule defines settlement by reference to the *third* Friday 30 days later. Take the published
row at face value: **2027-12-15 + 30 days = 2028-01-14**, which is the **second** Friday of January
2028. There is no reading of the rule under which the December contract settles against that date.
This is internal to the file's own row and needs no external source.

### Leg 3 — the OIC/OCC calendar, scored whole. 35 of 36, sole miss this row. SUPPORTED.

`optionseducation.org/api/expirationcalendar` re-fetched direct 2026-09-09 (HTTP 200, 34,871
bytes; its own footnote: *"these dates are accurate as of 1/2/2026"*). Decoding the payload against
its legend block gives 36 "Monthly Volatility Products Expiration date" rows spanning 2025-01 →
2027-12. Scored against the coded rule:

| Result | Count |
|---|---|
| Rule reproduces the published row exactly | **35 of 36** |
| Of which the holiday clause fired and was predicted correctly | 3 (2025-03-18 · 2026-05-19 · 2027-05-18) |
| Disagreements | **1 — 2027-12-15, rule 2027-12-22** |

That reproduces what `vix-expiration-2027-10-20` and `vix-expiration-2027-11-17` each found
independently, from a third direction. The December 2027 rows around it are *correct*: the file's
AM-settled cease-trading row (2027-12-16) and monthly equity expiration (2027-12-17) both match the
third Friday of December 2027, and its monthly-equity series scores **36 of 36**. One bad row, not
a bad file.

### Leg 4 — the OCC's SECOND artifact agrees with the first. NEW. The publisher is consistent, and consistently wrong.

The `vix-expiration-2027-12-22` proposal's central claim is that *"THE PUBLISHER DISAGREES AND IS
INTERNALLY INCONSISTENT, WHICH IS THE WHOLE REASON THIS PROPOSAL EXISTS."* That is checkable, and
it is wrong.

The payload advertises a print-ready **2027 Expiration Calendar PDF** at a separate URL, footnoted
*"accurate as of 12/18/2025"* — a **different generation, two weeks earlier** than the API's
1/2/2026 snapshot. Fetched direct 2026-09-09 (HTTP 200, 98,956 bytes). It has no text layer: it is
a single 1169×1077 `DeviceRGB` `FlateDecode` image. Inflated out of the PDF and re-wrapped as a PNG
(zlib only — no poppler or imagemagick available on this runner), its December 2027 grid reads
unambiguously by eye: the purple "Monthly Volatility Products Expiration date" block sits on
**Wednesday the 15th**; the 22nd is plain.

So both OCC artifacts, generated a fortnight apart, publish 2027-12-15. The publisher is
**internally consistent**. That *strengthens* the case that this is a systematic generator error
rather than a transcription slip — and it removes the sibling's stated reason for preferring the
rule, which now has to stand on evidence the sibling did not have.

### Leg 5 — the rule against REALIZED settlements, not another calendar. 217 of 217. SUPPORTED.

Cboe publishes its VIX SOQ prints as the `VRO` series
(`cdn.cboe.com/api/global/us_indices/daily_prices/VRO_History.csv`, HTTP 200, fetched 2026-09-09,
1,268 rows, 2008-07-16 → 2026-09-02). Running the coded rule forward over every month in range and
asking whether its predicted date appears as an actual print:

| Result | Count |
|---|---|
| Predicted date present in Cboe's own print series | **212** |
| Predicted date displaced one business day, holiday clause fires and predicts it | **5** (2014-03-18 · 2022-03-15 · 2024-06-18 · 2025-03-18 · 2026-05-19 — Good Friday ×3, Juneteenth ×2) |
| Predicted date absent from the series at any date | **1** (2013-05: the file runs 2013-04-17 → 2013-06-19 with no May row at all) |

**217 of the 217 months Cboe's own file actually covers.** The 218th is a gap in the publisher's
data, not a rule failure. This is a stricter test than scoring the rule against another calendar,
because it scores against settlements that really happened.

### Leg 6 — the calendar twin. NEW, and it is the decisive leg.

Arithmetic can be argued with. Realized settlements in an identically-shaped year cannot.

**2010 and 2027 are the same calendar** — both non-leap, both beginning on a Friday — and the years
that follow them share the property that makes December unusual: **2011-01-01 and 2028-01-01 are
both Saturdays**, which pushes January's third Friday to the 21st, its latest possible position.

| Month | 2010 realized (Cboe `VRO`) | 2027 published (OIC/OCC) | Same day of month? |
|---|---|---|---|
| Jan | 2010-01-20 | 2027-01-20 | yes |
| Feb | 2010-02-17 | 2027-02-17 | yes |
| Mar | 2010-03-17 | 2027-03-17 | yes |
| Apr | 2010-04-21 | 2027-04-21 | yes |
| May | 2010-05-19 | 2027-05-18 | **no** — the Juneteenth clause, a holiday that did not exist in 2010 |
| Jun | 2010-06-16 | 2027-06-16 | yes |
| Jul | 2010-07-21 | 2027-07-21 | yes |
| Aug | 2010-08-18 | 2027-08-18 | yes |
| Sep | 2010-09-15 | 2027-09-15 | yes |
| Oct | 2010-10-20 | 2027-10-20 | yes |
| Nov | 2010-11-17 | 2027-11-17 | yes |
| **Dec** | **2010-12-22** | **2027-12-15** | **no — and nothing explains it** |

2010 is a clean read: twelve prints, no weeklies existed, so every row is unambiguously the monthly
settlement. Ten of twelve match exactly, the eleventh is fully explained by a statutory holiday
added in 2021, and the twelfth is the disputed row — where what actually happened was **the 22nd**.

### Leg 7 — the generating mechanism, named and made falsifiable. NEW.

**2027-11-17 + 28 days = 2027-12-15.** The published error is exactly a four-week carry-forward
from the previous row.

Why that survived undetected: the Nov→Dec step is **28 days** for December 2025 and December 2026,
so a carry-forward and the rule agree, and the calendar looks right. December 2027 is the first
year in the file's span where the correct step is **35 days**, because January 2028's third Friday
sits at its latest possible position. It is the **only** 35-day Nov→Dec step the rule produces
across 2025–2027.

This composes with — rather than competes against — `vix-expiration-2027-11-17`'s "the publisher
errs where it is unanchored" finding: this row is the one row of 36 whose own +30-day anchor
(2028-01-14) falls past the file's 2027-12-31 end, and a generator with no anchor to read is
exactly the kind that falls back on a fixed step. The "unanchored" account says *where* the error
occurs; the +28 account says *what the wrong value is*, which is what makes it testable.

**The out-of-sample test.** December 2028 is the next divergence: +28 from the November 2028
settlement (2028-11-15) gives **2028-12-13**, and the rule gives **2028-12-20**. The OIC/OCC's 2028
calendar is due around 2026-12 on the 2027 file's own publication cadence. Registered as
**FT-vix-expiration-2027-12-15-2**.

### Leg 8 — status. Stays `estimate`, and could not be otherwise. SUPPORTED.

`VX/Z7` is on no Cboe surface. The listed strip stopped at `VX/K7` (2027-05-18) as of the
`vix-expiration-2027-10-20` session's read on 2026-09-04, and this session's attempt on the
delayed-quotes futures endpoint returned **403** (recorded in `probe-ref.blocked`, along with the
CFE holiday-calendar PDF and the final-settlement-price CSV, both 403). VX lists roughly nine
months out, so `VX/Z7` should not be expected before about **2027-03**. Until then no venue surface
can adjudicate, and both candidate dates stay `estimate` by construction.

### What this does NOT establish — honest limits

- **The OCC is a clearing house, not a guess.** This document concludes a primary publisher is
  wrong, twice over, on the basis of a rule and a historical analogue. That is a strong claim on
  strong evidence, but it is a derivation; the venue's own listing is the only thing that settles
  it, and it does not exist yet.
- **The 2010 twin is `n = 1`.** It is a realized settlement in an identically-shaped year, which is
  much better than arithmetic, but it is one observation. The other same-shape years are 2004
  (before `VRO` begins) and 2021, whose December carries weekly prints on both the 15th and the
  22nd and therefore cannot separate monthly from weekly on date alone.
- **The +28 mechanism is a hypothesis about a generator nobody here can see.** It fits perfectly
  and predicts an out-of-sample value; it is not an account anyone at OCC has confirmed.
- **Nothing about market behaviour was measured here at all,** and deliberately: the sibling
  ledgers have already measured this settlement configuration inert on every channel they tested,
  and this row's question was a date, not a price.

## Stance & kill switches

**Stance (date `estimate` as of 2026-09-09; `VX/Z7` unlisted; every event in the corridor
`estimate` except `opex-2027-12-17`).** **This id is a calendar artifact, and the December 2027 VIX
settlement is `2027-12-22`.** Confidence high on the date, and it is stated as a call rather than a
hedge because the evidence is not close: the rule read from the venue's primary, the file's own
self-refuting +30-day anchor, 217 of 217 realized settlements, 35 of 36 published rows, and a
calendar-twin year that actually settled on the 22nd. The entry is kept rather than deleted for
two reasons — the OIC/OCC publishes it, so a member may meet it on a broker calendar and deserves
this correction to be findable; and the id encodes the date, so re-dating it is not available to
this lane and writing the sibling's canonical file is forbidden. **No position is opened, closed or
sized because of this event, on either date.** One guard survives whichever date proves real:
nothing executes on that day's opening auction. Two method findings are banked for the class — the
Cboe spec body is readable in the flight payload (a sibling has it recorded as blocked), and the
OIC/OCC year PDFs are rasterized images that need zlib re-wrapping rather than text extraction.

**Kill switches:**

- **Cboe lists `VX/Z7` with a final settlement date of 2027-12-15** — this document is wrong, the
  OCC is the venue's own record, this id promotes to `confirmed` under `OCC:` and the sibling
  `vix-expiration-2027-12-22` retires. Expected observable from roughly **2027-03**; re-check at
  every pulse. This is **`FT-vix-expiration-2027-12-15-1`**.
- **Cboe lists `VX/Z7` dated 2027-12-22** — the call is confirmed and this id should be retired by
  whoever owns it then, not argued with.
- **The OIC/OCC reissues its calendar carrying 2028 third-Friday rows and still publishes
  2027-12-15** — the "unanchored generator" account fails and the publisher is asserting the date
  with the anchor in hand, which is materially different evidence. Re-check the payload at every
  pulse.
- **The OIC/OCC 2028 calendar publishes its December-2028 volatility row as 2028-12-20** — the +28
  carry-forward mechanism named in leg 7 is wrong (or has been fixed), and this document's account
  of *why* the error exists fails even if the 12-15/12-22 call stands. This is
  **`FT-vix-expiration-2027-12-15-2`**; the 2028 file is due around **2026-12**.
- **A revised exchange calendar puts a closure on 2027-12-22 or 2028-01-21** — the holiday clause
  fires, the rule-correct date moves to 2027-12-21, and this whole comparison re-dates. Re-fetch a
  2027/2028 exchange calendar by **2027-01-04**.
- **A house vol/opex instrument gets built and back-tested** — the "nothing is settlement-keyed"
  leg stops being a grep result and starts being data; this sheet is rebuilt on measured results.

**Registered forward tests.** Two rows in
[`forward-tests/vix-expiration-2027-12-15.md`](../forward-tests/vix-expiration-2027-12-15.md):
`FT-vix-expiration-2027-12-15-1`, the **date** — no monthly VIX SOQ prints on 2027-12-15 and
`VX/Z7` carries 2027-12-22; and `FT-vix-expiration-2027-12-15-2`, the **mechanism** — the OIC/OCC's
2028 calendar publishes 2028-12-13 rather than the rule-correct 2028-12-20. Both score by
**2027-12-21**, this event's close-out date. *A wrinkle worth stating rather than smoothing:* the
close-out window (`closeOutWithinDays: 6`) ends **2027-12-21**, one day before the date this
research says the settlement actually falls, so the close-out can verify the **absence** of a
12-15 print and the listed `VX/Z7` date, but the confirming 12-22 print belongs to the sibling
ledger. Nothing here scores any sibling's row.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-09 | D-462 | Initial research on an id that existed only as `proposals/vix-expiration-2027-12-15.from-fomc-minutes-2027-12-29.json`; that proposal and the rival `proposals/vix-expiration-2027-12-22.from-opex-2027-12-17.json` were both read first, and the **canonical `vix-expiration-2027-12-15.json` is written in this PR**, shadowing the former and touching neither. probe-ref seeded (no symbols; **VIX 15.72** at the 2026-09-08 close per Cboe's own history file; band `low:15+`; 4 adjacents; **3 blocked**, all `cdn.cboe.com` 403s). **THE DELIVERABLE IS THE CORRECTION: this id is very probably not a real settlement date, and December 2027's is 2027-12-22.** Rule read from the **venue primary this session** (`cboe.com/.../vix-futures/specifications`, HTTP 200) — Jan-2028 third Friday **2028-01-21**, Wednesday 30d prior **2027-12-22**, no holiday leg, clause silent. The published row is **self-refuting**: 12-15 + 30d = **2028-01-14**, January's *second* Friday. OIC/OCC payload re-fetched (HTTP 200, 34,871 B, "accurate as of 1/2/2026") and scored whole: rule reproduces **35 of 36** volatility rows including all 3 holiday-clause cases, sole miss this one; its equity series is 36 of 36 and its own 12-16/12-17 December rows are correct — one bad row, not a bad file. **NEW — LEG 4, correcting the rival proposal:** its central claim that the publisher is "internally inconsistent" is **false**. The OCC's **second** artifact, the print 2027 PDF ("accurate as of 12/18/2025", a different generation), is a rasterized single image with no text layer; inflated from its one `/Subtype /Image` object and re-wrapped to PNG with zlib alone, its December grid puts the purple volatility block on **Wednesday the 15th**. Two OCC publications a fortnight apart agree — consistent, and consistently wrong. **NEW — LEG 6, the decisive one: the calendar twin.** 2010 and 2027 are the same calendar (non-leap, Friday start; 2011-01-01 and 2028-01-01 both Saturdays). Cboe's realized 2010 `VRO` prints (12 rows, no weeklies existed, so all unambiguously monthly) match the OIC's published 2027 rows in day-of-month **10 of 12**; May's one-day gap is fully explained by the post-2021 Juneteenth clause; **December is the only unexplained one — realized 2010-12-22 vs published 2027-12-15**. **LEG 5, independently reproduced:** rule + clause reproduces **217 of the 217** months Cboe's `VRO` file actually covers 2008-07→2026-09 (212 exact + 5 holiday displacements: Good Friday ×3, Juneteenth ×2); the 218th, 2013-05, has **no print at any date** (file jumps 2013-04-17 → 2013-06-19) — a publisher data gap, not a rule failure. **NEW — LEG 7, the mechanism, made falsifiable:** **2027-12-15 = 2027-11-17 + 28d** exactly. A four-week carry-forward agrees with the rule for Dec-2025 and Dec-2026 (both +28) and breaks here for the first time, because Jan-2028's third Friday sits at its latest possible position, making the correct step **35d** — the only 35-day Nov→Dec step in the file's span. Composes with the 11-17 sibling's "errs where unanchored" (this is the one row whose +30d anchor falls past the file's end): unanchored says *where*, +28 says *what*, which is what makes it testable. **STATUS stays `estimate` on the LISTING:** `VX/Z7` on no Cboe surface (strip stopped `VX/K7` at the 2026-09-04 read; this session's quote endpoint **403**); VX lists ~9mo out, so expect nothing before **2027-03**. **TWO METHOD FINDINGS BANKED for the class:** (a) the Cboe spec body **is** in the served HTML, inside the Next.js `self.__next_f.push` flight payload — the rival proposal records this URL as blocked and cites the rule second-hand, and should not; (b) OIC/OCC year PDFs are rasterized images, so text extraction returns nothing and looks like an empty source. Adjacency — **peers:** none (`symbols: []`). **Macro:** nothing settlement-mechanics-specific. **Volatility regime:** baseline row, nothing to diff; Cboe closes 2026-09-08 **VIX1D 10.43 · VIX9D 14.81 · VIX 15.72 · VIX3M 18.39 · VIX6M 20.34 · VVIX 88.69**, contango; **no `Z7` on the strip**, so no term-structure statement is available or made. **Geopolitical:** none. **Event tape:** playbooks grepped for `opex|expiration|witching|volatility settlement|SOQ` → **zero hits in both**. **NOTHING PROPOSED, refusal computed:** the ±5d corridor holds `opex-2027-12-17` (D+2, canonical `confirmed`), `sp-quarterly-rebalance-effective-2027-12-20` (D+5, canonical) and the two D−5 proposals for 2027-12-10; `vix-expiration-2027-12-22` is at **D+7**, outside the corridor and already a sibling's proposal — not written here on the one-file-per-owner rule. **`FT-...-1` (the date) and `-2` (the +28 mechanism) registered.** **Own weaknesses:** the twin is n = 1 (2004 predates `VRO`; 2021 carries weeklies on both the 15th and 22nd and cannot separate monthly from weekly on date alone); the +28 account fits a generator nobody here can observe; and this document concludes a clearing house is wrong on a derivation, which only a venue listing can actually settle. | Initial stance set: **stand aside**, and the id recorded as a **probable publisher artifact** — date `estimate`, working date for December 2027 is **2027-12-22**. | 2026-10-09 (low, ≥15d band: every 30d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint notes
any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance *change*
earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-vix-expiration-2027-12-15.json`
(`status: "estimate"`) in the same PR — your own file, never another event's canonical one (#1717).
Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from
memory — after which this doc goes quiet.
