# FOMC communications blackout begins (through 2027-07-29) — fomc-blackout-start-2027-07-17

**Kind:** macro-print · **Date:** 2027-07-17 (estimate, EST: federalreserve.gov "2025–2027 FOMC Trading and External Communications Blackout Calendar" PDF — re-downloaded 2026-09-06, its 2027 grid shading decoded in-session and validated by reproducing all eight 2026 windows, its footnote re-extracted verbatim, and the arithmetic re-derived off `fomccalendars.htm`; all three return Jul 17 – Jul 29. Still `estimate` because the underlying Jul 27–28 meeting is tentative until the 2027-06-08/09 meeting confirms it) · **Impact:** medium
**Last assessed:** 2026-09-06
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"medium:31+","adjacentIds":[],"screenStreak":0,"blocked":[]} -->

## At a glance

**TL;DR.** **The family's newest rule does not survive July, and the reason is structural rather than
statistical: the variable is the dot plot, not the month.** The [May sibling](fomc-blackout-start-2027-05-29.md)
measured June's in-gate overhang at **2.63×** the following session and called it the widest of the twelve
months. Reproduced here and then cut a different way across **149** windows 2007–2026 (ex-2020): meetings **with**
an SEP run **1.65×** with the overhang the larger session in **49 of 72**; meetings **without** one run
**0.94%** and **33 of 77** (z = **3.09**, p = **0.002**), and the ordering survives a within-month control in
**7 of the 8** months that carry both meeting types. **Every July meeting is a no-SEP meeting**, and July
measures **1.02×**, overhang larger in **5 of 14**. So June's rule is inherited *and refused*, with a reason.
**But this gate has its own boundary event, and it is a different measurement layer.** From SEC 8-K Item 2.02
dates pulled this session: **AAPL or AMZN has printed on the gate's last in-gate session in 5 of the last 6
July gates** (both did in 4, and in the last three consecutively), MSFT and META print on the decision day or
the one before, and **5 of the 9 tracked names have printed inside the gate in each of the last three years**.
In those seven years the book carries a name past **4%** on that session in **5 of 7**, against 2 of 7 when
neither prints — running **3.070%** mean / **1.860%** median per name against **1.371% / 1.333%** — while the
**index runs *below* its own baseline** (0.756% vs 0.676%). Applied to 2027 that projects AAPL and AMZN onto
**Thursday 2027-07-29**, inside the gate, which **corrects the proposing entry**, whose note put them on 07-30.
**And the honest shape is two event sessions with no ordering edge at either layer:** in those same seven years
the *post-gate* session is just as large for the book (2.702% mean / 2.863% median). Date stays **`estimate`**.
**No directional call.**

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-314) | **Stand aside** — nothing to trade | High | A gate has no issuer and prints no number; it changes who may speak, not what anything is worth, and `symbols: []`. A re-grep of `trade-playbooks.md` and `multi-symbol-sweep.md` for `blackout\|holiday\|closure\|early close\|half-day\|dot plot\|summary of economic projections` returns **0 hits** in both | An FOMC participant making on-record monetary-policy remarks between **2027-07-17** and **2027-07-29**, which would mean the gate is not the constraint this doc rests on |
| This week | **No action here — this week's load is the 2026-09-16 FOMC and its SEP** | High | A D-314 gate on an `estimate` date cannot compete with an SEP meeting ten days out, and that meeting is five upstream of the one this gate wraps | Nothing at this distance; the first input that could move this is the **2026-09-16** SEP |
| This month | **Do not carry June's overhang rule into July — the discriminating variable is the SEP, and July never has one** (`estimate` — a planning refusal, never an entry) | Medium | Measured: no-SEP gates run **0.94×** over/post and **33 of 77**, SEP gates **1.65×** and **49 of 72** (z = 3.09, p = 0.002); July itself is **1.02×**, **5 of 14**. The cut was motivated by June's result, so the within-month control (7 of 8 months) carries the weight, not the pooled split | The **2027-07-29** session printing a *larger* absolute S&P move than **2027-07-30**. Registered as **FT-fomc-blackout-start-2027-07-17-1** |
| This quarter | **Plan 2027-07-29 *and* 2027-07-30 as single-name event sessions, and neither as an index one** (`estimate` — a sizing observation, never a direction) | Medium | In the 7 July gates where a mega-cap printed on the overhang, a tracked name moved ≥4% on it in **5 of 7** (vs 2 of 7 otherwise) and the following session was just as large (2.702% mean / 2.863% median per name), while the index ran **0.756%**, below its own 0.676% baseline. The event is dispersion across two sessions, not level, and not ordering | The tracked names' Q2 calendars, once announced, putting **neither** AAPL nor AMZN on **2027-07-29**. Registered as **FT-fomc-blackout-start-2027-07-17-2** |

**Signals & conditions** — the buy/sell/hold triggers:

- **Two sessions are named, and they are named for the book rather than the index** — **2027-07-29** (the gate's last day, projected to carry AAPL and AMZN: 5 of 6 base rate for at least one, 4 of 6 for both) and **2027-07-30** behind it. Size single names as event sessions across the pair; do **not** size the index off either (1 of 7 in the conditional subset), and do **not** read an ordering between them.
- **June's rule is explicitly refused, with a stated cause.** The overhang premium tracks the **SEP**, not the month — and July has none. Do not inherit `fomc-blackout-start-2027-05-29`'s 2.63× ordering claim here.
- **September's no-short-vol rule is refused outright here, not deferred.** Its generating condition was a top-tier US print trapped inside the gate; **no such print is inside this one**. BLS's published schedule (fetched HTTP 200 this session) stops at Nov 2026, and the derived 2027 dates put the June report at **2027-07-02** and the July report at **2027-08-06** — 11 sessions before the gate opens and 5 after it lifts.
- **The deadline is an ordinary equity close** — the gate opens 12:00 a.m. ET Saturday **2027-07-17**, so the last legal Fed voice is **Friday 2027-07-16**. Unlike the [May gate](fomc-blackout-start-2027-05-29.md), no SIFMA early close or market holiday touches this corridor: Independence Day 2027 falls on a Sunday and is observed Monday **2027-07-05**, before the window, and the gate contains **9** ordinary trading sessions.
- **The one macro print inside is the Consumer Confidence edition, and it is medium-impact** — [`consumer-confidence-2027-07-27`](consumer-confidence-2027-07-27.md) (estimate) lands 10:00 a.m. ET on the decision's day one, ten days into the gate. Its own ledger measures that print **null against every control it ran** (0 of 9), so it is corridor context, not a trigger.
- **Never** — treat the gate itself as an entry signal, or read the sizing observation as a direction; the mega-cap prints inside the gate are two-sided by construction.
- **Watch (dated)** — FOMC + SEP **2026-09-16** · FOMC **2026-10-28** · FOMC + final 2026 dots **2026-12-09** · FOMC **2027-01-27** (est) · FOMC + first 2027 SEP **2027-03-17** (est) · FOMC **2027-04-28** (est) · **FOMC 2027-06-08/09 (est — the confirmation trigger for this gate)** · last legal Fed voice **2027-07-16** · gate opens **2027-07-17** · CB Consumer Confidence **2027-07-27** (est, inside) · decision, no SEP, **2027-07-28** (est) · **gate lifts end of 2027-07-29 — the session both forward tests are about** · first legal Fed voice **2027-07-30**, also July's last session · derived July employment report **2027-08-06** (outside).
- **Relevance kill** — hike odds below ~40% or cut odds off 0% before **2027-07-17**: the two-sidedness that makes a closed interpretation channel matter goes away.

## Initial research

### The question, plainly

Six blackout ledgers precede this one and the family has never twice reached the same conclusion.
[September](fomc-blackout-start-2026-09-05.md) called a no-short-vol window because top-tier US data was
trapped inside the gate; [October](fomc-blackout-start-2026-10-17.md) refused it because October's prints
landed *before* the gate; [November](fomc-blackout-start-2026-11-28.md) found the gate outlives the decision
by a session; [January](fomc-blackout-start-2027-01-16.md) turned that overhang into a **sizing rule on an
earnings cluster**; [March](fomc-blackout-start-2027-03-06.md) refused January's rule and called the boundary
inert; and [May](fomc-blackout-start-2027-05-29.md) reversed March with the family's sharpest number yet —
June's overhang at **1.145%** against **0.413%** post-gate, *"the largest such ratio of the twelve months."*

So the question is narrow and adversarial: **does May's ordering rule transfer to July — and if not, is the
reason July, or is it something the family has been mis-attributing to months all along?** Second, and
separately: **January's rule was about an earnings cluster sitting on the gate's last day. Does that geometry
recur here?**

**One-line verdict.** No and yes, and the two answers are different measurement layers. **May's rule does not
transfer, and the cause is the SEP rather than the month** — pooled across 149 windows the overhang out-moves
the post-gate session in **68%** of meetings with a dot plot and **43%** without one (z = 3.09, p = 0.002), the
split survives a within-month control in 7 of 8 months, and every July meeting is a no-SEP meeting. July itself
measures **1.02×** and **5 of 14**. **January's geometry does recur, and it is single-name rather than
index** — AAPL or AMZN has printed on this gate's last in-gate session in **5 of the last 6** July gates, and
in those years a tracked name moved ≥4% on that session in **5 of 7** against 2 of 7, while the index ran
*below* its own baseline. The deployable output is therefore a **single-name sizing observation across
2027-07-29 and the session behind it**, plus an explicit refusal of the index-level ordering rule the previous
ledger would have handed forward. Date `estimate`; no directional call.

### Method

Macro-print mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — `symbols: []` on the event
itself, so no symbol-keyed instrument applies; `earnings-cycle.mjs` / `intraday-edges.mjs` have no macro mode
and were not run, though **both caches were busted first** and `market-data.mjs`'s EDGAR path was re-run cold
for leg 4. Their analog (*re-source, don't recall*) was honoured: every sibling number quoted below was either
re-derived from raw data here or is labelled as inherited.

**Primaries fetched raw and parsed by machine today (2026-09-06):**
`federalreserve.gov/monetarypolicy/files/fomc-blackout-period-calendar.pdf` (HTTP 200, 98,013 bytes; 60 of 122
content streams inflated, footnote re-extracted **and** the 2027 grid decoded — leg 1);
`federalreserve.gov/monetarypolicy/fomccalendars.htm` (HTTP 200, 164,831 bytes); the Board's **fourteen
historical FOMC calendar pages 2007–2020** (`fomchistorical<year>.htm`, HTTP 200 each — every meeting heading
and every meeting's SEP/projection-materials link parsed, which is what makes leg 3's cut possible);
`bls.gov/schedule/news_release/empsit.htm` (**HTTP 200**, 55,578 bytes — reachable from this runner where the
May sibling's runner met 403 on the same URL). **Dated negative check, not a block:**
`bls.gov/schedule/2027/home.htm` returns **404** — BLS has not published a 2027 schedule, which is an answer
rather than a failed fetch, so `probe-ref.blocked` stays empty.

**Price and filing work is this session's own.** Yahoo daily bars (`^GSPC`, `^VIX`, and NVDA MRVL AVGO CRWV
MSFT GOOG META AAPL AMZN) through **2026-08-28** on the long-history pull, with the **2026-09-04** closes read
from a separate one-month pull the same session. **167** meetings parsed 2007–2027, every gate derived from the
footnote rule, **149** usable windows after dropping 2020. Earnings dates are **SEC 8-K Item 2.02 filing dates**
via `scripts/research/market-data.mjs` (cache busted first). Siblings
[`fomc-blackout-start-2027-05-29`](fomc-blackout-start-2027-05-29.md),
[`fomc-blackout-start-2027-01-16`](fomc-blackout-start-2027-01-16.md),
[`fomc-blackout-start-2027-03-06`](fomc-blackout-start-2027-03-06.md),
[`fomc-blackout-start-2026-09-05`](fomc-blackout-start-2026-09-05.md) and
[`consumer-confidence-2027-07-27`](consumer-confidence-2027-07-27.md) are read as inputs and cited, never
silently restated. Genre model: [`nvda-aug-2026-print.md`](../nvda-aug-2026-print.md).

### Conviction legs, tested

1. **The window is 2027-07-17 → 2027-07-29, established three independent ways in-session.** SUPPORTED.
   *(i)* The PDF's footnote, re-extracted verbatim today: *"The blackout period will begin at 12:00 a.m.
   Eastern Time the second Saturday before a meeting and end at 11:59 p.m. Eastern Time the day after a
   meeting. For example, if the Committee meeting starts on a Tuesday, the blackout period will begin at the
   start of the Saturday that falls ten days earlier, and if the meeting ends on a Wednesday, the blackout
   period will end at the end of Thursday."* Jul 27 2027 is a **Tuesday** → the gate opens **Saturday
   2027-07-17**; Jul 28 is a **Wednesday** → it closes at the end of **Thursday 2027-07-29**. *(ii)* The
   PDF's vector grid was **decoded here**, not inherited: the 2027 page carries **38** fill rectangles at the
   legend's grey `0.851` covering **104** day glyphs, resolving to eight windows of exactly 13 calendar days.
   **The decoder was validated before it was believed** — run against the 2026 page it returns `01-17→01-29 ·
   03-07→03-19 · 04-18→04-30 · 06-06→06-18 · 07-18→07-30 · 09-05→09-17 · 10-17→10-29 · 11-28→12-10`, all
   eight, including the **confirmed** 2026-09-05 window this calendar already carries; the 2027 page then
   returns `01-16→01-28 · 03-06→03-18 · 04-17→04-29 · 05-29→06-10 · **07-17→07-29** · 09-04→09-16 ·
   10-16→10-28 · 11-27→12-09`. This agrees to the day with the decodes
   [`fomc-blackout-start-2027-05-29`](fomc-blackout-start-2027-05-29.md) and
   [`fomc-blackout-start-2027-01-16`](fomc-blackout-start-2027-01-16.md) reported. *(iii)* The same footnote
   applied to all sixteen 2026–2027 meetings **reproduces every blackout entry this calendar already carries**
   — 2026-09-05 (confirmed), 2026-10-17, 2026-11-28, 2027-01-16, 2027-03-06, 2027-04-17, 2027-05-29 — to the
   day. The gate contains **9** trading sessions and no market holiday: Independence Day 2027 falls on a
   Sunday, observed Monday **2027-07-05**, before the window opens.

2. **The date stays `estimate`, and the trigger is a meeting rather than a better fetch.** SUPPORTED.
   `fomccalendars.htm`, re-fetched today, gives the 2027 panel verbatim as `January 26-27 | March 16-17* |
   April 27-28 | June 8-9* | July 27-28 | September 14-15* | October 26-27 | December 7-8*` under its own
   footnote `* Meeting associated with a Summary of Economic Projections`, and states *"Each meeting date is
   tentative until confirmed at the meeting immediately preceding it."* **Note what the missing asterisk on
   `July 27-28` means for leg 3:** this is a statement-only meeting, and the parse below shows July has never
   been anything else. The promotion trigger is the **2027-06-08/09** meeting.

3. **The headline: the overhang premium tracks the SEP, not the month — so May's rule does not transfer to
   July, and the family has been attributing to calendars what belongs to meeting type.** SUPPORTED, and it is
   this document's contribution. Every gate has the same shape — it closes at the end of the day *after* the
   decision, so the last in-gate session is always an overhang and the first post-gate session is the day
   after. Measured across **149** windows 2007–2026 ex-2020 from `^GSPC` daily bars, grouped by the month the
   meeting *starts* in:

   | Group | n | Decision day | **Overhang** | First post-gate | Baseline | Over/base | Over/post | Over > post |
   |---|---|---|---|---|---|---|---|---|
   | **July** | **14** | **0.589%** | **0.810%** | **0.797%** | 0.676% | 1.20× | **1.02×** | **5 of 14** |
   | June | 19 | 0.522% | 1.086% | 0.413% | 0.707% | 1.54× | **2.63×** | 13 of 19 |
   | January | 19 | 0.926% | 0.856% | 1.177% | 0.757% | 1.13× | 0.73× | 10 of 19 |
   | **All pooled** | **149** | 0.920% | 0.976% | 0.812% | 0.768% | 1.27× | 1.20× | 82 of 149 |
   | **SEP meetings** | **72** | 0.844% | **1.031%** | **0.627%** | 0.769% | 1.34× | **1.65×** | **49 of 72 (68%)** |
   | **no-SEP meetings** | **77** | 0.992% | 0.925% | 0.985% | 0.766% | 1.21× | **0.94×** | **33 of 77 (43%)** |

   Three readings, stated separately because they are different claims. *(i)* **May's number reproduces, and
   its interpretation does not.** June's decision day (**0.522%**) and post-gate session (**0.413%**) come back
   exactly; the overhang comes back at **1.086%** against its reported 1.145%, a construction difference this
   session can name — June 2025's gate closed on Juneteenth (2027 aside, 2025-06-19), so the last *tradeable*
   in-gate session was the decision day itself. Direction and rank are unaffected. *(ii)* **The month is not
   the variable.** The SEP/no-SEP split is a **25-point** gap in the ordering frequency on a two-proportion
   test, **z = 3.09, p = 0.002**, from an identical construction — and it explains the family's two extremes at
   once: June (always SEP) is the high, January-since-2013 (never SEP) is the low. *(iii)* **The within-month
   control is what carries it**, because the cut was chosen *after* seeing June's result and is therefore
   partly in-sample. Restricting to months that carry **both** meeting types — a comparison in which the
   calendar is held fixed — the SEP subgroup has the higher over-out-moves-post frequency in **7 of 8**:

   | Month | SEP | no-SEP | | Month | SEP | no-SEP |
   |---|---|---|---|---|---|---|
   | January | 4 of 5 | 6 of 14 | | September | 9 of 13 | 3 of 5 |
   | March | 9 of 13 | 3 of 6 | | October | 2 of 2 | 4 of 8 |
   | April | 3 of 5 | 2 of 8 | | November | 3 of 3 | 3 of 5 |
   | June | 13 of 18 | 0 of 1 | | **December** | **6 of 13** | **3 of 5** |

   **December is the one reversal and it is reported, not buried.** The proposed mechanism — a dot plot and a
   projections presser hand the market two days of material where a statement-only meeting is consumed in one —
   is a *hypothesis this document does not claim to have established*; the measurement is the claim, and
   leg 3's forward test scores it on a date.

4. **This gate's own event is corporate, it sits on the gate's last day, and it is bigger than January's.**
   SUPPORTED, and it is the half of the doc that is deployable. From **SEC 8-K Item 2.02 filing dates** pulled
   cold this session, positioned in *sessions* relative to each July gate's decision day:

   | Year | Decision | AAPL | AMZN | MSFT | META | Names inside the gate |
   |---|---|---|---|---|---|---|
   | 2021 | 07-28 | −1 | **+1** | −1 | 0 | 5 of 9 |
   | 2022 | 07-27 | **+1** | **+1** | −1 | 0 | 5 of 9 |
   | 2023 | 07-26 | +6 | +6 | −1 | 0 | 3 of 9 |
   | 2024 | 07-31 | **+1** | **+1** | −1 | 0 | 5 of 9 |
   | 2025 | 07-30 | **+1** | **+1** | 0 | 0 | 5 of 9 |
   | 2026 | 07-29 | **+1** | **+1** | 0 | 0 | 5 of 9 |

   `+1` **is** the overhang — the gate's last day. **At least one of AAPL/AMZN printed on it in 5 of the last
   6** July gates, **both did in 4 of 6** and in the last three consecutively; META has printed on the decision
   day itself in **9 of the last 11**; and **59** tracked-name prints fall inside the fifteen July gates
   2012–2026 against **zero** on the first post-gate session. Applied to 2027 — decision Wed **2027-07-28**,
   gate closing end of Thu **2027-07-29** — that projects AAPL and AMZN onto **2027-07-29, inside the gate**.
   **This corrects the proposing entry.** [`consumer-confidence-2027-07-27`](consumer-confidence-2027-07-27.md)'s
   own note put both names on **2027-07-30** under a "+2 sessions after the July print" reading; the July CB
   print is that month's last Tuesday, **2027-07-27**, and two sessions later is **Thursday 2027-07-29**. The
   two readings agree on the pattern and disagree on the arithmetic, and the session-anchored measurement above
   needs no CB assumption at all.

5. **And the size of it — measured, and measured at the layer where it exists.** SUPPORTED, with the
   index-level null reported as loudly as the book-level result. Splitting the fourteen July gates on whether
   AAPL or AMZN actually printed on the overhang session:

   | Subset | n | **Book, overhang (mean / median)** | Book, post-gate (mean / median) | Years with a name ≥4% on the overhang | Index, overhang | Index, post-gate | Index over > post |
   |---|---|---|---|---|---|---|---|
   | Mega-cap printed on it | 7 | **3.070% / 1.860%** | 2.702% / 2.863% | **5 of 7** | 0.756% | 0.914% | **1 of 7** |
   | Neither did | 7 | 1.371% / 1.333% | 1.358% / 0.964% | 2 of 7 | 0.863% | 0.680% | 4 of 7 |
   | *July baseline* | — | *1.596% / 1.105%* | *1.596% / 1.105%* | — | *0.676%* | *0.676%* | — |

   **Three readings, and the second one narrows the first.** *(i)* **The effect is single-name and absent at
   the index level** — in the conditional subset the index runs *below* its own baseline on the very session
   the book runs above its own. That is why leg 3's refusal and leg 4's observation do not contradict each
   other: they are about different instruments. *(ii)* **The mean overstates it and the count does not.** The
   2.24× mean ratio is tail-driven (2026 alone contributes 7.83%); on medians it is **1.40×**, and 2016 and
   2021 came in *below* the book baseline despite a mega-cap printing. The robust statistic is the count — a
   name past 4% in **5 of 7** against **2 of 7** — which is what the forward test is written against.
   *(iii)* **There is no ordering claim here either.** The post-gate session is just as large for the book
   (2.702% / 2.863%), because the cluster runs two days: the honest output is *two* event sessions, not a
   preference between them. It also **re-reads January's rule** rather than inheriting it —
   [January](fomc-blackout-start-2027-01-16.md) measured **2.87%** per name on its overhang against a 1.82%
   January baseline (6 of 8 with a name ≥4%) and framed it as a property of the gate; measured here, the
   property belongs to **whether a mega-cap prints that day**, which is checkable in advance and false in 7 of
   the 14 July years.

6. **No top-tier US macro print is trapped inside — September's rule is refused here outright, not deferred.**
   SUPPORTED, and better sourced than the siblings could manage. `bls.gov/schedule/news_release/empsit.htm`
   returned **HTTP 200** to this runner (the May sibling met 403 on the same URL), publishing every Employment
   Situation release date from Nov-2025 through **Nov-2026**. That let this session do something the family has
   never done: **test its own derivation rule against BLS's published dates.** The rule ("third Friday after the
   Sunday–Saturday week containing the 12th") matches **9 of 13**, and each of the four misses has a nameable
   cause — Nov-2025 and Dec-2025 (the 2025 shutdown-disrupted schedule), Jan-2026 (the annual benchmark
   revision, which delays January every year), and Jun-2026, published **Jul 2** against a derived **Jul 3**
   because Jul 3 2026 was the observed Independence Day. **So the rule is good to about ±1 week outside those
   four cases, and that is enough here:** it puts the June-2027 report at **2027-07-02** (11 sessions before
   the gate opens) and the July-2027 report at **2027-08-06** (5 sessions after it lifts). A one-week error in
   either direction still misses the window. `bls.gov/schedule/2027/home.htm` is a **404** — not published
   yet — so no 2027 date is asserted as sourced, and none is proposed as a calendar entry.

7. **The corridor is otherwise empty, and the two things inside it are already owned.** SUPPORTED. The
   calendar carries **nothing** within ±5 days of 2027-07-17 — `probe-ref.adjacentIds` is genuinely `[]`, not
   unfilled. Inside the window sit exactly two tracked items:
   [`consumer-confidence-2027-07-27`](consumer-confidence-2027-07-27.md) (estimate, medium — 10:00 a.m. ET on
   the decision's day one, ten days in) and `fomc-2027-07-28` (estimate, high), which exists as a sibling
   lane's proposal and is being researched in its own session as this one is written; **this document proposes
   no calendar entry and writes no file it does not own.** The CB print's own ledger measures it **null against
   every control it ran** (0 of 9, four ways) and reports that a July CB print has *never* been observed
   outside an FOMC day one — 0 of 6 — so it is corridor context here, not a second event.

8. **Regime and exposure anchors, read today rather than recalled — plus the one place the volatility complex
   agrees with leg 3.** SUPPORTED. **VIX 14.53** and **S&P 7,718.60** (2026-09-04 closes, pulled this session;
   today is Sunday 2026-09-06), matching [`fomc-blackout-start-2027-05-29`](fomc-blackout-start-2027-05-29.md)
   exactly — **no regime shift**, and the probe baseline above is set with real readings. `symbols: []`; the
   transmission read is inherited unchanged — target range **3.50–3.75%**, forward guidance abolished
   **2026-08-28**. The measured addition: across the July sample VIX runs **−0.08%** on the decision day,
   **+1.96%** on the overhang and **+0.25%** post-gate, where June runs **−2.20% / +2.30% / +0.21%** and
   January **+3.26% / −2.01% / +2.30%**. July's overhang carries a vol bid comparable to June's *without* the
   index-return premium June has — consistent with leg 5's reading that the July session is dispersion rather
   than level, and inconsistent with buying index vol against it.

### What the conditions support (date `estimate` — caution only, never an entry)

**No direction, no size, no level.** Three operative items and two refusals:

- **Two sessions are named, at the single-name layer.** **2027-07-29** — the gate's last day — is projected to
  carry AAPL and AMZN and has carried at least one of them in 5 of the last 6 July gates; **2027-07-30** sits
  behind it and measures just as large for the book. In those years a tracked name moved ≥4% on the overhang in
  **5 of 7** against 2 of 7 otherwise.
- **The same sessions are explicitly *not* named at the index layer, and there is no ordering between them.**
  July's over/post is **1.02×** and **5 of 14**; in the conditional subset the index ran **below** its own
  baseline and the book's post-gate median actually exceeded its overhang median. Do not carry May's ordering
  rule across, and do not invent a July version of it.
- **A deadline with no sharp edge, for once.** The last legal Fed voice is **Friday 2027-07-16**, an ordinary
  16:00 close — no SIFMA early close, no holiday inside, 9 sessions in the window. The first legal voice is
  **Friday 2027-07-30**, which is also July's last session.
- **A refusal.** September's no-short-vol window does not apply: its generating condition was a top-tier US
  print inside the gate, and the derived 2027 dates put both nearby employment reports comfortably outside.
- **A second refusal, and it is the headline.** June's overhang rule is a **SEP** phenomenon. July has no SEP.

### Honest limits

**The SEP cut was motivated by June's result, so its pooled p-value overstates what it knows.** The hypothesis
was formed to explain a sibling's extreme and then tested on the same sample that produced it; the within-month
control (7 of 8) and the **2027-07-29** forward test are the out-of-sample checks, and December's reversal is
the honest counter-example. The two-proportion test also treats **149** windows as independent draws when they
are drawn from four chairs and several regimes, which they are not. **The mechanism is proposed, not
established** — "a dot plot is two days of material" is a story that fits the numbers, and this document
deliberately does not defend it. **July's sample is short for a reason worth stating: a July FOMC meeting did
not exist before 2012.** Across 2007–2011 the summer meeting sat in August (Aug 7, Aug 5, Aug 11–12, Aug 10,
Aug 9), so this gate carries **14** usable observations against June's 19 and January's 19, and leg 5's
conditional split runs on **7 and 7**. That is small, and no amount of decimal places changes it. **Leg 4's
projection is a base rate on an unannounced calendar** — no tracked name has published a Q2-2027 date, this
lane may not edit earnings-calendar entries, and 2023 is a live reminder that the pattern breaks (both
mega-caps landed at +6). **Leg 6's 2027 dates are derived from a rule this session showed to be wrong 4 of 13
times**; the conclusion survives only because the margin is a week and the failure modes are ±1 week.
**The meeting parse is a parse, not a census:** 167 meetings were recovered from the Board's own pages, and
2020's unscheduled March meetings are absent — none sits in a July window. And the whole document rests on
**six meetings that have not happened** (2026-09-16, 2026-10-28, 2026-12-09, 2027-01-27, 2027-03-17,
2027-04-28), plus the **2027-06-08/09** meeting that turns this gate's date from tentative into real.

## Stance & kill switches

**Stance (date `estimate`; every trading-adjacent statement below carries that label).** The July 2027 blackout
is the **seventh distinct shape** in this family, and the first whose contribution is to **relocate a sibling's
variable** rather than reverse its sign. The window is **2027-07-17 → 2027-07-29**, established three
independent ways this session — the footnote's worked example, the arithmetic, and the Board's own grid shading
decoded here and validated against all eight 2026 windows including the confirmed one. **May's ordering rule is
refused, with a cause:** the overhang premium is a property of meetings that publish an **SEP** (1.65× over/post,
49 of 72) rather than of months (no-SEP: 0.94×, 33 of 77; z = 3.09, p = 0.002; SEP higher in 7 of the 8 months
that carry both types). July has never published one, and measures **1.02×**, **5 of 14**. **September's
no-short-vol rule is also refused, not deferred:** no top-tier US macro print is inside this gate — the derived
June-2027 and July-2027 employment reports land 11 sessions before and 5 sessions after it, on a derivation
this session validated against BLS's own published schedule at 9 of 13 with all four misses named.

**What survives is a pair of sessions, at one layer.** **2027-07-29** — the gate's last day — is projected to
carry **AAPL and AMZN** (at least one of them printed on it in 5 of the last 6 July gates, both in 4, the last
three consecutively; MSFT and META print on the decision day or the one before; 5 of the 9 tracked names have
printed inside the gate each of the last three years). In the seven July gates where that happened a tracked
name moved **≥4%** on that session in **5 of 7** against 2 of 7 when neither printed, with the book at
**3.070%** mean / **1.860%** median per name against **1.371% / 1.333%** — while the **index ran 0.756%, below
its own 0.676% baseline, and out-moved the post-gate session in 1 of 7**. Two qualifications are carried in the
stance rather than in a footnote: **the mean ratio is tail-driven** (2.24× on means, **1.40×** on medians; 2016
and 2021 came in below the book baseline anyway), which is why the count is the statistic the forward test uses;
and **the session behind it is just as large** (2.702% / 2.863%), so the output is *two* single-name event
sessions with **no ordering between them** — not a July version of May's rule. It also **corrects the proposing
entry**, which placed both mega-caps on 2027-07-30, outside the gate. **No directional call, no size,
`symbols: []`.**

**Kill switches:**

- **Date kill:** the **2027-06-08/09** meeting confirming a 2027 calendar whose July meeting is not **Jul
  27–28**, or federalreserve.gov publishing different 2027 dates. Every date here re-derives, including the
  07-16 deadline and the 07-29 overhang. Score by **2027-06-10**.
- **Promotion trigger (the inverse):** the 06-08/09 meeting confirming Jul 27–28. The entry flips `estimate` →
  `confirmed` with a `FED:` prefix at the next pulse; nothing else in the stance moves.
- **Ordering kill (the headline refusal):** the **2027-07-29** session printing a *larger* absolute S&P
  close-to-close move than **2027-07-30**. Leg 3's SEP framing fails on the one date it is applied to and May's
  month-based rule turns out to transfer after all. Registered as **FT-fomc-blackout-start-2027-07-17-1**, score
  by **2027-08-02**.
- **Projection kill:** the tracked names' Q2-2027 calendars, once announced, putting **neither** AAPL nor AMZN
  on **2027-07-29**. Leg 4's base rate loses its subject and leg 5's sizing observation has nothing to apply
  to. Registered as **FT-fomc-blackout-start-2027-07-17-2**, score by **2027-07-30**; re-check each pulse from
  ~June 2027, when Q2 dates start being announced.
- **Sizing kill:** **no** tracked name moving 4% or more (absolute close-to-close) on **2027-07-29**. Leg 5's
  surviving claim — "an event session for single names" — fails on its own test day. The count is the test
  rather than the mean, because the mean is tail-driven (2.24× on means, 1.40× on medians). Registered as
  **FT-fomc-blackout-start-2027-07-17-3**, score by **2027-08-02**.
- **SEP-premise kill (a slower one):** the next four SEP gates' overhangs *not* out-moving their post-gate
  sessions at better than the no-SEP rate. Leg 3's split is then a sample artifact of the 2007–2026 window.
  Re-check at each blackout ledger in the family rather than on a single date.
- **Decode kill:** the Board republishing its blackout calendar with a 2027 grid that does not shade **Jul 17 –
  Jul 29**. Leg 1's three-way agreement collapses to arithmetic alone — which gives the same window, so this
  degrades provenance without changing the date. Re-check each pulse.
- **Trapped-print kill (the inverse of leg 6):** BLS publishing a 2027 schedule that dates *any* Employment
  Situation or CPI release inside **2027-07-17 → 2027-07-29**. September's refused rule comes back onto the
  table. Re-check each pulse — the promotion path is a *publication* (`bls.gov/schedule/2027/home.htm` going
  from 404 to 200), not a date.
- **Channel kill:** any FOMC participant making on-record monetary-policy remarks between **2027-07-17** and
  **2027-07-29**, other than the 07-28 statement and presser. The gate is more porous than the rule implies and
  both the deadline and leg 3's framing weaken.
- **Vol-premise kill:** VIX above ~20 before **2027-07-17**. Leg 5's sizing observation assumes single-name
  volatility is not already repriced going into the print cluster.
- **Relevance kill:** hike odds falling below ~40%, or cut odds moving off 0%, before **2027-07-17** — the
  two-sidedness that makes a closed interpretation channel matter goes away.

**Three forward tests registered** in
[`forward-tests/fomc-blackout-start-2027-07-17.md`](../forward-tests/fomc-blackout-start-2027-07-17.md) —
**-1** (the refusal: the 07-29 overhang does *not* out-move the 07-30 post-gate session, base rate 5 of 14
disclosed, score by 2027-08-02), **-2** (the projection: both AAPL and AMZN file 8-K Item 2.02 on 2027-07-29,
base rate 4 of 6 for both / 5 of 6 for either, score by 2027-07-30) and **-3** (the sizing claim: at least one
tracked name moves ≥4% on 2027-07-29, base rate 5 of 7 conditional / 7 of 14 unconditional, score by
2027-08-02). No price-direction
test is registered: `symbols: []`, the stance takes no position, and a sizing observation is not a directional
prediction. **No calendar entry is proposed** — the corridor's two dated items are already tracked, the
derived BLS dates fall outside the gate and rest on an unpublished 2027 schedule, and the 2027-07-29 mega-cap
date is a base-rate projection on an unannounced calendar, which is a forward test's job rather than a
calendar entry's.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-06 | D-314 | Initial research banked (above). **Window established three ways today (leg 1):** blackout PDF re-downloaded (HTTP 200, 98,013 bytes), 60 of 122 streams inflated, footnote re-extracted verbatim → Jul 27 is a **Tuesday** → gate opens **Sat 2027-07-17**; Jul 28 a **Wednesday** → closes end of **Thu 2027-07-29**. **The 2027 grid shading was DECODED this session** (38 grey-`0.851` rects, 104 day glyphs, eight 13-day windows) and **validated first on the 2026 page**, where it returns all eight known windows incl. the **confirmed** 09-05→09-17. The footnote applied to all sixteen 2026–27 meetings reproduces every blackout entry this calendar carries. Gate holds **9** sessions, no holiday (July 4 2027 is a Sunday, observed 07-05, before the window). **Status stays `estimate` (leg 2)** — firm rule on a tentative meeting; trigger is **2027-06-08/09** (`fomccalendars.htm` re-fetched, HTTP 200, 164,831 bytes; `July 27-28` carries **no SEP asterisk**). **Headline (leg 3), measured today from `^GSPC` bars across 149 windows 2007–2026 ex-2020, gates derived from the footnote applied to 167 parsed meetings: THE OVERHANG PREMIUM IS A PROPERTY OF THE SEP, NOT OF THE MONTH — SO MAY'S JUNE RULE DOES NOT TRANSFER.** SEP meetings: over/post **1.65×**, overhang larger in **49 of 72 (68%)**. No-SEP: **0.94×**, **33 of 77 (43%)**. Two-proportion **z = 3.09, p = 0.002**. July (always no-SEP): dec **0.589%**, over **0.810%**, post **0.797%**, base 0.676% → **1.02×**, **5 of 14**. **Within-month control** (calendar held fixed) has SEP ahead in **7 of 8** months — Jan 4/5 vs 6/14 · Mar 9/13 vs 3/6 · Apr 3/5 vs 2/8 · Jun 13/18 vs 0/1 · Sep 9/13 vs 3/5 · Oct 2/2 vs 4/8 · Nov 3/3 vs 3/5 — **December reverses (6/13 vs 3/5)** and is reported. **May's numbers reproduce:** June dec **0.522%** and post **0.413%** exactly; its overhang comes back **1.086%** vs its reported 1.145%, the difference traced to June 2025's gate closing on Juneteenth. **Leg 4, the gate's own event, from SEC 8-K Item 2.02 dates pulled cold (caches busted first): AAPL OR AMZN PRINTED ON THE GATE'S LAST IN-GATE SESSION IN 5 OF THE LAST 6 JULY GATES** (both in 4; the last three consecutively; 2023 the exception at +6). META prints on the decision day in **9 of 11**; **59** tracked-name prints fall inside the fifteen July gates 2012–26 against **0** on the first post-gate session; **5 of 9** names inside the gate in each of 2024/25/26. Projected onto 2027 (dec Wed 07-28, gate closes Thu 07-29) that puts **AAPL and AMZN on 2027-07-29, inside the gate** — **correcting [`consumer-confidence-2027-07-27`](consumer-confidence-2027-07-27.md)'s own note**, which placed them on 07-30; the July CB print is that month's last Tuesday (07-27) and +2 sessions is **Thursday 07-29**. **Leg 5, the size, the layer it exists at, and what the mean hides:** in the 7 July gates with a mega-cap on the overhang the book (9 names) ran **3.070% mean / 1.860% median** vs **1.371% / 1.333%** when neither did — **2.24× on means but only 1.40× on medians** (2026 alone contributes 7.83%; 2016 and 2021 came in below the 1.596% book baseline anyway), so **the count is the robust statistic: a name ≥4% in 5 of 7 vs 2 of 7**. Meanwhile the **index ran 0.756%, BELOW its 0.676% baseline, out-moving the post-gate session 1 of 7**, and the **post-gate session is just as large for the book (2.702% / 2.863%)** — the cluster runs two days, so this is **two** single-name event sessions with **no ordering between them**, not a July version of May's rule. Single-name dispersion, not index level. Re-reads [January](fomc-blackout-start-2027-01-16.md)'s 2.87% rule as conditional on *who prints that day*, false in 7 of 14 July years. **Leg 6, and it upgrades a family method:** `bls.gov/schedule/news_release/empsit.htm` returned **HTTP 200** here (55,578 bytes) where the May sibling met 403, so the family's reference-week derivation was tested against BLS's published dates for the first time — **9 of 13 match**, misses all named (Nov/Dec-2025 shutdown schedule, Jan-2026 benchmark revision, Jun-2026 published 07-02 vs derived 07-03 for the observed Independence Day). Derived 2027: June report **2027-07-02**, July report **2027-08-06** — **11 sessions before and 5 after the gate**, so **no top-tier print is trapped inside** and September's no-short-vol rule is **refused outright, not deferred**. `bls.gov/schedule/2027/home.htm` **404** — not published, a dated answer rather than a block, so `blocked` stays empty. **Adjacency sweep — peers:** n/a, `symbols: []`. **Macro:** no print since the sibling rows; anchors unchanged (target **3.50–3.75%**, guidance abolished 2026-08-28). **Volatility:** VIX **14.53**, S&P **7,718.60** (2026-09-04 closes, fetched today) vs 14.53 in [`fomc-blackout-start-2027-05-29`](fomc-blackout-start-2027-05-29.md) — **no regime shift**; probe baseline set with real readings. Boundary behaviour: VIX **−0.08% / +1.96% / +0.25%** across decision / overhang / post-gate in July, vs June **−2.20% / +2.30% / +0.21%** — a comparable vol bid **without** June's index-return premium, consistent with leg 5 and against buying index vol here. **Geopolitical:** none touching a `symbols: []` gate. **Corridor / event tape (leg 7):** ±5 days of 2027-07-17 holds **nothing** — `adjacentIds` is genuinely empty. Inside the window: [`consumer-confidence-2027-07-27`](consumer-confidence-2027-07-27.md) (est, medium, 10:00 ET on decision day one, measured null 0 of 9 by its own ledger) and `fomc-2027-07-28` (est, high), a sibling lane's proposal being researched in its own session now. **No calendar entry proposed and no file written that this lane does not own.** Sample caveat, stated because it bounds everything above: **a July FOMC meeting did not exist before 2012** — 2007–2011 the summer meeting sat in August — so July carries **14** observations against June's 19, and leg 5's split runs on 7 and 7. **Three forward tests registered: -1** (07-29 does NOT out-move 07-30, score 2027-08-02), **-2** (AAPL and AMZN both file on 2027-07-29, score 2027-07-30), **-3** (at least one tracked name moves ≥4% on 07-29, base rate 5 of 7 conditional / 7 of 14 unconditional, score 2027-08-02). | — (stance set: **June's rule refused, relocated to the SEP** — 1.65× vs 0.94×, z = 3.09, 7 of 8 months on the within-month control; **September's rule refused outright** — no top-tier print inside, on a derivation validated 9 of 13 against BLS's own schedule; what survives is a **single-name sizing observation across 2027-07-29 and 07-30**, a name ≥4% in 5 of 7 vs 2 of 7, explicitly **not** an index call and explicitly **not** an ordering one; the proposing entry's 07-30 mega-cap date **corrected to 07-29**; no direction, no size) | 2026-09-27 (medium, 31+d band: every 21d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-fomc-blackout-start-2027-07-17.json` (`status: "estimate"`) in
the same PR — your own file, never another event's canonical one (#1717). Close-out fills `## Outcome` below
from re-run instrument data (cache busted first), never from memory — after which this doc goes quiet.
