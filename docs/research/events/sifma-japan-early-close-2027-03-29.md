# SIFMA-recommended 3:00 p.m. JST early close for the Tokyo session of the USD bond market — UK Easter Monday, landing two sessions before the Japanese fiscal year-end — sifma-japan-early-close-2027-03-29

**Kind:** rates · **Date:** 2027-03-29 (estimate — NEWS: SIFMA `sifma.org/resources/guides-playbooks/holiday-schedule` Japan Holiday Recommendations panel, re-fetched and re-parsed 2026-09-05; the causing UK bank holiday independently corroborated from `gov.uk/bank-holidays.json`. The `estimate` label is a taxonomy gap, a source non-binding by its own terms, **and SIFMA's own card marking this date `Tentative`** — the third count does not apply to the 2026 siblings) · **Impact:** low
**Last assessed:** 2026-09-05
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"low:15+","adjacentIds":["boj-minutes-2027-03-24","sifma-bond-early-close-2027-03-25","good-friday-market-closure-2027-03-26","japan-cpi-tokyo-flash-2027-03-26","boj-summary-of-opinions-2027-03-29","ftc-v-amazon-antitrust-trial-2027-03-29","sp-select-sector-secondary-reweight-2027-03-31","japan-food-tax-cut-2027-04-01"],"screenStreak":0} -->

## At a glance

**TL;DR.** **Stand aside — but this date is not the quiet twin of its 2026 sibling, and two things
separate it.** First, **SIFMA's own card says it may not happen**: verbatim, *"Early Close Only (3:00
p.m. Japan Standard Time): Monday, March 29, 2027 - Tentative – Subject to confirmation by the Bank
of Japan"* — every card on the 2027 Japan panel carries that flag and **no card on the 2026 panel
does**. Second, and larger than the event itself: **2027-03-29 is the third-to-last Tokyo session of
the Japanese fiscal year (T-2 of FY2026).** The scope correction the
[12-28 sibling](sifma-japan-early-close-2026-12-28.md) banked still holds and was re-verified from
the page today — SIFMA's recommendations cover **"U.S. dollar-denominated"** paper, so the *Japan*
panel is a **time zone, not an asset class**; JGBs are out of scope and **nothing Japanese is
shortened** (JPX's own hours page puts OSE JGB futures at 08:45–15:00 with a 15:02 auction and a
15:30–05:55 night session, so 15:00 JST *is* the existing day-session close). **What is new here is
measured.** Easter Monday is the clean analogue set the Boxing-Day sibling never had: **n=37, every
year since 1990, London shut and New York open in all 37.** Tokyo runs `|c2c|` **0.927%** against a
month-and-weekday-matched control of **1.339%** — **Welch t = −2.86**, and **−3.46** post-2000. That
**confirms the sibling's dampening finding out-of-sample** and settles the contradiction its n=10
Boxing-Day cut had left open. An apparent 40.5%-up tilt does **not** survive its control (t = −0.52).
And the attribution trap is sharper than the sibling's: **no Easter Monday in 38 years has ever
landed on fiscal T-2**, the slot the post-2019 tape shows carrying the year-end rights-day bid.
Nothing is tradeable — `estimate`, `symbols: []`, `impact: low`, both playbook docs grep **0 hits**
on a keyword set widened to include `easter|fiscal year|ex-dividend`.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — a *tentative*, non-binding early-close recommendation in a foreign time zone is not a position | High | D-205; `symbols: []`, `impact: low`, and `trade-playbooks.md` + `multi-symbol-sweep.md` grepped this session for `holiday\|jpx\|tokyo\|nikkei\|closure\|jgb\|gilt\|sifma\|easter\|fiscal year\|ex-dividend` return **0 hits in both**; `earnings-calendar.ts` carries **no print after 2026-11-10** | A house playbook keyed to session hours, foreign holidays, fixed income or Japanese fiscal-year flow being written and back-tested before **2027-03-29** — the "nothing is calendar-keyed" leg dies and this sheet is rebuilt on measured data |
| This week | **Treat the `Tentative` flag as this entry's defining feature, not boilerplate** | High | The card's own text ends *"- Tentative – Subject to confirmation by the Bank of Japan"*, and a direct string search of the whole page finds **five** `Early Close Only (3:00 p.m. Japan Standard Time)` strings: the three 2026 ones carry **no** flag, the two 2027 ones (03-29, 08-30) both carry it | SIFMA republishing the 2027 Japan panel with the flag removed and this card intact before **2026-12-05** — the date firms up and the durability test below resolves early in its favour |
| This month | **Bank the out-of-sample confirmation of the dampening result — as a measurement, not an edge** | Medium | `^N225` Easter Mondays **n=37** (1990-2026, **100% London-shut / NY-open**): `\|c2c\|` **0.927%** vs same-weekday same-months control **1.339%** (n=303), **Welch t = −2.86**; post-2000 **0.806%** vs **1.342%**, **t = −3.46**. The 12-28 sibling's pooled t = −2.81 now has an independent, exactly-on-point replication | The **2027-03-29** `^N225` close-to-close `\|move\|` printing **at or above 1.339%**, the Mar/Apr Monday mean. Registered as **FT-sifma-japan-early-close-2027-03-29-2** |
| This quarter | **Watch the fiscal-year-end collision, and do not confuse it for this event** | Low | 2027-03-29 is **T-2** of FY2026 (last Tokyo sessions: Mon 03-29, Tue 03-30, Wed 03-31; JPX's 2027 calendar lists **no March closure but 03-21/03-22**). The rights-day bid sat at **T-3** through 2019 (+0.520%, 66.7% up, n=30) and at **T-2** from 2020 (**+0.986%**, 5/7 up) — but that is **n=7 with a +3.883% COVID-rebound outlier**; ex-2020 it is **+0.503%, t = 1.51, not established** | The **2027-03-29** `^N225` closing **down** — registered at **Low** as **FT-sifma-japan-early-close-2027-03-29-4**, an out-of-sample n-generator, never a sized call |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit, hedge or size is keyed to 2027-03-29. `impact: low`, `symbols: []`,
  date `estimate`, source non-binding by its own terms **and marked tentative on its own card**, and
  date-keyed action requires `confirmed`.
- **The tentative guard — this is the one line that distinguishes this entry from its 2026 siblings.**
  Verbatim: *"Early Close Only (3:00 p.m. Japan Standard Time): Monday, March 29, 2027 - Tentative –
  Subject to confirmation by the Bank of Japan"*. The three 2026 JST early-close cards carry no such
  string. Read every statement below through it.
- **The scope guard (re-verified, not inherited).** SIFMA's page, fetched today: *"All SIFMA holiday
  recommendations apply to the trading of **U.S. dollar-denominated** government securities…"* The
  Japan panel is **when Tokyo desks stop trading dollars**, not a JGB schedule. Anyone reading this
  entry as "Japan's bond market half-closes" has the asset class wrong.
- **Execution guard — the reaction venue is not shortened (`estimate`).** JPX's derivatives hours
  page, parsed today: OSE **JGB futures** Zaraba **08:45–11:00** and **12:30–15:00**, closing auction
  **15:02**, then a **night session 15:30–05:55** with a 06:00 auction. **15:00 JST is where the day
  session already ends.** The co-dated BoJ Summary of Opinions
  ([`boj-summary-of-opinions-2027-03-29`](boj-summary-of-opinions-2027-03-29.md), 08:50 JST) prints
  into a full day *plus* a night session.
- **The three-region state on 2027-03-29, from direct string searches of the page:** **UK fully shut**
  (UK 2027 panel, `Easter Monday` / `Monday, March 29, 2027`, no early-close note; statutory in
  `gov.uk/bank-holidays.json` for **England-and-Wales and Northern Ireland — but not Scotland**) ·
  **Japan 15:00 JST, tentative** · **US a full session** (the only US 2027 March string on the page is
  `Early Close (2:00 p.m. Eastern Time): Thursday, March 25, 2027`; no US card exists for 03-29).
- **The rule this instantiates, verified 5 of 5 by exhaustive string search.** Every
  `Early Close Only (3:00 p.m. Japan Standard Time)` card SIFMA publishes is a **UK-only** bank
  holiday: 2026-04-06, 2026-08-31, 2026-12-28, **2027-03-29**, 2027-08-30. **A US holiday shuts
  Tokyo's dollar desk in full; a UK-only one halves it** — and this corridor shows both halves in
  three days: Fri **03-26** Good Friday is a **full** Japan-panel close (a US holiday), Mon **03-29**
  a half.
- **The measured result, and it is this session's one positive finding.** `^N225` Easter Mondays,
  n=**37**, 1990→2026, **London shut and New York open in every single one** — the clean recurring
  analogue the Boxing-Day sibling could not have (its shape needs 12-26 on a weekend, n=10).
  `|c2c|` **0.927%** (se 0.122) vs **1.339%** for Mar/Apr Mondays (n=303): **Welch t = −2.86**;
  2000+ **0.806%** vs **1.342%**, **t = −3.46**. **A foreign-desk closure quiets the Tokyo bar. The
  "thin tape amplifies news" intuition is backwards**, and the sibling's contradicted result is now
  replicated out of sample.
- **The directional read is a null, and the control is the honest half.** Easter Mondays closed up
  **15 of 37 (40.5%)**, signed mean **−0.359%** — which looks like a down tilt. But Mar/Apr Mondays
  are **already** 48.2% up and **−0.247%** signed; against that control the signed **Welch t = −0.52**
  and the up-rate is **p = 0.22**. **Not significant. Do not carry it.**
- **The attribution trap, and it is bigger than this event.** 2027-03-29 is **T-2 of the Japanese
  fiscal year**. The last-five-March-sessions profile (n=37 years) runs **T-4 +0.958%/78.4% up ·
  T-3 +0.335%/62.2% · T-2 −0.008%/40.5% · T-1 −0.647%/35.1% · T-0 −0.697%/37.8%** — a rally into the
  rights date and a drop out of it. **The peak moved slots at the 2019/2020 boundary**: T-3 was the
  up day through 2019 (+0.520%, 66.7%, n=30) and T-2 from 2020 (+0.986%, 5/7). Whatever the Tokyo
  bar does on 2027-03-29, **year-end rights and window-dressing flow is the first explanation and a
  bond desk's staffing is nowhere near it.**
- **No historical precedent for the exact date.** Of the four Easter Mondays that have fallen in
  March since 1990 — 1997-03-31 (**T-0**), 2005-03-28 (T-3), 2008-03-24 (T-5), 2016-03-28 (T-3) —
  **none landed on T-2**. 2027-03-29 would be the first in 38 years. **n = 0**, said as n = 0.
- **Watch (dated):** Wed **03-24** BoJ Minutes · Thu **03-25** SIFMA US bond early close 14:00 ET ·
  Fri **03-26** Good Friday — NYSE and the US bond market shut, UK shut, **SIFMA recommends Tokyo's
  USD desk fully shut**, but **JPX trades a normal session** and the Tokyo CPI flash publishes · Mon
  **03-29** this recommendation + BoJ Summary of Opinions 08:50 JST + the FTC v. Amazon trial date;
  **London shut, New York normal, Tokyo at FY T-2** · Wed **03-31** Japanese fiscal year-end + the
  S&P Select Sector secondary reweight · Thu **04-01** FY2027 opens, Japan food-tax cut.

## Initial research

### The question, plainly

This entry was proposed by the [`sifma-japan-early-close-2026-12-28`](sifma-japan-early-close-2026-12-28.md)
lane, which found the 2027 panels behind a year tab that a rendered-DOM parse never reaches. That
lane did the structural work — scope, the naming rule, the execution correction — and handed this
date over with one thing unresolved and one thing unnoticed.

**Unresolved:** its own leg 14 could not decide whether SIFMA's 2027 Japan panel is a settled
schedule or an unfinished draft, because the panel's year-end block is internally inconsistent and
**every** 2027 Japan card is flagged `Tentative – Subject to confirmation by the Bank of Japan`. That
flag is attached to *this* date. **Unnoticed:** 2027-03-29 is two Tokyo sessions before the Japanese
fiscal year-end.

So the question is: **does the sibling's structural chain survive an independent re-verification on
this date, does the tentative flag change the stance, and is there anything about 2027-03-29 the
Boxing-Day analysis could not have seen?**

**One-line verdict: the chain holds and was re-verified from the primaries today; the tentative flag
changes the confidence but not the call; and the two things the sibling could not see both cut the
same way — Easter Monday supplies the clean analogue set that confirms its dampening result, and
fiscal T-2 supplies a much larger non-SIFMA explanation for anything that happens on the date.**

### Method

Macro / market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — no
symbol-keyed instrument applies (`symbols: []`). Instrument caches were busted
(`rm -rf node_modules/.cache/earnings-cycle node_modules/.cache/intraday-edges`) before any pull.
**Nothing was inherited from the proposing lane**: every primary was re-fetched and re-parsed, and
the shared statistics were recomputed from a separate download specifically so the two ledgers'
numbers can be compared.

- **SIFMA** `sifma.org/resources/guides-playbooks/holiday-schedule` — HTTP 200, **298,926 bytes**,
  the same byte count the proposing lane recorded. The 2027 panels live only in the page's embedded
  Next.js flight payload. **Parsing note, and it corrects a method rather than a finding:** a
  strict h3→date→note adjacency parse recovers **122** card triples but **silently drops cards whose
  triple is split across flight chunks** (the 2027 Japan `Emperor's Birthday` card is one — its date
  span is emitted in a separate chunk). A card count off this page is therefore a **lower bound**,
  and every claim below rests on **direct verbatim string search of the whole payload**, not on the
  parse. The card-count figure the proposing lane quoted (121) should be read the same way.
- **gov.uk** `gov.uk/bank-holidays.json` — HTTP 200, **22,207 bytes**. `2027-03-29 Easter Monday`
  is statutory in the **england-and-wales** and **northern-ireland** divisions and **absent from
  scotland**; `2027-03-26 Good Friday` is in all three.
- **JPX** `jpx.co.jp/english/derivatives/rules/trading-hours/` — HTTP 200, 43,201 bytes. The JGB
  Futures / Options on JGB Futures / Interest Rate Futures row parsed session-by-session.
- **JPX** `jpx.co.jp/english/corporate/about-jpx/calendar/` — HTTP 200, 31,721 bytes (page's own
  `Update : Feb. 06, 2026`), the **2027** panel parsed entry-by-entry.
- **Cabinet Office of Japan** `www8.cao.go.jp/chosei/shukujitsu/syukujitsu.csv` — HTTP 200, 21,538
  bytes, Shift_JIS, decoded and parsed. **17** statutory 2027 holidays.
- **Measured, not sourced:** Yahoo daily bars via the endpoint `event-material-scan.mjs` itself uses
  — `^N225` **9,000** bars in the 1990-01-04 → 2026-09-04 window (13,936 fetched from 1970),
  `^FTSE` **10,780**, `^GSPC` **14,291**, `^VIX` **9,238** (close **14.53** on 2026-09-04),
  `JPY=X` **7,741** (156.22). `^TPX` returned a single 2015 bar and was discarded.
- **Definitions, stated so they can be refuted:** *London shut* = a weekday with an `^N225` bar and
  **no** `^FTSE` bar. *c2c* = prior close → close. *Ordinary 1-day-gap session* = an `^N225` bar
  exactly one calendar day after the previous one. *Easter* = the Western (Gregorian) computus;
  *Easter Monday* = Easter Sunday + 1. *T-k* = the k-th session counting back from the last `^N225`
  March session of that year, which is the Japanese fiscal year-end.
- **Not fetched, so not asserted:** SIFMA's *Policy on Early Close Recommendations*, *Overview of
  Market Close Recommendation Process*, and holiday-schedule **archive**; any BoJ statement about
  confirming SIFMA's 2027 schedule; any JGB cash (JSDA/OTC) tape or its conventional closing time;
  BOJ-NET operating hours. **A JPX primary for the T+2 equity settlement cycle was probed twice
  (`/english/equities/trading/domestic/` HTTP 200 with no `T+2` string; `/english/equities/improvements/shortening/`
  HTTP 404) and not obtained** — so the settlement-cycle *explanation* for leg 8's slot shift is a
  hypothesis, and only the shift itself is evidence. CME was not attempted (403 to this runner
  across the sibling lanes' documented attempts).
- **Re-grepped, not inherited:** `docs/plans/trade-playbooks.md`, `docs/research/multi-symbol-sweep.md`,
  `src/domain/earnings-calendar.ts`.

### Conviction legs, tested

1. **The card exists and reads exactly as filed — SUPPORTED, verbatim.** An exhaustive search of the
   payload for `Early Close Only (3:00 p.m. Japan Standard Time)` returns **five distinct strings**,
   and the fourth is:
   `Early Close Only (3:00 p.m. Japan Standard Time): Monday, March 29, 2027 - Tentative – Subject to confirmation by the Bank of Japan`.
   Region attribution is self-evidencing — the note names **Japan Standard Time**, where every US
   card says *Eastern Time*.

2. **`Tentative` is a 2027-panel property, not boilerplate on every card — SUPPORTED, and it is the
   honest reason this entry's confidence sits below its 2026 siblings'.** Of the five JST early-close
   strings, the three 2026 dates (04-06, 08-31, 12-28) carry **no** flag; both 2027 dates (**03-29**,
   08-30) carry `- Tentative – Subject to confirmation by the Bank of Japan`. The same flag runs
   through every other card on the 2027 Japan panel. **SIFMA is publishing a proposal, and naming the
   body that has not yet signed off.**

3. **But the 2027 Japan panel's published dates check out against the statutory primary — SUPPORTED,
   16 of 16.** Every weekday 国民の祝日 on the Cabinet Office's 2027 list has a matching Japan-panel
   card at the correct date, including the substitute: `2027/3/21 春分の日` (a **Sunday**) and
   `2027/3/22 休日`, which the panel carries as `Vernal Equinox Day` / `Monday, March 22, 2027`. The
   only statutory date without a card is **2027-03-21 itself, a Sunday** — the same correct omission
   the 2026 panel makes for Sunday 2026-05-03. So the panel is **tentative, but not inaccurate where
   it can be checked**: what the sibling's leg 14 found wrong is confined to the **year-end block**
   (its 2027 Boxing Day card reads `None` though gov.uk dates a 2027-12-28 substitute; its UK
   Christmas card reads `Friday, December 24, 2027` against gov.uk's Monday substitute). **This
   entry's date sits in the verified half of the panel.**

4. **The scope is USD-denominated paper — SUPPORTED, re-read verbatim off the page today.** *"All
   SIFMA holiday recommendations apply to the trading of **U.S. dollar-denominated** government
   securities, mortgage- and asset-backed securities, over-the-counter investment-grade and
   high-yield corporate bonds, municipal bonds and secondary money market trading in bankers'
   acceptances, commercial paper and Yankee and Euro certificates of deposit. Previously scheduled
   SIFMA early close recommendations do not affect the closing time for settlements."* The panel
   headings are **U.S. / U.K. / Japan** and the product is the same in all three: **the region is a
   time zone, not an asset class.** The proposing lane's central correction survives independent
   re-verification.

5. **Nothing Japanese is shortened, and 2027-03-29 is an ordinary full JPX session — SUPPORTED, two
   primaries.** JPX's derivatives hours page, parsed today:

   | Session | Opening auction | Zaraba | Closing auction |
   |---|---|---|---|
   | Morning | 8:45 | 8:45–11:00 | 11:02 |
   | Afternoon | 12:30 | **12:30–15:00** | **15:02** |
   | **Night** | **15:30** | **15:30–5:55** | **6:00** |

   SIFMA's 15:00 JST **is** the OSE JGB futures day-session close, and the night session then runs a
   further 14½ hours. And JPX's own 2027 calendar lists exactly **20** closures — `Jan. 1/2/3`,
   `Jan. 11`, `Feb. 11`, `Feb. 23`, **`Mar. 21 (Sun.)` and `Mar. 22 (Mon.) Vernal Equinox (Mar. 21)
   observed`**, `Apr. 29`, `May 3/4/5`, `Jul. 19`, `Aug. 11`, `Sep. 20`, `Sep. 23`, `Oct. 11`,
   `Nov. 3`, `Nov. 23`, `Dec. 31` — with **no March closure after the 22nd**. Tokyo trades a full
   session on 03-26, 03-29, 03-30 and **03-31**, the fiscal year-end.

6. **The naming rule holds 5 of 5, and this corridor shows both of its halves in three days —
   SUPPORTED.** The complete set of JST early-close cards:

   | Date | SIFMA's card name | What the day is | UK | US | Flag |
   |---|---|---|---|---|---|
   | 2026-04-06 | Easter Monday | UK bank holiday | shut | open | — |
   | 2026-08-31 | Summer Bank Holiday | UK bank holiday | shut | open | — |
   | 2026-12-28 | Boxing Day (substitute) | UK bank holiday | shut | open | — |
   | **2027-03-29** | **Easter Monday** | **UK bank holiday** | **shut** | **open** | **Tentative** |
   | 2027-08-30 | Summer Bank Holiday | UK bank holiday | shut | open | Tentative |

   **All five are UK-only bank holidays; there are no others of any kind.** And the complementary
   half is visible two sessions earlier: the Japan 2027 panel carries `Good Friday` /
   `Friday, March 26, 2027` with **no** early-close note — a **full** recommended Tokyo close on a
   **US** market holiday. **A US holiday shuts Tokyo's dollar desk in full; a UK-only one halves it**,
   and this three-day corridor instantiates both.

7. **The Easter Monday analogue set is clean, complete, and exactly the 2027 configuration —
   SUPPORTED, and this is what the Boxing-Day lane could not have.** The 12-28 sibling's exact
   analogue set needed 12-26 to fall on a weekend: **n=10, irregular**. Easter Monday recurs **every
   year**. All **37** Easter Mondays from 1990 to 2026 are `^N225` sessions, and the detector puts
   **London shut and New York open in all 37** — the identical three-region state 2027-03-29
   produces. First the detector, since everything rests on it: weekdays with an `^N225` bar and no
   `^FTSE` bar, 2019-01-01 onward, fire **52** times, of which **51** are on gov.uk's statutory
   England-and-Wales list and one (2020-12-22) is a Yahoo data gap; of the **51** gov.uk holidays
   that are Tokyo sessions the detector misses **zero**. **51/52 precision, 51/51 recall** —
   reproducing the sibling's validation exactly from an independently fetched series. The pooled
   figures reproduce too: **244** London-shut Tokyo sessions, `|c2c|` **0.964%** vs **1.008%**
   ordinary, **Welch t = −0.78**; Mondays **1.185%**, 50.6% up. That agreement is the credential for
   comparing the two ledgers' numbers.

8. **The dampening result replicates out of sample — SUPPORTED, and it settles the sibling's open
   contradiction.**

   | Bucket | n | mean \|c2c\| | se | up % | Welch t |
   |---|---|---|---|---|---|
   | Ordinary 1-day-gap session | 6,953 | 1.008% | 0.012 | 51.1% | — |
   | All Mondays | 1,684 | 1.185% | — | 50.6% | — |
   | Mar/Apr Mondays (the matched control) | 303 | **1.339%** | — | 48.2% | — |
   | **Easter Mondays** | **37** | **0.927%** | 0.122 | 40.5% | **−2.86** vs control |
   | Easter Mondays, 2000+ | 27 | **0.806%** | — | 48.1% | **−3.46** vs 2000+ control |

   The 12-28 sibling measured a month-matched dampening at **t = −2.81** and then found its own
   n=10 Dec-28 analogues running **wider** at t = +1.71, and correctly concluded "no effect
   established in either direction." **On the clean n=37 set the dampening is the analogue set** —
   there is no contradicting cut, and it strengthens rather than weakens in the modern era. **A
   Tokyo session with London shut is materially quieter than a matched Tokyo session with London
   open**, and the intuitive "thin holiday tape amplifies news" story is **backwards**. This is a
   variance result with **no directional content**.

9. **The apparent directional tilt does not survive its control — NOT SUPPORTED, and the sibling
   made the same correction in the opposite direction.** Easter Mondays closed **up 15 of 37
   (40.5%)** with a signed mean of **−0.359%** (se 0.188, t = −1.91 vs zero), which reads as a real
   down tilt against the `^N225`'s 51.2% base rate (one-sided p = 0.129). But **Mar/Apr Mondays are
   already weak** — 48.2% up, signed **−0.247%**. Against that matched control the signed **Welch
   t = −0.52** and the up-rate is **p = 0.22**. **Not significant; not carried.** (The 12-28 lane
   found a 58.2% *up*-rate that dissolved into a Monday artifact. Two lanes, opposite raw tilts,
   both null against the right control — which is itself evidence the control is doing its job.)

10. **2027-03-29 is fiscal T-2, and the fiscal-year-end profile is the loudest thing on the date —
    SUPPORTED as a pattern, with its era split.** Japanese companies' fiscal year ends 03-31; the
    last three `^N225` sessions of FY2026 are Mon **03-29**, Tue **03-30**, Wed **03-31**. Across the
    37 years 1990-2026, the last five March sessions run:

    | Slot | n | mean \|c2c\| | signed | up % |
    |---|---|---|---|---|
    | T-4 | 37 | 1.506% | **+0.958%** | **78.4%** |
    | T-3 | 37 | 1.109% | +0.335% | 62.2% |
    | **T-2** | 37 | 0.946% | −0.008% | 40.5% |
    | T-1 | 37 | 1.129% | −0.647% | 35.1% |
    | T-0 | 37 | 1.199% | −0.697% | 37.8% |

    A rally into the rights date and a drop out of it. **And the peak moves one slot at the
    2019/2020 boundary:** through 2019 the up day is **T-3** (+0.520%, 66.7% up, n=30) with T-2
    negative (−0.240%, 33.3%); from 2020 it is **T-2** (+0.986%, 5/7 up) with T-3 negative
    (−0.457%). A shortening of the equity settlement cycle moves the last rights-inclusive trading
    day exactly one session later, which is the shape observed — **but the settlement primary was
    not obtained (Method), so the mechanism is a hypothesis and only the shift is evidence.**

11. **The T-2 directional finding is not established — MIXED, and the outlier is why.** The seven
    T+2-era T-2 sessions are **2020-03-27 +3.883%**, 2021-03-29 +0.712%, 2022-03-29 +1.104%,
    2023-03-29 +1.328%, 2024-03-27 +0.903%, 2025-03-27 −0.598%, 2026-03-27 −0.430%. Mean **+0.986%**
    (se 0.559) on **5 of 7** up — but **2020-03-27 is a COVID-crash rebound bar** and dominates it.
    **Ex-2020: +0.503%, se 0.333, t = 1.51, 4 of 6 up — not significant at any n worth the word.**
    It is registered as a forward test at **Low** confidence precisely because it is an n-generator
    rather than a finding.

12. **The exact 2027 configuration has never occurred — SUPPORTED, n = 0.** Four Easter Mondays have
    fallen in March since 1990: **1997-03-31 (T-0)**, 2005-03-28 (T-3), 2008-03-24 (T-5),
    2016-03-28 (T-3). **None on T-2.** The closest structural analogue is 1997-03-31, which was
    Easter Monday *and* the fiscal year-end itself and printed **−1.024%**, consistent with the T-0
    slot's −0.697% mean; and the closest *slot* analogue is 2021-03-29, a T-2 Monday that printed
    **+0.712%** but was not Easter Monday. **Neither is the event, and n=1 twice is not a base rate.**

13. **The causing holiday is statutory, with one wrinkle worth the line — SUPPORTED.**
    `gov.uk/bank-holidays.json` lists `2027-03-29 | Easter Monday` for **england-and-wales** and for
    **northern-ireland**, and **not for scotland** (whose 2027 spring list carries Good Friday only).
    London is in England, so the venue that matters is shut; the wrinkle only means "the UK" is not
    uniformly closed. SIFMA's **UK 2027** panel carries the matching full-closure card
    `Easter Monday` / `Monday, March 29, 2027` with no early-close note.

14. **The US trades a full session — SUPPORTED, by exhaustive search rather than by absence of a
    parsed card.** The only `Early Close (…Eastern Time)` string on the page dated in March 2027 is
    `Thursday, March 25, 2027` (the Good Friday early close, already tracked as
    [`sifma-bond-early-close-2027-03-25`](sifma-bond-early-close-2027-03-25.md)), and the US 2027
    panel's holidays run New Year's Day → MLK 01-18 → Presidents 02-15 → **Good Friday 03-26** →
    Memorial Day 05-31. **No US entry of any kind exists for 03-29.** So the triple is **UK shut ·
    Japan half · US full**, the same shape as 2026-12-28.

15. **Nothing house-side can fire on this date — SUPPORTED, re-verified with a widened keyword set.**
    A grep of `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md` for
    `holiday|jpx|tokyo|nikkei|closure|jgb|gilt|sifma|easter|fiscal year|ex-dividend` — three keywords
    wider than the proposing lane's, chosen to catch anything the fiscal-year-end finding might have
    touched — returns **zero hits in both**. `src/domain/earnings-calendar.ts` carries **no print
    dated after 2026-11-10**. `symbols: []`, `impact: low`.

16. **The corridor is dense, all of it `estimate`, and this entry moves the least of it —
    SUPPORTED, from the live calendar.** Eight other tracked events sit within ±5 days: BoJ Minutes
    03-24 · SIFMA US bond early close 03-25 · Good Friday closure **and** the Tokyo CPI flash 03-26 ·
    the BoJ Summary of Opinions **and** the FTC v. Amazon trial date 03-29 · the S&P Select Sector
    secondary reweight 03-31 · Japan's food-tax cut 04-01. **Every one is `estimate`**, and the only
    `medium` is the Amazon trial. On its own date this entry changes **who is at a desk**, not what
    anything is worth.

### What plays the conditions support (date `estimate`, card `Tentative`)

**None.** No entry, exit, hedge or size is keyed to 2027-03-29 in any branch. What this row banks is
one re-verification, one replication and two new findings:

- **The re-verification** — the sibling's scope, execution and naming corrections all survive an
  independent re-fetch and re-parse of every primary. Nothing was taken on its word.
- **The replication** — Easter Monday (n=37, clean, 100% on-configuration) confirms the dampening
  result the Boxing-Day lane could only report as contradicted. `t = −2.86`, `−3.46` post-2000.
  A foreign-desk closure **quiets** the Tokyo bar. Size nothing off it; it has no direction.
- **The tentative flag** — this card, unlike its 2026 siblings, says on its face that it may not
  happen. That widens caution and is registered as a forward test rather than argued.
- **The fiscal-year-end collision** — 2027-03-29 is FY T-2, the slot that has carried the rights-day
  bid since 2020. It is the first Easter Monday in 38 years to land there. **Anything this date's
  Tokyo tape does belongs to the fiscal year-end before it belongs to a bond desk's staffing**, and
  the T-2 statistic itself is too thin and too outlier-driven to be a finding.

### Honest limits

- **The measured legs are about Japanese *equities*, and the event is about *dollar bonds*.** `^N225`
  is the only Japanese instrument with a long daily tape reachable here; no JGB cash tape, no BOJ-NET
  data and no USD-in-Tokyo volume series was fetched. Legs 7-12 are a **proxy** — they measure
  whether a London closure changes the Tokyo *session*, not whether Tokyo's dollar desks trade less.
  The stance rests on legs 1-6 (sourced, structural), not on the measurements.
- **Leg 8 cannot separate "London shut" from "the world is on holiday."** The control matches weekday
  and month, not the fact that Easter Monday is a globally thin date across Europe and Australasia.
  The dampening is real in the data; its **cause is not identified**, and this is the same limit the
  sibling stated.
- **Leg 10's settlement-cycle explanation is unsourced.** Two JPX paths were probed for a T+2 primary
  (one HTTP 200 with no matching string, one 404). The **slot shift is measured**; the reason offered
  for it is a hypothesis, and 2027-03-29's identity as "the last rights-inclusive session" therefore
  **is not asserted here** — only that it is T-2.
- **Leg 11 is n=7 with one bar (2020-03-27, +3.883%) carrying the mean**, and ex-2020 it does not
  clear (t = 1.51). It is registered at Low confidence to generate out-of-sample n, not because it
  is believed.
- **Leg 12 is n=0.** No Easter Monday has ever fallen on fiscal T-2, so the two effects this ledger
  measures have **never been observed together**, and this session does not know how they compose.
- **The card is `Tentative` and SIFMA names the BoJ as the confirming body.** No BoJ source about
  that confirmation was fetched, so what "subject to confirmation" procedurally requires, and by
  when, is **unknown here**.
- **SIFMA's archive was not fetched**, so what it recommended for Tokyo on any past Easter Monday is
  unknown; leg 7's analogue set is exact on **market structure**, not on the recommendation.
- **The normal Tokyo close that 15:00 JST shortens is still not sourced** — SIFMA states no baseline
  anywhere on the page. The *magnitude* of the shortening remains unquantified; the only anchored
  fact is 15:00 JST and its coincidence with the OSE day-session close.
- **A card count off this page is a lower bound** (Method): chunk-split triples are dropped by any
  adjacency parse. This ledger's claims are string searches, not counts.
- **`^N225` levels are dominated by the 1990s post-bubble crash**, which is why its ordinary-session
  baseline (1.008%) is wider than the 2016+ baselines the BoJ ledgers quote. Every contrast here is
  computed **within** one series, so this affects levels rather than comparisons.
- **Tokyo and London closures are inferred from missing bars.** The detector was validated against
  gov.uk for 2019+ (51/52, one data gap) but **not** before 2019, where a data outage would be
  misread as a closure.
- **Every date in this corridor is `estimate`**, including this one, whose source is a non-binding
  recommendation **that its own publisher marks tentative**. Estimates widen caution and license
  nothing.

## Stance & kill switches

**Stance (2026-09-05, date `estimate`, card `Tentative`):** **stand aside, permanently and
structurally.** No position, no play, no size, in any branch.

**First, the tentative flag, because it is what makes this entry different from its 2026 siblings.**
SIFMA's card reads, verbatim, *"Early Close Only (3:00 p.m. Japan Standard Time): Monday, March 29,
2027 - Tentative – Subject to confirmation by the Bank of Japan."* All three 2026 JST early-close
cards carry **no** such string. This is a published **proposal** naming the body that has not signed
off. It does not change the call — the call was already stand-aside — but it is the honest reason
this entry's date is less firm than 2026-12-28's, and it is registered rather than argued.

**Second, the sibling's structural chain survives independent re-verification, so it is now confirmed
rather than inherited.** SIFMA's scope is *"U.S. dollar-denominated"* paper, re-read off the page
today — the **Japan panel is a time zone, not an asset class**, and **JGBs are out of scope**. JPX's
own hours page puts OSE JGB futures at 08:45–11:00 / 12:30–15:00 (auction 15:02) plus a night session
15:30–05:55, so **15:00 JST is where the listed day session already ends** and **nothing Japanese is
shortened**; the co-dated BoJ Summary of Opinions at 08:50 JST prints into a full day plus 14½ further
hours. And the naming rule holds **5 of 5** by exhaustive string search, with both of its halves
visible in this one corridor: **Fri 03-26 a full Tokyo close (a US holiday), Mon 03-29 a half (a
UK-only one).**

**Third — and this is the finding this lane adds — Easter Monday is the clean analogue set the
Boxing-Day lane never had, and it replicates that lane's dampening result out of sample.** All **37**
Easter Mondays since 1990 are Tokyo sessions with **London shut and New York open**, the exact 2027
configuration. `|c2c|` runs **0.927%** against a same-weekday same-months control of **1.339%**
(n=303): **Welch t = −2.86**, strengthening to **−3.46** post-2000. The 12-28 sibling reported a
pooled dampening at t = −2.81 that its own n=10 exact analogues contradicted at t = +1.71; **on the
n=37 set the dampening *is* the exact analogue, with nothing contradicting it.** A foreign-desk
closure **quiets** the Tokyo bar — the "thin tape amplifies news" intuition is backwards. The raw
40.5% up-rate is **not** carried: against the Mar/Apr Monday control (48.2% up, −0.247% signed) the
signed **t = −0.52**.

**Fourth, the attribution trap on this date is much larger than a bond desk's staffing.** 2027-03-29
is **T-2 of the Japanese fiscal year** — JPX's 2027 calendar lists no March closure after the 22nd,
so 03-29 / 03-30 / 03-31 are the last three sessions of FY2026. The fiscal-year-end profile across 37
years runs **T-4 +0.958% (78.4% up) → T-3 +0.335% → T-2 −0.008% → T-1 −0.647% → T-0 −0.697%**, and
the up-slot **moved from T-3 to T-2 at the 2019/2020 boundary** (T-3 +0.520%/66.7% through 2019;
T-2 +0.986%/5-of-7 from 2020). **No Easter Monday in 38 years has landed on T-2** — 2027-03-29 would
be the first. So the two effects this ledger measures have never been observed together, and the T-2
number is **n=7 dominated by a +3.883% COVID-rebound bar** (ex-2020: +0.503%, t = 1.51). **Nothing on
this date should ever be credited to a SIFMA recommendation**, and nothing should be sized off the
fiscal-year statistic either.

Every statement here carries the event's **`estimate`** label; its source is non-binding by its own
terms and **marked tentative by its own publisher**.

**Kill switches:**

- **Tentative-resolution kill, upward or downward (registered).** SIFMA republishing the 2027 Japan
  panel with this card **removed, re-dated, or changed to `None`** — or with the `Tentative – Subject
  to confirmation by the Bank of Japan` flag **removed and the card intact**. Leg 2 resolves either
  way. Registered as **FT-sifma-japan-early-close-2027-03-29-3**, score by **2027-03-26**.
- **Execution kill (registered).** JPX announcing a closure or early close for **2027-03-29**, or
  `^N225` failing to print an ordinary session bar on that date. Leg 5's "nothing Japanese is
  shortened" claim — the load-bearing correction — dies. Registered as
  **FT-sifma-japan-early-close-2027-03-29-1**, score by **2027-03-30**.
- **Dampening kill (registered).** The **2027-03-29** `^N225` close-to-close `|move|` printing **at
  or above 1.339%**, the Mar/Apr Monday mean. Registered as
  **FT-sifma-japan-early-close-2027-03-29-2**, score by **2027-03-30**, at **Medium** — n=37 and
  t = −2.86 is the strongest cut either lane has, but leg 12 says this particular Easter Monday sits
  in a slot no Easter Monday has occupied.
- **Fiscal-T-2 direction kill (registered, Low).** The **2027-03-29** `^N225` closing **down**.
  Registered as **FT-sifma-japan-early-close-2027-03-29-4**, score by **2027-03-30**, explicitly as
  an out-of-sample n-generator: ex-2020 the T+2-era T-2 slot is +0.503% at t = 1.51, which supports
  no call at all.
- **Scope kill.** SIFMA publishing a Japan-panel scope statement that names **yen-denominated**
  instruments, or a primary showing the recommendation reaches JGB trading. Legs 4 and 5 collapse.
  Re-check every pulse.
- **Naming-rule kill.** SIFMA publishing a `3:00 p.m. Japan Standard Time` early close on a date that
  is **not** a UK-only bank holiday, or a **full** Japan close on a UK-only one. Leg 6's 5-of-5 rule
  breaks. Re-check every pulse.
- **Statutory kill.** The UK moving or removing the 2027-03-29 Easter Monday bank holiday
  (`gov.uk/bank-holidays.json`), or Japan legislating a late-March national holiday — the cause and
  the "ordinary Japanese business day" premise respectively. Re-check every pulse.
- **Settlement kill.** A JPX/JSCC primary showing the equity settlement cycle is **not** T+2 on
  2027-03-29 (a move to T+1, or T+2 never having applied) — leg 10's slot-shift *explanation* dies
  and 2027-03-29's fiscal identity has to be re-derived. Re-check every pulse.
- **Proxy kill.** A JGB cash tape, a BOJ-NET schedule, or a Tokyo USD-bond volume series becoming
  reachable and showing a measurable Easter-Monday-shaped effect. Legs 7-12 are an equity **proxy**
  for a dollar-bond question and would be superseded rather than patched.
- **Relevance kill (upward).** A house playbook keyed to session hours, foreign holidays, fixed
  income or Japanese fiscal-year flow being written and back-tested. Leg 15 goes stale and the
  stand-aside must be re-argued on measured data rather than on absence.

Four forward tests registered in
[`forward-tests/sifma-japan-early-close-2027-03-29.md`](../forward-tests/sifma-japan-early-close-2027-03-29.md)
— **-1** (execution), **-2** (the dampening replication), **-3** (the tentative flag's resolution)
and **-4** (the fiscal-T-2 direction, Low). One dated adjacent event discovered in-sweep is proposed
as `estimate` in the same PR:
[`sifma-uk-bond-market-closure-2027-03-29`](sifma-uk-bond-market-closure-2027-03-29.md) — the causing
holiday, mirroring the accepted
[`sifma-uk-bond-market-closure-2026-12-28`](sifma-uk-bond-market-closure-2026-12-28.md) precedent.
**Recorded but not proposed, with reasons:** the Japan panel's **full** close for Good Friday
2027-03-26 (real, and the other half of the naming rule — but that date already carries
[`good-friday-market-closure-2027-03-26`](good-friday-market-closure-2027-03-26.md) and
[`japan-cpi-tokyo-flash-2027-03-26`](japan-cpi-tokyo-flash-2027-03-26.md), and the material fact
that the US tape is dark is already tracked), and the **2027-08-30** Japan early close (equally
real, equally tentative, nothing co-dated — the same call the proposing lane made).

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-05 | D-205 | **Initial research; nothing inherited from the proposing lane — every primary re-fetched and every shared statistic recomputed from a separate download.** **Headline 1 — the card is `Tentative` and that is a 2027-panel property:** an exhaustive payload search returns **five** `Early Close Only (3:00 p.m. Japan Standard Time)` strings; the three 2026 dates carry **no** flag, both 2027 dates (**03-29**, 08-30) end `- Tentative – Subject to confirmation by the Bank of Japan`. **But the panel's published dates check out — 16 of 16** weekday 国民の祝日 on the Cabinet Office CSV (HTTP 200, 21,538 B, Shift_JIS, 17 entries) have a correct Japan-panel card incl. the `Mar. 22` substitute; the only statutory date without one is **Sunday 2027-03-21**. The sibling's leg-14 doubt is confined to the **year-end block**; **this date sits in the verified half**. **Headline 2 — 2027-03-29 is fiscal T-2.** JPX's 2027 calendar (HTTP 200, 31,721 B) lists **no March closure after the 22nd**, so 03-29/03-30/03-31 are FY2026's last three sessions. 37-year profile: **T-4 +0.958%/78.4% up · T-3 +0.335%/62.2% · T-2 −0.008%/40.5% · T-1 −0.647%/35.1% · T-0 −0.697%/37.8%**, and the up-slot **moves T-3→T-2 at the 2019/2020 boundary** (T-3 +0.520%/66.7% n=30 through 2019; T-2 **+0.986%**, 5/7 from 2020) — consistent with a settlement-cycle shortening, but **no T+2 primary was obtainable** (two probes: 200-no-string, 404), so the mechanism is a hypothesis and only the shift is evidence. That T-2 mean is **n=7 carried by 2020-03-27's +3.883% COVID-rebound bar**; **ex-2020 +0.503%, t = 1.51, not established**. **Headline 3 — Easter Monday replicates the sibling's dampening out of sample.** Detector (N225 bar, no FTSE bar) re-validated **51/52 precision, 51/51 recall** vs gov.uk 2019+ (one Yahoo gap, 2020-12-22); pooled figures reproduce the sibling exactly (**244** London-shut, 0.964% vs 1.008% ordinary, **t = −0.78**; Mondays 1.185%/50.6%) — the credential for comparing the two ledgers. **All 37 Easter Mondays 1990-2026 are Tokyo sessions with London shut AND New York open** — the exact 2027 state, and a set that recurs every year where the sibling's Boxing-Day shape needed 12-26 on a weekend (n=10). **\|c2c\| 0.927% (se 0.122) vs Mar/Apr Mondays 1.339% (n=303): Welch t = −2.86; 2000+ 0.806% vs 1.342%, t = −3.46.** The sibling's t = −2.81 had been contradicted by its n=10 cut at t = +1.71; **here the dampening IS the exact analogue and nothing contradicts it**. **The 40.5% up-rate (15/37, signed −0.359%) is NOT carried** — Mar/Apr Mondays are already 48.2% up / −0.247% signed, so signed **Welch t = −0.52**, up-rate p = 0.22. **No Easter Monday in 38 years has landed on T-2** (March ones: 1997-03-31 **T-0** −1.024%, 2005-03-28 T-3, 2008-03-24 T-5, 2016-03-28 T-3) — **the two effects have never been observed together, n=0**. **Structure re-verified:** SIFMA scope verbatim *"U.S. dollar-denominated…"* (page HTTP 200, **298,926 B**, matching the sibling's byte count) → Japan panel is a **time zone, not an asset class**; JPX hours (HTTP 200, 43,201 B) OSE JGB futures **08:45–11:00 / 12:30–15:00, auction 15:02, night 15:30–05:55** → **15:00 JST is the existing day close, nothing Japanese is shortened**; naming rule **5/5 UK-only** with both halves in this corridor (**Fri 03-26 a FULL Japan close** — a US holiday — **Mon 03-29 a half**); triple = **UK shut · Japan half · US full** (only March-2027 US string on the page is the 03-25 early close). Cause statutory: gov.uk (HTTP 200, 22,207 B) `2027-03-29 Easter Monday` in **england-and-wales and northern-ireland, NOT scotland**. **Method correction:** a strict h3→date→note parse recovers 122 triples but **silently drops chunk-split cards** (2027 Japan `Emperor's Birthday` is one), so any card count off this page — including the sibling's 121 — is a **lower bound**; all claims here are direct string searches. Adjacency — **peers:** none (`symbols: []`); `earnings-calendar.ts` has **no print after 2026-11-10**. **Macro:** 8 tracked events within ±5d, **all `estimate`** — BoJ Minutes 03-24 · SIFMA US early close 03-25 · Good Friday closure + Tokyo CPI flash 03-26 · **03-29 BoJ Summary of Opinions (08:50 JST) + FTC v. Amazon (the only `medium`)** · S&P Select Sector secondary reweight 03-31 · Japan food-tax cut 04-01. **Volatility:** VIX **14.53** (2026-09-04 close); N225 65,020.94, GSPC 7,718.60, FTSE 10,831.10, USD/JPY 156.22. **Geopolitical:** nothing touching this event. **Tape:** JPX open and normal 03-26 and 03-29; FY2026 ends 03-31. **Proposes** `sifma-uk-bond-market-closure-2027-03-29.json` (the causing holiday, mirroring the accepted 2026-12-28 UK precedent), `estimate`. **Recorded not proposed:** the Japan panel's full Good Friday close 2027-03-26 (date already carries two tracked events covering the dark-tape fact) and the 2027-08-30 Japan early close. **Own weaknesses:** legs 7-12 measure Japanese **equities** as a proxy for a **dollar-bond** question; the dampening control matches weekday and month but cannot separate "London shut" from "globally thin date"; the T+2 explanation is unsourced; T-2 is n=7 with an outlier; the combined configuration is **n=0**; SIFMA's archive not fetched; no BoJ source on what "subject to confirmation" requires; no baseline Tokyo close, so the shortening's magnitude is still unquantified; pre-2019 closures inferred from missing bars. | Initial stance set: **stand aside** (structural row only). Re-verifies the sibling's scope/execution/naming chain from primaries; **replicates its dampening result out of sample** on the clean n=37 Easter Monday set (**t = −2.86**, −3.46 post-2000), resolving the contradiction its n=10 cut had left; **refuses** the raw 40.5% down-tilt (t = −0.52 vs control); and adds the **fiscal T-2 collision** as the date's dominant non-SIFMA explanation while declining to size it (n=7, outlier-driven, n=0 combined). Confidence sits below the 2026 siblings' because the card is **`Tentative`**. Registers **FT-sifma-japan-early-close-2027-03-29-1/-2/-3/-4**. | 2026-10-05 (low, 15+d band: every 30d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new `src/domain/market-events/<id>.json`
(`status: "estimate"`) in the same PR. Close-out fills `## Outcome` below from re-run instrument
data (cache busted first), never from memory — after which this doc goes quiet.
