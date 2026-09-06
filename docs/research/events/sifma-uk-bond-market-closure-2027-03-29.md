# UK fixed-income market recommended closed all day for Easter Monday — the US bond market's first full session after Good Friday, run without London — sifma-uk-bond-market-closure-2027-03-29

**Kind:** rates · **Date:** 2027-03-29 (estimate — NEWS: SIFMA `sifma.org/resources/guides-playbooks/holiday-schedule`, **U.K. 2027** panel, re-fetched and re-parsed 2026-09-05; the causing bank holiday independently statutory in `gov.uk/bank-holidays.json`. The `estimate` label is a taxonomy gap and a source non-binding by its own terms — **the `Tentative` count that applies to the co-dated Japan entry does not apply here**) · **Impact:** low
**Last assessed:** 2026-09-05
<!-- probe-ref: {"symbols":{},"vix":14.32,"daysBand":"low:15+","adjacentIds":["boj-minutes-2027-03-24","sifma-bond-early-close-2027-03-25","good-friday-market-closure-2027-03-26","japan-cpi-tokyo-flash-2027-03-26","boj-summary-of-opinions-2027-03-29","ftc-v-amazon-antitrust-trial-2027-03-29","sifma-japan-early-close-2027-03-29","sp-select-sector-secondary-reweight-2027-03-31","japan-food-tax-cut-2027-04-01"],"screenStreak":0} -->

## At a glance

**TL;DR.** **Stand aside — nothing here is tradeable — but this entry is the one on its date with a
tape we actually care about, and it is firmer than its co-dated siblings.** Firmer: the U.K. 2027
card is a **full-closure** card (`Easter Monday` / `Monday, March 29, 2027`, note empty) and it
carries **no `Tentative` flag** — that string is a Japan-panel property, and this date sits in the
half of the U.K. panel that checks out **6 of 6** against `gov.uk`'s statutory list (both of the
panel's errors are in its December block). Ours: the scope line says **"U.S. dollar-denominated"**
paper, so the U.K. panel is **London's session of the *US dollar* bond market — gilts are out of
scope**, and the decisive tell is that the same U.K. panel also closes for **Martin Luther King Day
and Thanksgiving** (no gilt calendar ever would). So the fact on 2027-03-29 is: **the US Treasury
tape trades a full session with London's dollar desks dark**, two sessions after a **full** Good
Friday close. That configuration has recurred **every year since 1990**, and it is measurable on the
Fed's own H.15 series. **Structurally it confirms cleanly:** all **37** Easter Mondays 1990-2026
carry a `DGS10` observation — the US bond tape is open, every time, verified from a Federal Reserve
primary rather than from SIFMA's silence. **Directionally it does not survive its own era test.** The
10y yield rose on **25 of 37** (67.6% vs a 44.4% control base rate, +3.76bp vs +0.01bp, Welch
**t = 2.71**) — but post-2010 that is **t = 1.75, sign z = 0.95, and t = 0.99 once two outliers come
out**, and the 2y does **not** replicate the up-rate (15/37). **Not carried; registered as an
n-generator at Low.** And the one clean cross-lane result is a **negative**: the variance dampening
the [Japan sibling](sifma-japan-early-close-2027-03-29.md) measured in the Tokyo equity bar
(t = −2.86) **does not appear in the US Treasury tape at all** (|Δ10y| t = **0.98**, and 0.19
post-2000). A foreign-desk closure quiets Tokyo's bar; it does nothing measurable to Washington's.
`estimate`, `symbols: []`, `impact: low`, both playbook docs grep **0 hits** on a keyword set widened
to `london|ftse|lse|gilt|treasury|fixed income|bank holiday`.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — a non-binding foreign-desk closure recommendation is not a position | High | D-205; `symbols: []`, `impact: low`, and `trade-playbooks.md` + `multi-symbol-sweep.md` grepped this session for `holiday\|jpx\|tokyo\|nikkei\|closure\|jgb\|gilt\|sifma\|easter\|london\|ftse\|lse\|treasury\|fixed income\|bank holiday` return **0 hits in both**; `earnings-calendar.ts` carries **no print after 2026-11-10** | A house playbook keyed to session hours, foreign holidays or fixed income being written and back-tested before **2027-03-29** — the "nothing is calendar-keyed" leg dies and this sheet is rebuilt on measured data |
| This week | **Bank the structural confirmation: the US bond tape is open on this date, from a Fed primary** | High | FRED `DGS10` (H.15, HTTP 200, 268,603 B) has an observation on **37 of 37** Easter Mondays 1990-2026, and SIFMA's **U.S. 2027** panel's only March strings are `Good Friday` / `Friday, March 26, 2027` and its `Thursday, March 25, 2027` early close — **no US card exists for 03-29** | `DGS10` printing **no observation for 2027-03-29**, or SIFMA publishing a US-panel card for that date. Registered as **FT-sifma-uk-bond-market-closure-2027-03-29-2** |
| This month | **Treat the U.K. card as durable — and note that is the opposite call from the co-dated Japan card** | Medium | The U.K. 2027 Easter Monday card's note field is **empty** (full closure), and the `- Tentative – Subject to confirmation by the Bank of Japan` string appears **only** on Japan-panel cards. The U.K. 2027 panel matches `gov.uk`'s statutory England-and-Wales list **6 of 6** for Jan-Aug and misses **both** December substitutes | SIFMA republishing the U.K. 2027 panel with this card removed, re-dated, or changed to `None` before **2027-03-26**. Registered as **FT-sifma-uk-bond-market-closure-2027-03-29-1** |
| This quarter | **Refuse the yield-drift finding at this n and this era decay — record it, do not size it** | Low | 10y signed change on Easter Mondays **+3.76bp, 25/37 up** vs Mar/Apr Mondays **+0.01bp, 44.4% up** (Welch **t = 2.71**, sign **z = 2.84**) — but 1990-1999 alone carries **+7.0bp**, 2010+ is **+2.12bp at t = 1.75 / z = 0.95** and **t = 0.99** ex-outliers, and the 2y up-rate is **15/37**, so the honest shape is a **1990s long-end drift**, not a rule | The **2027-03-29** `DGS10` observation printing **at or below** the prior observation. Registered at **Low** as **FT-sifma-uk-bond-market-closure-2027-03-29-3**, an out-of-sample n-generator, never a sized call |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit, hedge or size is keyed to 2027-03-29. `impact: low`, `symbols: []`,
  date `estimate`, source non-binding by its own terms, and date-keyed action requires `confirmed`.
- **The scope guard, and this lane has a new proof of it.** SIFMA's page, fetched today: *"All SIFMA
  holiday recommendations apply to the trading of **U.S. dollar-denominated** government securities…"*
  The **decisive tell** is inside the U.K. panel itself: it carries `Martin Luther King Day`,
  `Presidents Day`, `Juneteenth`, `U.S. Independence Day`, `Labor Day`, `Columbus Day`,
  `Veterans Day` and `Thanksgiving Day` alongside the UK bank holidays. **A gilt calendar does not
  close for MLK Day.** This is the London session of the **dollar** bond market. **Gilts are out of
  scope and this recommendation closes nothing UK-listed.**
- **The tentative guard, inverted — this card is the firm one.** `- Tentative – Subject to
  confirmation by the Bank of Japan` appears on the co-dated **Japan** card and on every other
  2027 **Japan**-panel card; the U.K. 2027 panel carries the string **nowhere**. Where the Japan
  sibling had to widen caution, this entry does not.
- **But the U.K. panel is not error-free, and the errors have a location.** Against `gov.uk`'s eight
  statutory 2027 England-and-Wales dates the panel is **right on all six** through August
  (01-01, 03-26, **03-29**, 05-03, 05-31, 08-30) and **wrong on both** December substitutes (its
  Christmas card reads `Friday, December 24, 2027` against the statutory **Mon 12-27**; its Boxing
  Day card reads **`None`** against the statutory **Tue 12-28**). It also lists two US holidays on
  their **weekend** dates (`Juneteenth` / `Saturday, June 19, 2027`, `U.S. Independence Day` /
  `Sunday, July 4, 2027`) where the U.S. panel substitutes forward to `Monday, July 5, 2027`.
  **Every observed error is outside this date's block.**
- **The three-region state on 2027-03-29:** **UK fully shut** (this entry) · **Japan a 15:00 JST
  early close, tentative** ([`sifma-japan-early-close-2027-03-29`](sifma-japan-early-close-2027-03-29.md))
  · **US a full session** (no card of any kind). Statutory basis for the cause:
  `gov.uk/bank-holidays.json` lists `2027-03-29 Easter Monday` in **england-and-wales** and
  **northern-ireland** and **not in scotland**.
- **The framing this lane adds: 03-29 is a *reopening*, not just a quiet Monday.** SIFMA's U.S. 2027
  panel recommends a **full** close on Good Friday **03-26** plus a 2:00 p.m. ET early close on
  **03-25**, so 2027-03-29 is the US bond market's **first full session after a three-day weekend,
  conducted with London dark**. H.15 dates that shape historically: **28 of 37** Good Fridays since
  1990 have **no** `DGS10` observation (a full close) and **9 do** (an open, shortened session —
  SIFMA's own 2026 card recommends a `12:00 p.m. Eastern Time` Good Friday early close). **2027 is
  the 28-case shape.**
- **The measured negative, and it is the cleanest thing here.** The dampening the Japan lane found
  in Tokyo equities **does not transfer to US rates**: |Δ10y| on Easter Mondays is **5.22bp** against
  a Mar/Apr-Monday control of **4.01bp** — **Welch t = 0.98**, and **t = 0.19** on 2000+. **No
  variance effect in either direction.** A London closure changes who is at a desk in London; it does
  not measurably change how far the US 10y moves.
- **The directional finding is real in the full sample and dead in the modern one — not carried.**
  10y signed change **+3.76bp**, **25/37 up** (67.6%) vs a 44.4% control base rate (sign **z = 2.84**,
  Welch **t = 2.71**, and **t = 2.59** after trimming the two biggest movers). But **1990-1999 alone
  runs +7.0bp**; **2000+ is t = 2.16 against the month control but only 0.87 against the
  post-long-weekend control**; **2010+ is +2.12bp at t = 1.75, sign z = 0.95, t = 0.99 ex-outliers**.
  And the **2y does not replicate the up-rate** (15/37 up, median 0.0bp) — so what the full sample
  shows is a **long-end drift / mild steepening** (10y−2y **+1.16bp**, 23/37 steepen, t = 2.47),
  concentrated in the high-rate 1990s. **Registered at Low; sized at zero.**
- **Watch (dated):** Wed **03-24** BoJ Minutes · Thu **03-25** SIFMA US bond early close 14:00 ET ·
  Fri **03-26** Good Friday — NYSE, the US bond market and the UK all shut, Tokyo's USD desk fully
  shut, **but JPX trades normally** and the Tokyo CPI flash publishes · Mon **03-29** this
  recommendation + the BoJ Summary of Opinions 08:50 JST + the FTC v. Amazon trial date · Wed
  **03-31** US quarter-end, Japanese fiscal year-end, the S&P Select Sector secondary reweight ·
  Thu **04-01** Japan food-tax cut.

## Initial research

### The question, plainly

This entry was proposed by the [`sifma-japan-early-close-2027-03-29`](sifma-japan-early-close-2027-03-29.md)
lane on 2026-09-05 as **the cause** of the Japan card it was researching, mirroring the accepted
[`sifma-uk-bond-market-closure-2026-12-28`](sifma-uk-bond-market-closure-2026-12-28.md) precedent.
That lane read this date **from Tokyo** — its measurements are all `^N225`, its attribution trap is
the Japanese fiscal year-end, and the UK closure appears in it only as the causing holiday.

So the question this lane owns is the one nobody has asked on this date: **what does a dark London
mean for the tape we would actually trade — the US one?** Plus the two verification duties that come
with any inherited entry: does the card say what the filing says it says, and is the panel it sits in
reliable?

**One-line verdict: the card is real, full-closure, and — unlike its co-dated Japan sibling — not
flagged tentative, sitting in the verified half of a panel whose only errors are in December; the
scope claim now has a decisive new proof (the U.K. panel closes for Martin Luther King Day, so it is
a *dollar* calendar and not a gilt one); and on the US tape the honest result is one confirmation,
one null and one refusal — the bond market is open on every Easter Monday (37/37 from a Fed
primary), a London closure does *not* dampen the US 10y the way it dampens the Tokyo bar (t = 0.98),
and the apparent +3.8bp yield drift is a 1990s artifact that dies post-2010 and is not carried.**

### Method

Macro / market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — no
symbol-keyed instrument applies (`symbols: []`). The instrument caches were busted
(`rm -rf node_modules/.cache/earnings-cycle node_modules/.cache/intraday-edges`) before any pull.
**Nothing was inherited from the proposing lane**: every primary was re-fetched, and the market
measurement was built on a **different data source and a different asset class** from the sibling's
on purpose — it is a US rates study, not a re-run of a Japanese equity one.

- **SIFMA** `sifma.org/resources/guides-playbooks/holiday-schedule` — HTTP 200, **298,926 bytes**,
  matching the byte count both sibling lanes recorded. The 2027 panels live only in the embedded
  Next.js flight payload. **Panel attribution, done positionally rather than by heading proximity:**
  the payload emits each panel's cards as an ordered name→date→note sequence, and the
  `Easter Monday` / `Monday, March 29, 2027` triple at offset ~212450 sits between
  `Good Friday` / `Friday, March 26, 2027` and `May Day` / `Monday, May 3, 2027` inside the block
  that opens `New Year's Day 2026/2027` → `Martin Luther King Day` → `Presidents Day` and closes
  `Boxing Day` / `None` → `New Year's Day 2027/2028`. That is the **U.K. 2027** panel, and its 2026
  counterpart carries the identically-shaped `Easter Monday` / `Monday, April 6, 2026` card. The
  sibling's method correction is re-confirmed: a strict adjacency parse **drops chunk-split triples**,
  so every claim below is a **direct verbatim string search** of the payload.
- **gov.uk** `gov.uk/bank-holidays.json` — HTTP 200, **22,207 bytes**; all three divisions parsed
  for 2027 (8 England-and-Wales dates, 9 Scotland, 10 Northern Ireland), plus its full
  2019→2028 Easter Monday list.
- **Federal Reserve H.15 via FRED** — `fredgraph.csv?id=DGS10` (HTTP 200, **268,603 B**, 1962-01-02
  → 2026-09-03, **9,175** observations in the 1990+ window), `id=DGS2` (HTTP 200, **208,776 B**,
  1976-06-01 →), `id=VIXCLS` (HTTP 200, **161,102 B**, 1990-01-02 →, last close **14.32** on
  2026-09-03). Chosen over the sibling lanes' Yahoo endpoint for two reasons: it is the **primary**
  for the US Treasury tape, and its **observation calendar is itself the US bond market's** — a day
  with no `DGS10` value is a day H.15 collected no quote.
- **Measured, not sourced:** *Easter Monday* = Western (Gregorian) computus Easter Sunday + 1,
  **validated 10/10** against `gov.uk`'s own 2019-2028 Easter Monday list before use; it dates 2027
  Easter Sunday to **2027-03-28** and Easter Monday to **2027-03-29**. *Δ* = the change from the
  previous `DGS10` observation, in basis points. *Control A* = March/April Mondays with an
  observation, Easter Mondays excluded (weekday + month matched). *Control B* = Mondays whose prior
  observation is more than three calendar days earlier and which are not Easter Mondays — the
  **post-long-weekend** control, added because every Easter Monday follows a market holiday and a
  month-matched control alone cannot separate "London is shut" from "the desk had an extra day off."
- **Probed and NOT obtained, so not asserted:** `londonstockexchange.com/equities-trading/business-days`
  (HTTP 200, 54,995 B, but a JavaScript shell — the served HTML contains **no** `2027`, `Easter`,
  `Good Friday` or `holiday` string), so **LSE's own 2027 trading calendar is not sourced here** and
  no claim is made about LSE hours; `dmo.gov.uk` (HTTP 200, 15,242 B) was reached but no gilt
  business-day calendar was extracted. Also not fetched: SIFMA's *Policy on Early Close
  Recommendations*, its holiday-schedule **archive**, and any UK gilt or sterling tape.
- **Re-grepped, not inherited:** `docs/plans/trade-playbooks.md`,
  `docs/research/multi-symbol-sweep.md`, `src/domain/earnings-calendar.ts`.

### Conviction legs, tested

1. **The card exists and reads exactly as filed — SUPPORTED, verbatim.** The payload contains
   **two** `March 29, 2027` strings. The first is a three-part card whose parts are
   `"children":"Easter Monday"` → `"children":"Monday, March 29, 2027"` → `"children":""` — a
   **name, a date, and an empty note**. That is the full-closure shape; every early-close card on the
   page instead carries its instruction *in the note* and leaves the date span empty (the second
   `March 29, 2027` string is exactly that: the Japan card's note).

2. **It is the U.K. 2027 panel's card — SUPPORTED positionally.** Cards emit in panel order and in
   date order within a panel. This triple sits between `Good Friday` / `Friday, March 26, 2027` and
   `May Day` / `Monday, May 3, 2027`, in a block running `New Year's Day 2026/2027` → `MLK` →
   `Presidents Day` → **Good Friday → Easter Monday → May Day** → (chunk break) → `Memorial Day` /
   `Spring Bank Holiday` (both `Monday, May 31, 2027`) → `Summer Bank Holiday` /
   `Monday, August 30, 2027` → `Christmas Day` → `Boxing Day` / `None`. Two of those — `May Day`
   and `Spring Bank Holiday` on the same date, and an August 30 Summer Bank Holiday — are **UK
   holidays with no US analogue**, and the U.S. 2027 panel's own sequence runs Good Friday **directly
   to** `Memorial Day` / `Monday, May 31, 2027`. This is the U.K. panel.

3. **No `Tentative` flag — SUPPORTED, and it inverts the sibling's central caution.** The string
   `Tentative – Subject to confirmation by the Bank of Japan` occurs on the co-dated Japan card and
   throughout the **Japan** 2027 panel, and **nowhere in the U.K. panel** for either year. The
   [Japan sibling](sifma-japan-early-close-2027-03-29.md) correctly made that flag its defining
   feature; **this entry's date carries no such qualifier**, which is why its durability call sits a
   notch higher than the sibling's despite being about the same calendar day.

4. **The U.K. 2027 panel is accurate where this date lives and wrong only in December — SUPPORTED,
   6 of 6 then 0 of 2.** Against `gov.uk`'s eight statutory England-and-Wales 2027 dates:

   | Statutory (gov.uk) | U.K. 2027 panel card | Match |
   |---|---|---|
   | 2027-01-01 New Year's Day | `New Year's Day 2026/2027` / `Friday, January 1, 2027` | ✅ |
   | 2027-03-26 Good Friday | `Good Friday` / `Friday, March 26, 2027` | ✅ |
   | **2027-03-29 Easter Monday** | **`Easter Monday` / `Monday, March 29, 2027`** | ✅ |
   | 2027-05-03 Early May | `May Day` / `Monday, May 3, 2027` | ✅ |
   | 2027-05-31 Spring | `Spring Bank Holiday` / `Monday, May 31, 2027` | ✅ |
   | 2027-08-30 Summer | `Summer Bank Holiday` / `Monday, August 30, 2027` | ✅ |
   | 2027-12-27 Christmas (substitute) | `Christmas Day` / `Friday, December 24, 2027` | ❌ |
   | 2027-12-28 Boxing Day (substitute) | `Boxing Day` / `None` | ❌ |

   The panel also lists `Juneteenth` on **Saturday** 2027-06-19 and `U.S. Independence Day` on
   **Sunday** 2027-07-04 where the U.S. panel substitutes forward to `Monday, July 5, 2027`. **The
   year-end inconsistency the Japan sibling attributed to "the panel" is in fact located here, in the
   U.K. block** — a refinement of its leg 14, not a contradiction of it (the Japan panel repeats the
   same two errors under its own `Tentative` flags). **This date is in the verified half.**

5. **The scope is US-dollar paper, and this lane found a decisive new proof — SUPPORTED.** The page
   states verbatim: *"All SIFMA holiday recommendations apply to the trading of **U.S.
   dollar-denominated** government securities, mortgage- and asset-backed securities, over-the-counter
   investment-grade and high-yield corporate bonds, municipal bonds and secondary money market
   trading…"* The sibling lanes rested the "region = time zone, not asset class" correction on that
   sentence alone. **The U.K. panel proves it structurally:** it recommends closures for
   `Martin Luther King Day` (01-18), `Presidents Day` (02-15), `Memorial Day`, `Juneteenth`,
   `U.S. Independence Day`, `Labor Day`, `Columbus Day`, `Veterans Day` and `Thanksgiving Day` —
   nine **US** holidays — interleaved with the six UK bank holidays. **A gilt trading calendar does
   not close for Martin Luther King Day.** What this panel schedules is London desks trading
   **dollars**, and nothing UK-listed is closed by it.

6. **The causing holiday is statutory, with the Scotland wrinkle intact — SUPPORTED.**
   `gov.uk/bank-holidays.json` lists `2027-03-29 | Easter Monday` in **england-and-wales** (bunting
   true) and in **northern-ireland**, and **not in scotland**, whose 2027 spring list carries Good
   Friday and then jumps to the 05-03 Early May holiday. London is in England, so the venue that
   matters is shut; "the UK is closed" is true of what counts and **not uniformly true**. The
   computus that dates it was validated **10/10** against this same file's 2019-2028 list.

7. **The US bond market trades a full session on Easter Monday — SUPPORTED, now from two independent
   primaries.** SIFMA's own U.S. 2027 panel runs `New Year's Day` → `MLK 01-18` → `Presidents 02-15`
   → `Good Friday 03-26` (with `Early Close (2:00 p.m. Eastern Time): Thursday, March 25, 2027`) →
   `Memorial Day 05-31`: **no 03-29 card of any kind**. Independently, the Fed's H.15 has a `DGS10`
   observation on **37 of 37** Easter Mondays 1990-2026 — a series that simply goes blank when the
   bond market is shut. **The "US full session" leg no longer rests on SIFMA's silence.**

8. **2027-03-29 is a reopening session, and H.15 dates that shape — SUPPORTED.** Of the 37 Easter
   Mondays, **28** follow a Good Friday with **no** `DGS10` observation (a **4-calendar-day** gap: a
   full US bond close) and **9** follow one that **has** an observation (a 3-day gap — an open,
   shortened Good Friday; SIFMA's own 2026 U.S. card is exactly that,
   `Early Close (12:00 p.m. Eastern Time): Friday, April 3, 2026`). SIFMA's **2027** U.S. card is a
   **full** Good Friday close, so 2027-03-29 belongs to the **n=28** shape: the first full US bond
   session after a three-day weekend, with London dark. Every cut below is reported for the full 37
   and for that 28-subset.

9. **A London closure does NOT dampen the US Treasury tape — SUPPORTED as a null, and it is the
   cleanest cross-lane result this date has.**

   | Bucket | n | mean \|Δ10y\| | se | Welch t vs Easter |
   |---|---|---|---|---|
   | All sessions (1990+) | 9,174 | 4.33 bp | 0.04 | — |
   | All Mondays | 1,687 | 3.83 bp | 0.089 | 1.16 |
   | Mar/Apr Mondays (control A) | 286 | 4.01 bp | 0.22 | **0.98** |
   | Post-long-weekend Mondays (control B) | 33 | 3.79 bp | 0.52 | **1.09** |
   | **Easter Mondays** | **37** | **5.22 bp** | 1.20 | — |

   Nothing clears. On 2000+ it is **t = 0.19** against control A. The [Japan
   sibling](sifma-japan-early-close-2027-03-29.md) measured the Tokyo equity bar **quieting** on this
   exact configuration at **t = −2.86**; the US 10y shows **no effect of either sign**. **The
   dampening is venue-specific, and it does not reach the market this repo would trade.**

10. **The apparent yield-up drift does not survive its era test — MIXED, and it is refused.**

    | Cut | n | signed Δ10y | median | up-rate | vs control A |
    |---|---|---|---|---|---|
    | Easter Mondays 1990+ | 37 | **+3.76 bp** | +2.0 | **25/37 = 67.6%** | **t = 2.71** (sign z = 2.84) |
    | …the n=28 gap-4 subset (the 2027 shape) | 28 | +4.32 bp | +2.0 | 20/28 = 71.4% | t = 2.44 |
    | …ex the two biggest movers (1994-04-04 +39bp, 2008-03-24 +22bp) | 35 | +2.23 bp | — | — | t = 2.59 |
    | **1990-1999 only** | 10 | **+7.00 bp** | +3.0 | 8/10 | t = 1.75 |
    | 2000+ | 27 | +2.56 bp | +2.0 | 63.0% | t = 2.16 (**but 0.87 vs control B**) |
    | **2010+** | **17** | **+2.12 bp** | +2.0 | 58.8% | **t = 1.75, sign z = 0.95, t = 0.99 ex-outliers** |
    | control A (Mar/Apr Mondays) | 286 | +0.01 bp | 0.0 | 44.4% | — |
    | control B (post-long-weekend Mondays) | 33 | +0.09 bp | 0.0 | 39.4% | — |

    The full sample looks strong and even survives trimming. **The era split is what kills it:** the
    1990s decade alone carries **+7.0bp**, the effect halves each era, and by 2010+ neither the
    t-statistic, the sign test nor the trimmed mean clears. **Not carried.**

11. **And it does not replicate on the front end — NOT SUPPORTED as "yields rise."** The same 37
    dates on `DGS2`: signed **+2.59bp** but **only 15 of 37 up** with a **median of 0.0bp** (control
    A: +0.19bp, 45.5% up; Welch t = 1.71). A mean without an up-rate is a few large moves, not a
    tendency. What the full sample actually shows is a **mild steepening** — 10y−2y **+1.16bp**,
    **23/37 steepen**, t = 2.47 vs control — which is a weaker and different claim than the headline
    number suggests, and is likewise concentrated in the high-rate era. **The honest wording is "a
    1990s long-end drift," and even that is being recorded rather than believed.**

12. **Nothing house-side can fire on this date — SUPPORTED, on a keyword set widened again.** A grep
    of `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md` for
    `holiday|jpx|tokyo|nikkei|closure|jgb|gilt|sifma|easter|london|ftse|lse|treasury|fixed income|bank holiday`
    — five keywords wider than the Japan sibling's, chosen for **this** entry's UK-and-rates surface —
    returns **zero hits in both**. `src/domain/earnings-calendar.ts` carries **no print dated after
    2026-11-10**. `symbols: []`, `impact: low`.

13. **The corridor is dense and this entry moves the least of it — SUPPORTED, from the live
    calendar.** Nine other tracked events sit within ±5 days: BoJ Minutes 03-24 · SIFMA US bond early
    close 03-25 · Good Friday closure **and** the Tokyo CPI flash 03-26 · the BoJ Summary of Opinions,
    the FTC v. Amazon trial **and** the Japan early close 03-29 · the S&P Select Sector secondary
    reweight 03-31 · Japan's food-tax cut 04-01. **Every one is `estimate`**, and the only `medium` is
    the Amazon trial. Note the two **quarter-end** facts the sibling read only from Tokyo: 2027-03-31
    is the **US** calendar-quarter end as well as Japan's fiscal year-end, so 03-29 is **T-2 into a
    US quarter-end** too — which is one more reason nothing that happens on the date should be
    credited to a bond desk's staffing.

### What plays the conditions support (date `estimate`)

**None.** No entry, exit, hedge or size is keyed to 2027-03-29 in any branch. What this row banks is
one verification, one confirmation, one null and one refusal:

- **The verification** — the card is real, full-closure, **not tentative**, and sits in the part of
  its panel that matches the statutory primary 6 of 6. The scope correction the sibling lanes carried
  on one sentence now has structural proof: **the U.K. panel closes for Martin Luther King Day.**
- **The confirmation** — the US bond tape is open on **37 of 37** Easter Mondays, from the Fed's own
  H.15 rather than from SIFMA's silence, and 2027 is the **n=28** post-full-Good-Friday shape.
- **The null** — the Tokyo dampening does **not** transfer to US rates (t = 0.98; 0.19 post-2000).
  That is a useful negative: it bounds where the sibling's finding applies.
- **The refusal** — the +3.76bp / 25-of-37 yield drift is a **1990s artifact** by its own era split
  and does not replicate on the 2y. Registered at **Low** as an n-generator, **sized at zero**.

### Honest limits

- **The event is about *dollar-bond desks in London*; the measurement is the *US* 10y.** No London
  USD-bond volume series, no gilt tape, no sterling money-market series was fetched. Legs 9-11
  measure whether the **US** tape behaves differently on a day London's desks are shut — not whether
  those desks trade less, which is not in doubt and not measurable here.
- **"London shut" cannot be isolated from "Europe shut."** Easter Monday closes Germany, France and
  much of Europe and Australasia too. Control B removes the long-weekend confound; **nothing here
  removes the global-holiday confound**, so even the null in leg 9 is a null about *a globally thin
  Monday*, not specifically about London.
- **Leg 10 is refused, not merely hedged.** The full-sample t = 2.71 is real arithmetic; the era
  decay is the reason it is not carried, and someone reading only the headline number would size a
  position this ledger says not to take.
- **The n=28/n=9 Good Friday split is inferred from H.15 gaps, not from SIFMA's archive.** The
  archive was not fetched, so what SIFMA *recommended* on any past Good Friday or Easter Monday is
  unknown; the 2026 early-close card is the one recommendation directly observed, and it agrees.
- **`DGS10` is a 3:30-ish New York quote, not a session-shape measure.** A close-to-close yield
  change cannot see intraday liquidity, bid-ask width or volume — the things a missing London desk
  would most plausibly affect. **The absence of a price effect is not evidence of an absence of a
  liquidity effect**, and no liquidity series was obtainable here.
- **LSE's own 2027 calendar was not obtained** (HTTP 200, JavaScript shell, no holiday strings), and
  no DMO gilt business-day calendar was extracted. This ledger therefore asserts **nothing** about
  LSE or gilt trading hours on 2027-03-29 beyond the statutory `gov.uk` bank holiday.
- **The panel has two demonstrated errors** (the December substitutes) and lists two US holidays on
  weekend dates. They are outside this date's block, which is a **location** argument, not a proof
  of correctness for 03-29.
- **The source is non-binding by its own terms** — a recommendation to members, not a market halt —
  and every statement here carries the event's **`estimate`** label. Estimates widen caution and
  license nothing.
- **A card count off this page is a lower bound** (the sibling's method correction, re-confirmed):
  chunk-split triples are silently dropped by any adjacency parse. All claims above are direct string
  searches, and panel attribution is positional.

## Stance & kill switches

**Stance (2026-09-05, date `estimate`):** **stand aside, permanently and structurally.** No position,
no play, no size, in any branch.

**First, this card is the firm one on its date, and that is a correction of the inherited framing.**
The U.K. 2027 panel's Easter Monday card is a **full-closure** triple — `Easter Monday` /
`Monday, March 29, 2027` / an **empty** note — and it carries **no** `Tentative – Subject to
confirmation by the Bank of Japan` flag, a string confined to the **Japan** panel. Against `gov.uk`'s
statutory England-and-Wales list the U.K. 2027 panel is correct on **6 of 6** dates through August
and wrong on **both** December substitutes (`Christmas Day` / `Friday, December 24, 2027` against the
statutory Mon 12-27; `Boxing Day` / **`None`** against Tue 12-28). **The panel's demonstrated errors
are located in its year-end block, and this date is not in it** — which also refines where the Japan
sibling's leg-14 doubt actually lives.

**Second, the scope correction is no longer a single sentence — it is structural.** SIFMA's scope
line reads *"U.S. dollar-denominated"*, and the U.K. panel proves what that means by scheduling
closures for **Martin Luther King Day, Presidents Day, Juneteenth, US Independence Day, Labor Day,
Columbus Day, Veterans Day and Thanksgiving** next to the six UK bank holidays. **A gilt calendar
does not close for MLK Day.** This recommendation shuts **London's dollar-bond desks** and **nothing
UK-listed**; the statutory `gov.uk` Easter Monday is what actually closes London, in
**england-and-wales and northern-ireland but not scotland**.

**Third — this lane's own work — the US tape says one thing clearly and refuses two others.**
*Clearly:* the US bond market is **open on every Easter Monday**, 37 of 37 since 1990, from a `DGS10`
observation calendar that goes blank when the market is shut; and because SIFMA recommends a **full**
Good Friday close for 2027, 03-29 is the **first full US bond session after a three-day weekend**,
the shape 28 of those 37 share. *Refused, first:* the **dampening does not transfer** — |Δ10y| runs
5.22bp against a 4.01bp month-and-weekday control, **Welch t = 0.98** (0.19 on 2000+), where the
Japan lane measured the Tokyo equity bar quieting at t = −2.86. **That finding is venue-specific and
this ledger bounds it.** *Refused, second:* the 10y yield's **+3.76bp / 25-of-37** rise, which looks
strong at **t = 2.71** and survives trimming at **2.59**, is a **1990s artifact** — that decade alone
runs **+7.0bp**, 2010+ falls to **t = 1.75 / sign z = 0.95 / t = 0.99 ex-outliers**, and the 2y does
**not** replicate the up-rate (15/37, median 0.0bp), leaving only a mild steepening
(10y−2y +1.16bp, t = 2.47). **Recorded at Low as an n-generator. Not carried, not sized.**

**Fourth, the attribution trap on this date is crowded and this entry is the smallest thing in it.**
2027-03-29 sits two sessions before **both** the US calendar-quarter end and the Japanese fiscal
year-end (03-31), on the same day as the **BoJ Summary of Opinions** (08:50 JST) and the **FTC v.
Amazon** trial date, in a corridor of nine other tracked events **all labelled `estimate`**. Anything
the tape does on this date belongs to quarter-end flow, to the co-dated prints, or to whatever the
world is doing — **never to a London bond desk being closed.**

Every statement here carries the event's **`estimate`** label; its source is non-binding by its own
terms.

**Kill switches:**

- **Card-durability kill (registered).** SIFMA republishing the U.K. 2027 panel with this card
  **removed, re-dated, or changed to `None`**, or a `Tentative` flag appearing on it. Legs 1-4 turn.
  Registered as **FT-sifma-uk-bond-market-closure-2027-03-29-1**, score by **2027-03-26**, at
  **Medium-high** — above the Japan sibling's equivalent precisely because this card is unflagged and
  sits in the panel's verified half.
- **Execution kill (registered).** FRED `DGS10` printing **no observation for 2027-03-29**, or SIFMA
  publishing a **US-panel** card for that date. The load-bearing "the US bond tape trades a full
  session while London is dark" leg dies. Registered as
  **FT-sifma-uk-bond-market-closure-2027-03-29-2**, score by **2027-04-02**, at **High**.
- **Yield-drift kill (registered, Low).** The **2027-03-29** `DGS10` observation printing **at or
  below** the prior observation. Registered as **FT-sifma-uk-bond-market-closure-2027-03-29-3**,
  score by **2027-04-02**, explicitly as an out-of-sample n-generator: the effect is a 1990s artifact
  by its own era split (2010+ t = 1.75, sign z = 0.95, t = 0.99 ex-outliers) and does not replicate
  on the 2y, so it supports no call at all.
- **Dampening-transfer kill.** A measurable variance effect appearing in US rates on this
  configuration — the 2027-03-29 |Δ10y| landing far outside the control band, or a fuller series
  (intraday, volume, bid-ask) showing what a close-to-close quote cannot. Leg 9's null is a *null*,
  and a liquidity effect invisible to H.15 would supersede rather than contradict it. Re-check every
  pulse.
- **Scope kill.** SIFMA publishing a U.K.-panel scope statement naming **sterling-denominated**
  instruments or gilts, or a primary showing the recommendation reaches gilt trading. Leg 5
  collapses and this entry's title is wrong. Re-check every pulse.
- **Statutory kill.** The UK moving or removing the 2027-03-29 Easter Monday bank holiday
  (`gov.uk/bank-holidays.json`) — the cause itself. Re-check every pulse.
- **Panel-reliability kill.** SIFMA correcting the U.K. 2027 December cards (Christmas to the
  statutory Mon 12-27, Boxing Day off `None`) **without** touching March, which strengthens leg 4; or
  a **new** error appearing in the panel's Jan-Aug block, which destroys the "errors are located in
  December" argument this entry's confidence rests on. Re-check every pulse.
- **Relevance kill (upward).** A house playbook keyed to session hours, foreign holidays or fixed
  income being written and back-tested. Leg 12 goes stale and the stand-aside must be re-argued on
  measured data rather than on absence.

Three forward tests registered in
[`forward-tests/sifma-uk-bond-market-closure-2027-03-29.md`](../forward-tests/sifma-uk-bond-market-closure-2027-03-29.md)
— **-1** (card durability), **-2** (the US bond tape open on the date) and **-3** (the yield drift,
Low). **No new calendar entry is proposed:** the adjacency sweep surfaced nothing dated that this
calendar does not already carry — the three-region state on 2027-03-29 is fully tracked (this entry,
[`sifma-japan-early-close-2027-03-29`](sifma-japan-early-close-2027-03-29.md), and the US non-card
which is not an event), the corridor's nine neighbours are all present, and the two dates this
session read off the page that are **not** tracked — the U.K. panel's `Summer Bank Holiday` /
`Monday, August 30, 2027` and its `May Day` / `Monday, May 3, 2027` — are real but have **nothing
co-dated on this calendar to make them material**, the same call both sibling lanes made about the
2027-08-30 Japan card.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-05 | D-205 | **Initial research; nothing inherited from the proposing lane, and the market study was built on a different source and asset class on purpose (US rates via the Fed's H.15, not the sibling's Japanese equities).** **Card verified:** SIFMA page HTTP 200, **298,926 B**; the payload's two `March 29, 2027` strings are (a) a **U.K. 2027** triple `Easter Monday` / `Monday, March 29, 2027` / **empty note** — the full-closure shape — and (b) the Japan card's note. Panel attribution is positional: the triple sits between `Good Friday` / `Friday, March 26, 2027` and `May Day` / `Monday, May 3, 2027` in the block that also carries `Spring Bank Holiday` and `Summer Bank Holiday` / `Monday, August 30, 2027`, cards the U.S. panel does not have. **`Tentative` is a Japan-panel property only** — absent from the U.K. panel in both years, which puts this entry's durability call **above** the co-dated Japan sibling's. **Panel accuracy measured, 6 of 6 then 0 of 2:** vs `gov.uk` (HTTP 200, **22,207 B**) the U.K. 2027 panel is right on 01-01, 03-26, **03-29**, 05-03, 05-31, 08-30 and wrong on **both** December substitutes (`Christmas Day`/`Friday, December 24, 2027` vs statutory Mon 12-27; `Boxing Day`/**`None`** vs Tue 12-28); it also lists `Juneteenth` Sat 06-19 and `U.S. Independence Day` Sun 07-04 un-substituted. **The year-end inconsistency the Japan sibling flagged is located HERE, in the U.K. block** — a refinement of its leg 14; this date sits in the verified half. **New structural proof of scope:** the U.K. panel schedules closures for **MLK, Presidents Day, Juneteenth, US Independence Day, Labor Day, Columbus Day, Veterans Day and Thanksgiving** alongside six UK bank holidays — **a gilt calendar does not close for MLK Day** — so the *"U.S. dollar-denominated"* scope line is now proven structurally, not just quoted. Cause statutory: `2027-03-29 Easter Monday` in **england-and-wales and northern-ireland, NOT scotland**; the Gregorian computus used to date the analogue set was validated **10/10** against gov.uk's 2019-2028 list. **US tape, from a Fed primary (FRED `DGS10`, HTTP 200, 268,603 B; `DGS2` 208,776 B; `VIXCLS` 161,102 B):** `DGS10` has an observation on **37 of 37** Easter Mondays 1990-2026 → **the US bond market is open every time**, no longer resting on SIFMA's silence (its U.S. 2027 panel runs Good Friday 03-26 straight to Memorial Day 05-31, with the 03-25 2:00 p.m. ET early close its only other March string). **28 of 37** Good Fridays have **no** `DGS10` observation (full close) and **9 do** (open/shortened — SIFMA's own 2026 card is `Early Close (12:00 p.m. Eastern Time): Friday, April 3, 2026`); 2027's US card is a **full** close, so **03-29 is the n=28 shape: the first full US bond session after a three-day weekend, run with London dark.** **Null (the cleanest cross-lane result):** \|Δ10y\| on Easter Mondays **5.22bp** vs Mar/Apr Mondays **4.01bp** (n=286) — **Welch t = 0.98**, and **0.19** on 2000+; vs a post-long-weekend Monday control (n=33, 3.79bp) t = 1.09. **The Tokyo dampening the Japan sibling measured at t = −2.86 does NOT transfer to US rates.** **Refused:** signed Δ10y **+3.76bp, 25/37 up (67.6%)** vs control **+0.01bp / 44.4%** — Welch **t = 2.71**, sign **z = 2.84**, **t = 2.59** ex the two biggest movers (1994-04-04 +39bp, 2008-03-24 +22bp), and the n=28 subset runs +4.32bp/20-of-28 — **but 1990-1999 alone carries +7.0bp**, 2000+ is t = 2.16 vs the month control yet only **0.87** vs the long-weekend one, and **2010+ is +2.12bp at t = 1.75, sign z = 0.95, t = 0.99 ex-outliers**. The **2y does not replicate the up-rate** (15/37, median 0.0bp, t = 1.71), leaving a mild steepening (10y−2y +1.16bp, 23/37, t = 2.47). **Not carried; registered at Low.** Adjacency — **peers:** none (`symbols: []`); `earnings-calendar.ts` has **no print after 2026-11-10**. **Macro:** 9 tracked events within ±5d, **all `estimate`**, only `medium` is FTC v. Amazon; 03-31 is the **US quarter-end** as well as Japan's fiscal year-end, so 03-29 is T-2 into both. **Volatility:** VIX **14.32** (FRED `VIXCLS`, 2026-09-03 close); `DGS10` 4.77, `DGS2` 4.34 same date. **Geopolitical:** nothing touching this event. **Tape:** US bond market shut Fri 03-26, full session Mon 03-29. **Proposes no new calendar entry** — the sweep surfaced nothing dated that is both untracked and material (the U.K. panel's 2027-05-03 and 2027-08-30 cards are real but have nothing co-dated). **Own weaknesses:** the study measures the **US** 10y as a proxy for a question about **London dollar desks**; "London shut" cannot be separated from "Europe shut"; a close-to-close H.15 quote cannot see liquidity, volume or spread, so leg 9's null is a **price** null and not a liquidity one; SIFMA's archive not fetched, so the Good Friday n=28/9 split is inferred from H.15 gaps; **LSE's own calendar was probed and NOT obtained** (HTTP 200, JS shell, zero holiday strings) so nothing is asserted about LSE or gilt hours; the panel has two demonstrated December errors, and "the errors are in December" is a location argument rather than a proof. | Initial stance set: **stand aside** (structural row only). **Raises** the durability call above the co-dated Japan sibling's — this card is full-closure, unflagged, and in the panel's 6-of-6 half. **Upgrades** the scope correction from a quoted sentence to structural proof (the U.K. panel closes for MLK Day). **Confirms** the US full session from the Fed's own observation calendar, 37/37. **Bounds** the sibling's dampening finding as venue-specific (US t = 0.98 vs Tokyo t = −2.86). **Refuses** the +3.76bp / 25-of-37 yield drift as a 1990s artifact that dies post-2010 and does not replicate on the 2y. Registers **FT-sifma-uk-bond-market-closure-2027-03-29-1/-2/-3**. | 2026-10-05 (low, 15+d band: every 30d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new `src/domain/market-events/<id>.json`
(`status: "estimate"`) in the same PR. Close-out fills `## Outcome` below from re-run instrument
data (cache busted first), never from memory — after which this doc goes quiet.
