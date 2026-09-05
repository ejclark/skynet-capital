# FOMC communications blackout begins (through 2027-03-18) — fomc-blackout-start-2027-03-06

**Kind:** macro-print · **Date:** 2027-03-06 (estimate, EST: federalreserve.gov "2025–2027 FOMC Trading and External Communications Blackout Calendar" PDF — re-downloaded and its content streams inflated in-session 2026-09-05, the footnote's own worked example applied to a Tuesday Mar 16 start; still `estimate` because the underlying Mar 16–17 meeting is tentative until the 2027-01-27 meeting confirms it) · **Impact:** medium
**Last assessed:** 2026-09-05
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"medium:31+","adjacentIds":["nerc-computational-load-phase-ii-workplan-2027-03-01"],"screenStreak":0} -->

## At a glance

**TL;DR.** **This is the first gate in the family whose headline is a refusal, and the refusal is
measured rather than argued.** The blackout runs Saturday **2027-03-06** through Thursday
**2027-03-18**, so — like November's and January's — it outlives the decision by a full session. The
[January sibling](fomc-blackout-start-2027-01-16.md) turned that geometry into a sizing rule, because
January's overhang sits inside this book's Q4 earnings cluster. **March's does not, and the tape says
so.** Measured this session from daily bars across the nine tracked names over the seven prior years
the March FOMC fell two sessions before triple witching, the gate's final session ran **1.26%** mean
absolute move per name against a **1.68%** March baseline (ex-2020), with **1 of 7** years carrying a
name past 4% — against January's **2.87% vs 1.82%** and **6 of 8**. It is a *quieter* than average
session, not an event-sized one. Two further findings fall out. **The gate boundary is not a
volatility boundary:** [`fomc-2027-03-17`](fomc-2027-03-17.md) measured the decision→expiry window at
**1.10%** mean absolute S&P move; split at the blackout's edge it is **0.64%** (last in-gate session)
and **0.61%** (first post-gate session) — two ordinary sessions compounding, both *below* the 0.79%
March S&P baseline, and the Fed being muted through one of them makes no measurable difference. And
**the deadline is sharper than a date:** the last legal Fed voice is the **2027-03-05** close, which
by BLS's own reference-week rule is February payrolls day itself. Date stays **`estimate`**. **No
directional call.**

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-182) | **Stand aside** — nothing to trade | High | A gate has no issuer and prints no number; it changes who may speak, not what anything is worth, and `symbols: []` | An FOMC participant making on-record monetary-policy remarks on or after **2027-03-06**, which would mean the gate is not the constraint this doc rests on |
| This week | **No action here — this week's load is the 2026-09-16 FOMC and its SEP** | High | A D-182 gate on an `estimate` date cannot compete with an SEP meeting 11 days out, and that SEP is an input to the meeting this gate wraps | Nothing at this distance; the first input that could move this is the **2026-09-16** SEP |
| This month | **Watch BLS, not the Fed** — the one fact this gate turns on is whether February payrolls prints **2027-03-05**, the last session before the gate opens | Medium | Derived from BLS's own reference-week rule because `bls.gov/schedule/2027/home.htm` **403s** to this runner; the same derivation put payrolls on the last pre-gate session in **6 of 7** prior two-sessions-before years | BLS publishing a 2027 schedule that dates the February employment report anywhere other than **2027-03-05** |
| This quarter | **Do not carry January's overhang sizing rule into March** (`estimate` — a planning refusal, never an entry) | Medium | Measured: the March gate's final session runs **1.26%** mean \|move\| per tracked name against a **1.68%** March baseline, **1 of 7** years with a name past 4% — where January's ran **2.87%** vs **1.82%** with **6 of 8** | The **2027-03-18** session printing a book-wide mean absolute move **above 1.68%** with at least one tracked name past **4%** |

**Signals & conditions** — the buy/sell/hold triggers:

- **The deadline, and it is sharper than a date** — the gate opens 12:00 a.m. ET Saturday **2027-03-06**, so the last legal Fed voice is the **Friday 2027-03-05** close, which by BLS's own rule is **February payrolls day**. Any Fed reaction to that print is intraday or nothing until **2027-03-19**.
- **The one rule this doc adds is a refusal** — **do not** size **2027-03-18** as an event session the way [January](fomc-blackout-start-2027-01-16.md) sizes 2027-01-28. Same geometry, opposite contents: no earnings cluster, and the measured session is *below* its own March baseline.
- **The gate boundary is not a volatility boundary** — last in-gate session **0.64%**, first post-gate session **0.61%** (S&P, n=7). Muting the Fed for one of the two carries no measurable size premium.
- **Read the sibling's 1.10% correctly** — [`fomc-2027-03-17`](fomc-2027-03-17.md)'s decision→expiry number is a **two-session cumulative** move made of two below-baseline sessions, not one large one. Its single-event-window framing survives for **attribution**; it does not survive as a **sizing** claim.
- **What actually fills this corridor is foreign and mechanical, not US macro** — BoJ decision on the gate's **last day** ([`boj-decision-2027-03-18`](boj-decision-2027-03-18.md), estimate), Japan February CPI plus US quarterly triple witching on the **first day the Fed may speak again** ([`japan-cpi-2027-03-19`](japan-cpi-2027-03-19.md) / [`opex-2027-03-19`](opex-2027-03-19.md), estimate), the Select Sector rebalance reference close inside it ([`sp-rebalance-reference-close-2027-03-12`](sp-rebalance-reference-close-2027-03-12.md), estimate), and the March VIX/VXM expiration AM-settling on the decision's own morning ([`vix-expiration-2027-03-17`](vix-expiration-2027-03-17.md), now **confirmed**).
- **Never** — treat the gate itself as an entry signal, or buy index vol as its hedge; on this chair's one clean measurement Fed risk landed in the front end ([`fomc-2027-03-17`](fomc-2027-03-17.md) leg 7: 2y +14bp vs 30y +6bp).
- **Explicitly refused** — September's blanket no-short-vol window (its subject was US macro data trapped inside the gate; this gate's sourceable content is not US macro), October's empty-corridor read (false here — five tracked entries sit inside), November's CPI-in-the-overhang rule (the overhang's dated content here is the **BoJ**, not a US print), and January's overhang sizing rule (measured false above).
- **Watch (dated)** — FOMC + SEP **2026-09-16** · FOMC **2026-10-28** · FOMC + final 2026 dots **2026-12-09** · **FOMC 2027-01-27** (the confirmation trigger) · February payrolls **2027-03-05** (derived) · gate opens **2027-03-06** · rebalance reference close **2027-03-12** · VIX/VXM settlement 09:00 ET **2027-03-17** · decision + first 2027 SEP **2027-03-17** · **BoJ 2027-03-18, inside the gate's last day** · gate lifts end of **2027-03-18** · first legal Fed voice **2027-03-19**, into triple witching and Japan CPI.
- **Relevance kill** — hike odds below ~40% or cut odds off 0% before **2027-03-06**: the two-sidedness that makes a closed interpretation channel matter goes away.

## Initial research

### The question, plainly

Four blackout ledgers precede this one and they reached four different conclusions —
[September](fomc-blackout-start-2026-09-05.md) called a no-short-vol window because top-tier US data
was trapped inside the gate, [October](fomc-blackout-start-2026-10-17.md) refused that rule because
every October print landed in the 72 hours *before* the gate,
[November](fomc-blackout-start-2026-11-28.md) found the gate outlives the decision by a session with
the November CPI in that overhang, and [January](fomc-blackout-start-2027-01-16.md) found the same
geometry filled with this book's Q4 earnings and turned it into a **sizing rule** for one session.
The decision this gate wraps, [`fomc-2027-03-17`](fomc-2027-03-17.md), already owns the corridor, the
dot-plot format and the Kalshi book. So the question is narrow: **which of the four shapes is March
2027, and what does the gate add that the decision ledger does not already own?**

**One-line verdict.** None of the four transfers, and this is the first of the family whose
contribution is a **measured refusal**. January's geometry recurs exactly — the gate outlives the
decision by a session — but its *contents* do not, and the tape says the March overhang is a quieter
than average session rather than an event-sized one. What the gate adds instead is a **deadline that
coincides with February payrolls** and a **negative result about its own boundary**: the last in-gate
session and the first post-gate session are the same size, so muting the Fed buys no measurable
variance. Date `estimate`; no directional call, no size.

### Method

Macro-print mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — `symbols: []` on the
event itself, so no symbol-keyed instrument applies and the cache-busting rule has no target; its
analog (*re-source, don't recall*) was honoured throughout, including re-deriving the sibling's
published numbers from raw bars rather than quoting them.

**Primaries fetched and parsed directly today (2026-09-05):**
`federalreserve.gov/monetarypolicy/files/fomc-blackout-period-calendar.pdf` (HTTP 200, 98,013 bytes;
60 content streams inflated in-session, the 2027 page located by its `JANUARY 2027 / FEBRUARY 2027 /
MARCH 2027` headings and the footnote re-extracted verbatim);
`federalreserve.gov/monetarypolicy/fomccalendars.htm` (HTTP 200, 164,831 bytes).
**Negative checks re-run today, not inherited:** `bls.gov/schedule/2027/home.htm` **403**,
`bls.gov/schedule/news_release/2027_sched.htm` **403**, `bls.gov/schedule/news_release/cpi.htm`
**403**, `federalreserve.gov/newsevents/2027-march.htm` **404**, `bea.gov/news/schedule` **200** but
still ending at 2026-12-23.

**Price work is this session's own, computed locally from Yahoo daily bars** (`^GSPC` and `^VIX`
through 2026-09-04, plus NVDA MRVL AVGO CRWV MSFT GOOG META AAPL AMZN): every March FOMC decision
day 2015–2026, every March triple-witching date, every blackout window derived from the footnote
rule, and every decision / overhang / expiry session return. Siblings
[`fomc-2027-03-17`](fomc-2027-03-17.md), [`fomc-blackout-start-2027-01-16`](fomc-blackout-start-2027-01-16.md),
[`fomc-blackout-start-2026-11-28`](fomc-blackout-start-2026-11-28.md),
[`fomc-blackout-start-2026-10-17`](fomc-blackout-start-2026-10-17.md),
[`fomc-blackout-start-2026-09-05`](fomc-blackout-start-2026-09-05.md) and
[`boj-decision-2027-03-18`](boj-decision-2027-03-18.md) are read as inputs and cited, never silently
restated. Genre model: [`nvda-aug-2026-print.md`](../nvda-aug-2026-print.md).

### Conviction legs, tested

1. **The window is 2027-03-06 → 2027-03-18, from the source's own worked example, re-extracted this
   session.** SUPPORTED. The Board's PDF, downloaded and its 60 content streams inflated today, is
   titled **"2025-2027 FOMC Trading and External Communications Blackout Calendar"** and its 2027
   page carries `JANUARY 2027`, `FEBRUARY 2027` and `MARCH 2027` grids. Its footnote reads verbatim:
   *"The blackout period will begin at 12:00 a.m. Eastern Time the second Saturday before a meeting
   and end at 11:59 p.m. Eastern Time the day after a meeting. For example, if the Committee meeting
   starts on a Tuesday, the blackout period will begin at the start of the Saturday that falls ten
   days earlier, and if the meeting ends on a Wednesday, the blackout period will end at the end of
   Thursday."* Mar 16 2027 is a **Tuesday** → the gate opens **Saturday 2027-03-06**; Mar 17 is a
   **Wednesday** → it closes at the end of **Thursday 2027-03-18**. No inference of ours sits between
   the source and the dates. **Independent corroboration, not re-done here:**
   [`fomc-blackout-start-2027-01-16`](fomc-blackout-start-2027-01-16.md) leg 9 decoded this PDF's
   vector grid shading and returned all eight 2027 windows, of which the second is **Mar 6–18**.
   *Disclosed rather than claimed:* this session attempted its own re-decode of that shading and
   **failed** — see Honest limits.

2. **The date stays `estimate`, and the trigger is a date rather than a better fetch.** SUPPORTED.
   `fomccalendars.htm`, re-fetched today, gives the 2027 panel as `January 26-27 | March 16-17* |
   April 27-28 | …` and states verbatim *"Each meeting date is tentative until confirmed at the
   meeting immediately preceding it."* The blackout rule is firm; the meeting it is applied to is
   not. So the promotion trigger is the **2027-01-27** meeting — the same structure as
   [`fomc-2027-03-17`](fomc-2027-03-17.md) leg 1, and the opposite of
   [`fomc-blackout-start-2026-11-28`](fomc-blackout-start-2026-11-28.md), which flipped to `confirmed`
   because its meeting was already confirmed.

3. **The headline, measured: January's overhang sizing rule does NOT transfer to March.** SUPPORTED,
   and it is this document's contribution. The geometry is identical — the gate's final day is
   **2027-03-18**, a full session after the 03-17 decision. The contents are not. Measured across the
   seven prior years the March FOMC fell two sessions before triple witching (2015, 2016, 2017, 2021,
   2022, 2025, 2026 — the classification is [`fomc-2027-03-17`](fomc-2027-03-17.md) leg 3's, re-derived
   here from the same published dates), mean absolute close-to-close move across the nine tracked
   names on the gate's final session:

   | | Gate's final session (overhang) | March baseline, ex-2020 | Years with ≥1 name ≥4% |
   |---|---|---|---|
   | **March (this gate), n=7** | **1.26%** | **1.68%** (n=1,951 name-sessions) | **1 of 7** |
   | January ([sibling](fomc-blackout-start-2027-01-16.md) leg 3), n=8 | 2.87% | 1.82% | 6 of 8 |

   Per year, the March overhang came in **at or below** its March baseline in **6 of 7**: 2015
   **0.91%** · 2016 **0.92%** · 2017 **0.45%** · 2021 **3.50%** · 2022 **1.12%** · 2025 **0.78%** ·
   2026 **1.15%**. **The single exception is named rather than averaged away:** 2021-03-18 is the
   post-FOMC duration repricing, whose largest tracked-name observation is **−5.3%** and whose cause
   was a long-end move, not a print. The mechanism behind the contrast is calendar arithmetic and it
   is the same arithmetic the January sibling used: this book's names report Q4 in the last week of
   January, and they report nothing in mid-March. **So the defensible claim is a refusal** — the
   overhang here is a *below-average* session, and importing January's rule would be sizing risk that
   the tape does not show.

4. **The gate boundary is not a volatility boundary — a negative result, and it re-reads the sibling's
   headline number.** SUPPORTED. [`fomc-2027-03-17`](fomc-2027-03-17.md) leg 5 measured the S&P's
   decision-close → expiry-close return across the same seven years at mean **+0.03%**, mean absolute
   **1.10%**, and framed 03-17 → 03-19 as one event window. **Reproduced exactly here from raw bars,
   then split at the blackout's own edge** — because the gate closes at the end of 03-18, the first
   of those two sessions is *inside* it and the second is not:

   | Session | Relative to the gate | Mean | Mean \|move\| |
   |---|---|---|---|
   | Decision day (03-17) | inside | +0.69% | **1.08%** |
   | Overhang (03-18) | **inside — Fed muted** | −0.10% | **0.64%** |
   | Expiry (03-19) | **outside — Fed free to speak** | +0.13% | **0.61%** |
   | Decision → expiry, cumulative | spans the boundary | +0.03% | 1.10% |

   Against a **0.79%** S&P March baseline (ex-2020, n=241), **both** sessions are below average, and
   the two are indistinguishable from each other. Two consequences, stated separately because they
   are different claims. *(i)* The sibling's **1.10%** is a **two-session cumulative** figure and
   reads as "as large as the decision day" only against a one-session number — decomposed, it is two
   quiet sessions compounding. Its **attribution** rule survives intact (rule out opex, Japanese CPI
   and two central banks before crediting 03-19 to the Fed); its use as a **sizing** input does not.
   *(ii)* Whether the Fed may speak has **no measurable effect on session size** here: 0.64% muted
   against 0.61% unmuted. That is the cleanest available test of this whole ledger family's implicit
   premise, and on this sample it fails.

5. **The deadline coincides with February payrolls — the one operative fact this gate adds.**
   SUPPORTED as arithmetic, MIXED on sourcing, and disclosed as such. The gate opens 12:00 a.m. ET
   Saturday **2027-03-06**, so the last session on which any FOMC participant may speak is **Friday
   2027-03-05**. BLS's published methodology dates the Employment Situation to the third Friday after
   the end of the reference week (the Sunday–Saturday week containing the 12th). February 2027's
   reference week ends Saturday **2027-02-13**; the third Friday after is **2027-03-05**. Applying
   the same derivation to the seven two-sessions-before years, February payrolls landed **on the last
   pre-gate session in 6 of 7** (2015, 2016, 2021, 2022, 2025, 2026); the exception is **2017**, where
   the gate opened 03-04 and the derived print fell on **03-10 — inside the gate**, which is
   September's geometry rather than this one. **The operative consequence:** in 2027 the Committee's
   last legal word arrives on the same session as the labour-market print it would be reacting to, so
   any Fed response to February payrolls is intraday on 03-05 or does not exist until **2027-03-19**.
   *The sourcing limit is real and load-bearing:* all three BLS schedule endpoints returned **403** to
   this runner today, so **2027-03-05 is derived from a published rule, not read off a schedule** —
   which is why it is registered as a forward test rather than proposed as a calendar entry (leg 7).

6. **The corridor is dense, and its content is foreign and mechanical rather than US macro or
   corporate.** SUPPORTED, inherited and cited rather than re-measured. Computed against the live
   calendar, the gate **2027-03-06 → 2027-03-18** contains
   [`sp-rebalance-reference-close-2027-03-12`](sp-rebalance-reference-close-2027-03-12.md)
   (estimate), [`vix-expiration-2027-03-17`](vix-expiration-2027-03-17.md) (**confirmed**, AM-settling
   and ceasing to trade 09:00 ET — about five hours before the decision),
   [`fomc-2027-03-17`](fomc-2027-03-17.md) itself (estimate), and
   [`boj-decision-2027-03-18`](boj-decision-2027-03-18.md) (estimate) **on the gate's final day**;
   [`japan-cpi-2027-03-19`](japan-cpi-2027-03-19.md) and [`opex-2027-03-19`](opex-2027-03-19.md) (both
   estimate) fall on the **first session the Fed may speak again**. So each of the four prior gates is
   refused for a specific reason: September's blanket rule priced *US macro data* trapped inside a
   gate and this gate's US macro content is unsourceable (leg 5); October's "empty corridor" is plainly
   false with five tracked entries inside; November's rule had a **US** print in the overhang where
   this one has a **foreign central bank**; January's had earnings, measured absent here (leg 3). One
   thing worth stating positively: this is the first gate in the family whose overhang carries a
   *second* central bank's decision, and the BoJ ledger's global-duration channel is the one route by
   which that could matter — a channel [`fomc-2027-03-17`](fomc-2027-03-17.md) leg 9 picked up and
   deliberately discounted as "named but not visible in the data."

7. **Nothing new is proposed to the calendar, and the reason is on the record.** SUPPORTED as a
   decision. The one dated item this session discovered is the **2027-03-05 February employment
   report** (leg 5) — and it is deliberately **not** filed as `src/domain/market-events/*.json`,
   because it is a rule applied to an unreachable primary rather than a date read from one. That is
   the same line [`fomc-blackout-start-2027-01-16`](fomc-blackout-start-2027-01-16.md) leg 5 drew
   ("*a 403 is a bot block, not proof of absence*", no January-2027 data entry proposed) and the same
   line [`fomc-2027-03-17`](fomc-2027-03-17.md) leg 10 drew for that meeting's minutes. It is
   registered as a **forward test** instead, which is the honest home for a derivation with a dated
   falsifier. Within ±5 days of this event's own date the calendar carries exactly one entry,
   [`nerc-computational-load-phase-ii-workplan-2027-03-01`](nerc-computational-load-phase-ii-workplan-2027-03-01.md)
   (low, estimate), which touches nothing here.

8. **Regime and exposure anchors, read today rather than recalled.** SUPPORTED. **VIX 14.53** and
   **S&P 7,718.60** — the 2026-09-04 closes, pulled from Yahoo daily bars this session (today is
   Saturday 2026-09-05). Against [`fomc-2027-03-17`](fomc-2027-03-17.md)'s 14.53 and
   [`fomc-blackout-start-2027-01-16`](fomc-blackout-start-2027-01-16.md)'s 14.43, that is **no regime
   shift**, and the probe baseline below is set with real readings. `symbols: []`; the sensitivity
   ranking and the transmission read are inherited unchanged — target range **3.50–3.75%**, forward
   guidance abolished **2026-08-28**, and Fed risk landing in the front end rather than in equity vol.
   One measured addition on the boundary itself: across the seven years, VIX fell **−0.4%** across the
   in-gate overhang session and a further **−1.6%** across the post-gate expiry session, so the
   volatility complex *bleeds down* through this corridor rather than repricing at the gate's edge —
   consistent with leg 4 and an additional argument against buying index vol as a hedge here.

### What the conditions support (date `estimate` — caution only, never an entry)

**No direction, no size, no level.** Three operative items, and the first of them is a refusal:

- **A refusal.** Do **not** import [January's](fomc-blackout-start-2027-01-16.md) rule and size
  **2027-03-18** as an event session. Measured at **1.26%** per name against a **1.68%** March
  baseline with **1 of 7** years carrying a ≥4% name, the March overhang is a below-average session.
  The geometry that generated January's rule is present; the earnings cluster that gave it force is
  not.
- **A deadline with a specific edge.** Anything depending on a Fed voice resolves by the
  **2027-03-05** close — which is, by BLS's own rule, February payrolls day. There is no Fed reaction
  function available to that print after the close of business, and none returns until **2027-03-19**.
- **A correction to how a sibling's number is used.** [`fomc-2027-03-17`](fomc-2027-03-17.md)'s
  **1.10%** decision→expiry window is two below-baseline sessions compounding (**0.64%** + **0.61%**),
  not one large one. Keep its attribution rule; drop any sizing inference from it.

### Honest limits

**The strongest leg is a negative result, and negative results at n=7 are the easiest thing in this
document to over-read.** Leg 3's 6-of-7 base rate spans four chairs, and its single exception (2021)
is a full 3.50% — so "below baseline" describes the central tendency of a small sample, not a
guarantee about 2027-03-18, and CRWV contributes one observation. Leg 4's 0.64%-vs-0.61% comparison
is the cleanest test here and also the least powerful: two means 0.03 points apart at n=7 would fail
to distinguish a real effect from none, so the honest statement is "no measurable difference," never
"no difference." Leg 5's date is **derived, not sourced** — every BLS endpoint 403'd, the reference-week
rule was applied by this session rather than read off a schedule, and the 6-of-7 historical check
validates the rule against *gate arithmetic* rather than against published release dates, which is
weaker corroboration than it may read as. Leg 1's window rests on the footnote's worked example,
which is exact; **this session's attempt to independently re-decode the PDF's grid shading failed** —
the decoder returned the right glyph count (365 day numbers on the 2027 page) and 38 grey `0.851`
rectangles, but its text-matrix composition drifted horizontally on wrapped rows, so its cell
hit-testing is not trustworthy and none of its output is used here. The corroboration therefore
remains the January sibling's decode, inherited rather than reproduced. Leg 6 is entirely inherited
from sibling ledgers, several of which are themselves `estimate`. And the whole document rests on
**four meetings that have not happened** (2026-09-16, 2026-10-28, 2026-12-09, 2027-01-27), the last
of which is what turns this gate's date from tentative into real.

## Stance & kill switches

**Stance (date `estimate`; every trading-adjacent statement below carries that label).** The March
2027 blackout is the **fifth distinct shape** in this family and the first whose contribution is a
**measured refusal**. Its geometry is January's — the gate opens 12:00 a.m. ET Saturday **2027-03-06**
and closes at the end of Thursday **2027-03-18**, outliving the 03-17 decision by a full session — but
its contents are not, and the difference is measurable: the gate's final session runs **1.26%** mean
absolute move per tracked name against a **1.68%** ex-2020 March baseline, coming in at or below that
baseline in **6 of 7** prior two-sessions-before years, with **1 of 7** carrying a name past 4%.
January's figures were **2.87%** against **1.82%** with **6 of 8**. **So the deployable output is
"don't"**: do not size 2027-03-18 as an event session.

Two further positions, neither of them positional. **The gate's boundary is not a volatility
boundary.** [`fomc-2027-03-17`](fomc-2027-03-17.md)'s **1.10%** decision→expiry window, reproduced
from raw bars and split at the blackout's own edge, is **0.64%** (in-gate overhang) plus **0.61%**
(post-gate expiry) — both below the **0.79%** March S&P baseline and indistinguishable from each
other. Its attribution rule survives; its use as a sizing input does not, and "the Fed is muted"
buys no measurable variance on this sample. **And the deadline is sharper than a date:** the last
legal Fed voice is the **2027-03-05** close, which by BLS's own reference-week rule is February
payrolls day, so any Fed response to that print is intraday or nothing until **2027-03-19** — with
the caveat, stated in the call itself, that every BLS schedule endpoint **403s** and the date is
derived rather than read. September's blanket no-short-vol rule, October's empty-corridor read,
November's CPI-in-the-overhang rule and January's overhang sizing rule are **all four explicitly
refused**, each for a stated reason. **No directional call, no size, `symbols: []`** — and the one
measured transmission observation for this chair puts Fed risk in the front end, which argues
specifically against buying index volatility as a hedge here.

**Kill switches:**

- **Date kill:** the **2027-01-27** meeting confirming a 2027 calendar whose March meeting is not
  **Mar 16–17**, or federalreserve.gov publishing different 2027 dates. Every date here re-derives,
  including the 03-05 deadline. Score by **2027-01-28**.
- **Promotion trigger (the inverse):** the 01-27 meeting confirming Mar 16–17. The entry flips
  `estimate` → `confirmed` with a `FED:` prefix at the next pulse; nothing else in the stance moves.
- **Refusal kill (the headline):** the **2027-03-18** session printing a book-wide mean absolute move
  **above 1.68%** with at least one tracked name past **4%**. Leg 3's refusal fails on its own test
  day and January's sizing rule turns out to transfer after all. Registered as
  **FT-fomc-blackout-start-2027-03-06-1**, score by **2027-03-19**.
- **Deadline kill:** BLS publishing a 2027 schedule that dates the February employment report anywhere
  other than **2027-03-05**. Leg 5's coincidence dissolves and the deadline reverts to an ordinary
  calendar fact. Registered as **FT-fomc-blackout-start-2027-03-06-2**, score by **2027-03-06**;
  re-check each pulse, since the promotion path here is a *fetch* (bls.gov becoming reachable), not a
  date.
- **Boundary kill:** a **2027-03-18** S&P close-to-close move exceeding **2027-03-19**'s by more than
  1 percentage point in absolute terms. Leg 4's "the boundary is not a boundary" would be describing
  a relationship that does not hold on the one year it is applied to. Re-check at close-out.
- **Corridor kill:** the BoJ moving its 03-18 meeting off the gate's final day, or the March 2027 FOMC
  moving off triple-witching week. Leg 6's "foreign and mechanical" characterisation loses its
  subject and this document reverts to being a duplicate of the decision ledger. Re-check each pulse.
- **Channel kill:** any FOMC participant making on-record monetary-policy remarks between
  **2027-03-06** and **2027-03-18**, other than the 03-17 statement and presser. The gate is more
  porous than the rule implies and both the deadline and leg 4's premise weaken.
- **Vol-premise kill:** VIX above ~20 before **2027-03-06**. The below-baseline reading in leg 3 was
  measured across a sample that includes 2021, 2022 and 2026 at elevated VIX, but the "quiet
  overhang" framing assumes the complex is not already repricing going in.
- **Relevance kill:** hike odds falling below ~40%, or cut odds moving off 0%, before **2027-03-06** —
  the two-sidedness that makes a closed interpretation channel matter goes away and this reverts to
  the ordinary technical it usually is.

**Two forward tests registered** in
[`forward-tests/fomc-blackout-start-2027-03-06.md`](../forward-tests/fomc-blackout-start-2027-03-06.md)
— **-1** (the measured refusal: the 03-18 overhang comes in at or below the March book baseline, base
rate 6 of 7 disclosed, score by 2027-03-19) and **-2** (the derived deadline: BLS dates the February
2027 employment report to 2027-03-05, score by 2027-03-06). No price-direction test is registered:
`symbols: []`, the stance takes no position, and a refusal is not a directional prediction. **No new
calendar entry is proposed**, and leg 7 states why.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-05 | D-182 | Initial research banked (above). **Window re-derived from the primary today (leg 1):** the Board's blackout PDF re-downloaded (HTTP 200, 98,013 bytes), 60 content streams inflated in-session, 2027 page located by its `JANUARY/FEBRUARY/MARCH 2027` grids, footnote re-extracted verbatim — Mar 16 is a **Tuesday** → gate opens **Sat 2027-03-06**; Mar 17 a **Wednesday** → closes end of **Thu 2027-03-18**. Matches the decoded shading [`fomc-blackout-start-2027-01-16`](fomc-blackout-start-2027-01-16.md) leg 9 banked (**Mar 6–18**). **Status stays `estimate` (leg 2)** — firm rule on a tentative meeting; trigger is the **2027-01-27** meeting. **Headline (leg 3), measured today from Yahoo daily bars across NVDA MRVL AVGO CRWV MSFT GOOG META AAPL AMZN over the seven prior two-sessions-before years (2015/16/17/21/22/25/26): JANUARY'S OVERHANG SIZING RULE DOES NOT TRANSFER.** Gate's final session **1.26%** mean \|move\| per name vs a **1.68%** ex-2020 March baseline (n=1,951 name-sessions), **1 of 7** years with a name ≥4% — against January's **2.87%** vs **1.82%** and **6 of 8**. Per year: 0.91 / 0.92 / 0.45 / **3.50** / 1.12 / 0.78 / 1.15% → **6 of 7 at or below baseline**; the exception (2021-03-18, max name −5.3%) is the post-FOMC duration repricing, named not averaged away. Mechanism is the same calendar arithmetic January used, inverted: this book reports Q4 in late January and nothing in mid-March. **Leg 4, a negative result that re-reads the sibling's number:** [`fomc-2027-03-17`](fomc-2027-03-17.md) leg 5's decision→expiry window (mean +0.03%, \|move\| **1.10%**) reproduced exactly from raw bars, then **split at the blackout's own edge** — decision day **1.08%**, overhang 03-18 **0.64%** (in-gate, Fed muted), expiry 03-19 **0.61%** (post-gate, Fed free), against a **0.79%** ex-2020 S&P March baseline. Both below baseline and indistinguishable from each other, so the 1.10% is **two quiet sessions compounding**, not one large one: the sibling's **attribution** rule survives, its use as a **sizing** input does not, and "the Fed is muted" buys **no measurable variance**. **Leg 5, the one operative addition: the deadline coincides with February payrolls.** Gate opens 12:00 a.m. ET Sat 03-06 → last legal Fed voice is the **Fri 2027-03-05** close; BLS's own reference-week rule (third Friday after the Sun–Sat week containing the 12th; Feb 2027's ends 02-13) gives **2027-03-05**. Same derivation put payrolls on the last pre-gate session in **6 of 7** prior years — the exception is **2017**, where it fell **inside** the gate (September's geometry). **Sourcing limit stated in the leg: derived, not read** — `bls.gov/schedule/2027/home.htm`, `.../news_release/2027_sched.htm` and `.../news_release/cpi.htm` all **403** today. **Adjacency sweep — peers:** n/a, `symbols: []`. **Macro:** no print since the sibling rows; anchors unchanged (target **3.50–3.75%**, guidance abolished 2026-08-28). **Volatility:** VIX **14.53**, S&P **7,718.60** (2026-09-04 closes, Yahoo, fetched today) vs 14.53 ([`fomc-2027-03-17`](fomc-2027-03-17.md)) and 14.43 ([`fomc-blackout-start-2027-01-16`](fomc-blackout-start-2027-01-16.md)) — **no regime shift**; probe baseline set with real readings. Measured on the boundary: VIX **−0.4%** across the in-gate overhang and a further **−1.6%** across the post-gate expiry — the complex bleeds down through the corridor rather than repricing at the gate's edge. **Geopolitical:** the BoJ ledger's global-duration channel, inherited via [`fomc-2027-03-17`](fomc-2027-03-17.md) leg 9 and given no weight there or here. **Corridor / event tape (leg 6):** the gate contains [`sp-rebalance-reference-close-2027-03-12`](sp-rebalance-reference-close-2027-03-12.md) (est), [`vix-expiration-2027-03-17`](vix-expiration-2027-03-17.md) (**confirmed**, AM-settles 09:00 ET ~5h before the decision), [`fomc-2027-03-17`](fomc-2027-03-17.md) (est) and **[`boj-decision-2027-03-18`](boj-decision-2027-03-18.md) (est) on the gate's final day**; [`japan-cpi-2027-03-19`](japan-cpi-2027-03-19.md) and [`opex-2027-03-19`](opex-2027-03-19.md) (both est) land on the **first session the Fed may speak again**. All four prior gates explicitly refused, each with a reason. Within ±5 days of 03-06 the calendar carries only [`nerc-computational-load-phase-ii-workplan-2027-03-01`](nerc-computational-load-phase-ii-workplan-2027-03-01.md) (low, est). **No new calendar entry proposed, reason on the record (leg 7):** the 2027-03-05 payrolls date is a rule applied to an unreachable primary, so it is registered as a forward test instead — the same line the January sibling drew for its own macro corridor. **Own weakness, disclosed (Honest limits):** this session attempted its own re-decode of the PDF's grid shading and **failed** — right glyph count (365) and 38 grey `0.851` rectangles, but the text-matrix composition drifted on wrapped rows, so no decoder output is used and leg 1's corroboration remains inherited. **Two forward tests registered: FT-fomc-blackout-start-2027-03-06-1** (the refusal, score 2027-03-19) and **-2** (the derived payrolls date, score 2027-03-06). | — (stance set: the deployable output is a **refusal** — do not size **2027-03-18** as an event session, measured 1.26% vs a 1.68% baseline; the gate's boundary is **not** a volatility boundary (0.64% muted vs 0.61% unmuted); the deadline is the **2027-03-05** close, which is derived February payrolls day; no direction, no size) | 2026-09-26 (medium, 31+d band: every 21d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new `src/domain/market-events/<id>.json`
(`status: "estimate"`) in the same PR. Close-out fills `## Outcome` below from re-run instrument
data (cache busted first), never from memory — after which this doc goes quiet.
