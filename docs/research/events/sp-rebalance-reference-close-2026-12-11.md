# S&P Select Sector Indices December rebalance — the Quarterly Qualification Date close — sp-rebalance-reference-close-2026-12-11

**Kind:** sector · **Date:** 2026-12-11 (estimate — EST: date derived by applying an SEC-filed rule to the 2026 calendar. SEC EDGAR, Select Sector SPDR Trust Form 497, accession 0001193125-26-031948, document `d85739d497.htm`, fetched direct 2026-09-08 (HTTP 200, 2,388,335 bytes — byte-identical to three prior sibling fetches). This session extracted a defined term no sibling had quoted, which names the date directly: *"If on the second Friday of any calendar quarter-end month (a 'Quarterly Qualification Date'), a Component Stock (or two or more Component Stocks) approaches the maximum allowable value limits set forth above (the 'Asset Diversification Limits'), the percentage that such Component Stock (or Component Stocks) represents in the Select Sector Index will be reduced…"* December 2026's Fridays are 12-04 / **12-11** / 12-18 / 12-25, so the Quarterly Qualification Date is 2026-12-11 and capping goes effective after the 2026-12-18 close. Stays `estimate` because the filing dates the RULE, not this instance — S&P DJI's methodology and Policies & Practices PDFs 403'd again on 2026-09-08 — and because this lane may not self-confirm an event it discovered in-sweep) · **Impact:** low
**Last assessed:** 2026-09-08
<!-- probe-ref: {"symbols":{},"vix":15.72,"daysBand":"low:15+","adjacentIds":["boj-tankan-2026-12-14","cpi-2026-12-10","cr-expiry-2026-12-11","ecb-quiet-period-start-2026-12-09","eia-steo-2026-12-08","ercot-data-center-audit-filing-2026-12-10","existing-home-sales-2026-12-09","fomc-2026-12-09","g20-miami-2026-12-14","g20-sherpa-iv-miami-2026-12-10","government-funding-deadline-2026-12-11","industrial-production-2026-12-16","intl-trade-full-report-2026-12-08","japan-balance-of-payments-2026-12-08","japan-cgpi-2026-12-10","mtis-2026-12-16","mts-november-2026-12-10","nahb-hmi-2026-12-16","pjm-capacity-auction-2026-12","ppi-2026-12-15","productivity-costs-q3-revised-2026-12-08","qss-q3-2026-12-10","retail-sales-2026-12-16","russell-reconstitution-2026-12-11","tic-monthly-2026-12-15","wholesale-trade-2026-12-09"],"screenStreak":0,"blocked":[{"url":"https://www.spglobal.com/spdji/en/documents/methodologies/methodology-sp-us-indices.pdf","status":"403","at":"2026-09-08"},{"url":"https://www.spglobal.com/spdji/en/documents/index-policies/methodology-index-policies-practices.pdf","status":"403","at":"2026-09-08"},{"url":"https://www.spglobal.com/spdji/en/documents/methodologies/methodology-sp-select-sector-indices.pdf","status":"403","at":"2026-09-08"}]} -->

## At a glance

**TL;DR.** **Stand aside — and the reason December is different from its siblings is that its central
question is not open, it is *queued*.** 2026-12-11 is the close whose prices set the capped weights
eleven Select Sector SPDRs must trade into the 2026-12-18 year-end witching. Three findings change
what this entry means. **(1) The one live cap breach almost certainly does not survive to December.**
AMZN is the only name over the 24% single-company limit anywhere in the family (**24.65%**, State
Street's own file, self-dated 04-Sep-2026); it gets cut to **23.00%** after the 09-18 close and must
then gain **+4.35%** versus XLY over the 59 sessions to this close to re-breach. The unconditional
base rate for that is **45.1%** — but the *actual* September-third-Friday → December-second-Friday
window crossed in only **2 of 11** years (2015, 2017), ran **negative in 8 of 11**, median **−3.11%**.
**(2) Whether a *cohort* cap binds is decided entirely by a fork that scores on 2026-09-25**, 77 days
before this event needs it: under the filing-literal *proportionate* reading the September cap leaves
XLE's cohort at **45.66%** and the family trade at **$6.71B**; under the *iterative* reading it leaves
XLE at **46.71%** and the trade at **$1.18B** — a **5.7×** difference, already registered as
`FT-sp-rebalance-reference-close-2027-03-12-1`. This ledger does not re-litigate it; it prices both
branches and names the date the answer arrives. **(3) The collision everyone would worry about is
real, unprecedented — and measured to be immaterial.** FTSE Russell's first-ever December
reconstitution is effective after the US close on the *same* second Friday, so for the first time one
auction both prints a Russell reconstitution and strikes S&P Select Sector cap prices. Across 12 June
reconstitution closes, mega-cap-versus-sector dispersion runs **below** its all-day norm in 5 of 7
pairs (XOM/XLE **0.48×**, AMZN/XLY **0.76×**). Reconstitution flow is a boundary phenomenon; caps bind
on mega-caps. Also newly priced: the filing's **step 4** — unquoted by any prior sibling — adds
**~$201M** of forced selling the family's size estimates were missing. Date is `estimate`; that widens
caution and licenses nothing, and no house playbook is index-flow-keyed.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** | High | D-94, `symbols: []`, no house playbook is rebalance-keyed (re-grepped this session: zero hits), and today's weights are one full capping reset (**2026-09-18**) away from anything that survives to this close | A house index-flow instrument being built and back-tested before **2026-12-11** — the "nothing to size this with" leg stops being a grep result and this sheet is rebuilt on measured data |
| This week | **Watch the dress rehearsal on 2026-09-11, trade nothing** | High | The September Quarterly Qualification Date is **three days out**, runs the identical rule on the identical eleven funds, and carries a live 24% breach (AMZN **24.65%**) — the cheapest possible read on the December mechanic | Any S&P DJI or SPDR publication before **2026-09-11** putting the September Select Sector reference close on a date other than 2026-09-11 — the second-Friday rule this entry is derived from would be wrong |
| This month | **Take the answer off the 2026-09-25 fork, do not re-derive it** | Medium | The proportionate-versus-iterative fork sets whether December's cohort caps bind at all (**2/11** vs an effectively-nil re-breach rate) and how big the trade is (**$1.18B** vs **$6.71B**); a sibling already registered it and State Street's first post-09-22 file settles it | State Street's first XLE holdings file dated on or after **2026-09-22** printing XOM **below 18.0%** — the proportionate branch is the live one, and every size figure below flips to the $6.71B column |
| This quarter | **Stand aside — and expect no single-name breach at this close** | Medium | AMZN resets to 23.00% on 09-18 and the exact reset-to-QQD window has produced the required **+4.35%** in **2 of 11** years while running negative in 8 — registered as `FT-sp-rebalance-reference-close-2026-12-11-1` | State Street's first file self-dated **2026-12-11 or later** (and before the 12-18 effective date) printing AMZN's XLY weight **at or above 24.00%** |

**Signals & conditions** — the buy/sell/hold triggers:

- Date is `estimate` (`EST:`, rule-derived) — it widens caution about the 2026-12-18 close and licenses no date-keyed action.
- **Never trade the capping.** The pro-forma goes to S&P DJI clients after this close; the public sees weights only after the fact.
- **Two independent tests.** Single name > **24%** → cut to 23%; Σ of names each > **4.8%** > **50%** → cut the cohort. Both from the SEC 497, re-read in full this session.
- **The live single-name breach is AMZN in XLY at 24.65%** (issuer file, 04-Sep-2026) — the only name over 24% in the whole family, and it is **0.65pp** over three days before the September QQD.
- **December is where AMZN-vs-XLY relative strength goes to die.** Sep-3rd-Fri → Dec-2nd-Fri, 2015–2025: +14.54 · −8.06 · +8.53 · −5.02 · −4.07 · −3.11 · −10.79 · −18.48 · +3.97 · −1.05 · −2.46 (%). **2 of 11** cleared +4.35%; median **−3.11%**.
- **Step 4 is real and was unpriced.** *"if a Component Stock represents between 4.5% and 4.8% … prior to the first three steps, the weight of such Component Stock shall be reduced to 4.5%."* XLC carries **four** such names (DIS 4.709, NFLX 4.678, TMUS 4.602, WBD 4.592) ≈ **$131M**; XLE carries SLB 4.667 ≈ **$70M**.
- **XLC's September capping trade is ~$204M, not $73M** — 2.8× the cohort-only figure, once step 4 is counted.
- **Family one-way capping trade: ~$1.38B iterative (incl. step 4) against $394.62B** of issuer-derived assets — **0.35%**. Under the proportionate branch it is **$6.71B**, **1.7%**.
- **AUM is issuer-primary this session**: State Street's own Shares Held × the 2026-09-04 raw close, **$394.62B** across eleven funds — within **0.8%** of the March sibling's vendor $391.43B, which validates that figure rather than replacing it.
- **The Russell collision is unprecedented and immaterial to caps.** Recon-day mega-cap dispersion ratios vs all-day: XOM/XLE **0.48×**, TSLA/XLY **0.46×**, NVDA/XLK **0.69×**, AMZN/XLY **0.76×**, IWM/SPY **0.77×**; only META/XLC **1.20×** and GOOGL/XLC **1.05×** exceed 1 (n=9).
- **The corridor is the densest of the four instances** — FOMC **12-09**, CPI **12-10**, a government-funding deadline and CR expiry **on the day**, Russell reconstitution **on the day**. Named as a mechanism, not sized: cap tests are on *relative* intra-sector weights and a macro shock is largely common-factor.
- **XLK still does not bind and is not close** — cohort **37.42%** (NVDA/AAPL/MSFT); AVGO at **4.53%** has fallen out of the >4.8% group entirely.
- Dated watch list: September QQD **2026-09-11** → effective **2026-09-18** → fork scored **2026-09-25** · December add/drop file **2026-12-04** (proposed) · **QQD 2026-12-11** · effective after the **2026-12-18** close · membership effective open **2026-12-21** (proposed `estimate`, this PR) · conditional secondary reweighting **2026-12-30 / 12-31**.

## Initial research

### The question

2026-12-11 is on this calendar because the `sp-select-sector-secondary-reweight-2026-12-31` initial
research found a gap in the middle of an already-tracked sequence: the calendar carried September 2026
and March 2027 and nothing for the quarter between them. That proposal asked this session two things
it deliberately did not do — whether S&P DJI publishes a December pro-forma release date distinct from
the reference close, and what to make of `russell-reconstitution-2026-12-11` landing on the same
session. Answer both, and then the real question: **is there anything about the December instance the
September and March siblings could not have known?**

**One-line verdict:** yes, and it is not the crowded corridor — December is the quarter where the one
live cap breach measurably fails to survive to the reference close, and where the whole cohort
question is already scheduled to be answered by a sibling's forward test 77 days ahead, so the honest
output is a refusal, two answered questions, one alarm killed by its own data, and a size correction.

### Method

Macro / market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) —
`symbols: []`, so no symbol-keyed instrument applies and `scripts/research/` carries no index-flow
instrument. This session inherited no sibling's arithmetic:

- **SEC EDGAR** — Select Sector SPDR Trust Form 497, accession `0001193125-26-031948`, re-fetched
  direct 2026-09-08 (HTTP 200, **2,388,335 bytes**) and the capping methodology extracted verbatim
  **including steps 3 and 4**, which no prior ledger had quoted.
- **EDGAR submissions index** (`data.sec.gov/submissions/CIK0001064641.json`, HTTP 200, 180,536 bytes)
  — re-checked for supersession. Since the 2026-06-12 redemption-procedure 497 there is one **N-CSRS**
  (2026-09-03, semi-annual report, no rebalancing language) and routine **NPORT-P** filings. The
  January 497 remains operative.
- **State Street's own daily holdings files** — `holdings-daily-us-en-<etf>.xlsx` for all eleven
  Select Sector SPDRs (HTTP 200 after redirect), unzipped and parsed cell-by-cell from the OOXML,
  every file self-dated **"As of 04-Sep-2026"** — one session fresher than the March sibling's. The
  **Shares Held** column was parsed this time, which is what makes the AUM figures issuer-derived.
- **Yahoo daily bars** — adjusted closes 2015→today for the eleven-year window studies, and raw
  closes at 2026-09-04 for the AUM derivation.
- **Blocked, recorded not substituted:** S&P DJI's `methodology-sp-us-indices.pdf`,
  `methodology-index-policies-practices.pdf` and `methodology-sp-select-sector-indices.pdf` all
  returned **HTTP 403** on 2026-09-08 — the same wall three sibling sessions hit. `sectorspdrs.com`
  serves HTTP 200 but is JS-driven and carries no fetchable schedule (5,697 chars of extracted text,
  no rebalancing language). Logged in `probe-ref.blocked`.
- House sources: `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md` grepped for
  `rebalanc|index effect|select sector|capping` → **zero hits**; the three sibling Select Sector
  ledgers, [`russell-reconstitution-2026-12-11`](russell-reconstitution-2026-12-11.md),
  [`opex-2026-12-18`](opex-2026-12-18.md) and [`cr-expiry-2026-12-11`](cr-expiry-2026-12-11.md) read.

### Conviction legs, tested

1. **The 2026-12-11 date is right, and this session sourced it better than any sibling — SUPPORTED.**
   Every prior ledger dated these closes off the timing sentence (*"occurs at the closing prices of the
   second Friday…"*). The 497 also **defines the date as a term**, four paragraphs earlier, in the
   sentence that states the test itself: *"If on the second Friday of any calendar quarter-end month (a
   'Quarterly Qualification Date'), a Component Stock (or two or more Component Stocks) approaches the
   maximum allowable value limits set forth above (the 'Asset Diversification Limits'), the percentage
   that such Component Stock (or Component Stocks) represents in the Select Sector Index will be
   reduced…"* That matters for more than provenance: it is the vocabulary this sequence has been
   missing, and it is why the entry's title now reads *Quarterly Qualification Date* rather than the
   generic "reference close." December 2026's Fridays are 12-04 / **12-11** / 12-18 / 12-25 — an
   ordinary unadjusted trading day, with Christmas Day falling on the fourth Friday and moving neither
   date. The effective close, **2026-12-18**, is independently `confirmed` on this calendar as
   [`opex-2026-12-18`](opex-2026-12-18.md) via the OCC. The entry stays `estimate` on taxonomy alone.

2. **The proposer's first question: December has no separate pro-forma release date — SUPPORTED, and
   the calendar is already correct.** The [09-11 sibling](sp-rebalance-proforma-capped-2026-09-11.md)
   sourced the rule that S&P DJI publishes **capped / alternatively weighted** pro-formas after the
   close of the second Friday — the same session as the Quarterly Qualification Date. So for December
   there is one session, not two, and this single entry covers what September needed a differently
   titled entry for. The genuinely separate December file is the **add/drop membership** pro-forma a
   week earlier, released after the first Friday's close, which is already tracked as
   `proposals/sp-rebalance-proforma-2026-12-04.from-sp-quarterly-rebalance-effective-2026-09-21.json`.
   **No new December pro-forma entry is warranted and none is filed.** The rule itself is
   search-indexed text, not a fetched primary — the Policies & Practices PDF 403'd again today — so
   this leg rests on `NEWS:`-grade sourcing and the SEC 497 corroborates only the reference and
   effective dates, never the file-release date.

3. **The proposer's second question: the Russell collision is unprecedented, and my own alarm is
   refuted by my own data — REFUTED, and this is the leg that changed most during the session.**
   [`russell-reconstitution-2026-12-11`](russell-reconstitution-2026-12-11.md) establishes from FTSE
   Russell's own ground rules that the first-ever December semi-annual reconstitution takes effect
   *"after US market close on December 11"* — the **second Friday**, chosen by FTSE Russell, which is
   exactly the S&P Select Sector Quarterly Qualification Date. The two families have never collided
   before: Russell's other reconstitution is the **last** Friday of June, and S&P's June QQD is the
   **second**. So 2026-12-11 is the first session in either family's history where one closing auction
   both prints a Russell reconstitution trade and strikes the prices that set S&P Select Sector caps —
   and it will recur every December. That is a genuine structural first, and the natural inference is
   that reconstitution flow contaminates the cap prices. **The tape refuses the inference.** Measuring
   one-day top-name-versus-sector excess-return dispersion on the 12 June reconstitution closes
   2015–2026 against the all-day norm:

   | Pair | Recon-day σ | All-day σ | Ratio | n (recon) |
   |---|---|---|---|---|
   | XOM / XLE | 0.366% | 0.758% | **0.48×** | 12 |
   | CVX / XLE | 0.338% | 0.772% | **0.44×** | 12 |
   | TSLA / XLY | 1.369% | 2.960% | **0.46×** | 12 |
   | NVDA / XLK | 1.478% | 2.155% | **0.69×** | 12 |
   | AMZN / XLY | 1.085% | 1.434% | **0.76×** | 12 |
   | GOOGL / XLC | 1.238% | 1.182% | 1.05× | 9 |
   | META / XLC | 2.061% | 1.720% | 1.20× | 9 |
   | IWM / SPY | 0.549% | 0.713% | **0.77×** | 12 |

   Five of seven mega-cap pairs, and the small-cap complex itself, are **quieter** on reconstitution
   day than on an ordinary day. The mechanism is not mysterious: reconstitution flow lands on
   membership boundaries and cap-tier migrants, and the Select Sector cap tests bind on the largest
   names in each sector, which are never near a Russell boundary. **The collision is execution color
   for the 12-11 MOC, not an input to cap arithmetic.** Recorded honestly as a killed alarm, because
   the interesting version of this finding was the one that did not survive.

4. **The single-name cap most likely does NOT bind at this close — SUPPORTED, and it is the
   December-specific finding.** On the issuer file self-dated **04-Sep-2026**, **AMZN at 24.65% of XLY
   is the only name over 24% anywhere in the eleven funds** — 0.65pp over, three days before the
   September QQD. Step 1 cuts it to **23.00%** effective after the 09-18 close. To be over 24% again at
   the 12-11 QQD it must gain **+4.35%** relative to XLY (the weight ratio 24/23) across the **59
   sessions** from 09-18 to 12-11 (60 weekdays less Thanksgiving 11-26). Three readings of the base
   rate, tightening as the conditioning gets closer to the real window:

   | Estimator | Rate |
   |---|---|
   | Unconditional 59-session AMZN-vs-XLY windows since 2015 | **45.1%** (1,299 / 2,878) |
   | Windows *starting* 09-14…09-22 (the September effective band) | **19.7%** (14 / 71) |
   | The exact Sep-3rd-Friday → Dec-2nd-Friday window, 2015–2025 | **2 / 11 = 18.2%** |

   Year by year: **+14.54** · −8.06 · **+8.53** · −5.02 · −4.07 · −3.11 · −10.79 · −18.48 · +3.97 ·
   −1.05 · −2.46 (%). Eight of eleven negative, median **−3.11%**, only 2015 and 2017 clearing +4.35%.
   The mechanism is drift *direction*, not dispersion: XLY's other mega-cap (TSLA, 16.91%) and its
   holiday-retail cohort run hot into December, so AMZN routinely loses relative weight inside its own
   sector over exactly this window. **Note the convergence with a sibling reached independently:**
   [`sp-select-sector-secondary-reweight-2026-12-31`](sp-select-sector-secondary-reweight-2026-12-31.md)
   found **0 of 11** on a seven-session December window via *vol compression* (dispersion at 76.5% of
   normal). Two different windows, two different mechanisms, the same conclusion — which is worth more
   than either alone.

5. **Whether a COHORT cap binds is not an open question but a queued one — SUPPORTED, and this is the
   load-bearing finding.** Today's cohorts, from the issuer files (Σ of names each > 4.8%):

   | ETF | AUM (issuer-derived) | Largest name | Σ > 4.8% | Binds? |
   |---|---|---|---|---|
   | **XLE** | $42.09B | XOM 19.68 | **57.46%** | cohort |
   | **XLC** | $22.66B | META 18.01 | **51.45%** | cohort |
   | **XLY** | $22.14B | **AMZN 24.65** | 46.98% | single name |
   | XLV | $44.49B | LLY 14.70 | 44.56% | no |
   | XLRE | $8.22B | WELL 11.47 | 43.09% | no |
   | XLF | $55.53B | JPM 11.72 | 41.31% | no |
   | XLP | $14.52B | WMT 10.09 | 39.57% | no |
   | XLU | $22.33B | NEE 12.96 | 39.49% | no |
   | **XLK** | **$122.10B** | NVDA 14.92 | **37.42%** | **no** |
   | XLB | $8.63B | LIN 12.89 | 32.11% | no |
   | XLI | $31.91B | CAT 6.81 | 18.11% | no |

   The September cap resets those cohorts, and **where it resets them to is exactly the open rule
   fork** the March sibling registered — the filing's step 2 reads literally as a *proportionate* cut
   of the cohort to 45%, while S&P DJI's Indexology text describes an *iterative* trim-the-smallest-to-
   4.5%. The two branches leave December in materially different places:

   | | XLE post-cap cohort | rel. move to re-breach 50% by 12-11 | measured hit rate | XLC post-cap | to re-breach | hit rate |
   |---|---|---|---|---|---|---|
   | **Iterative** | 46.71% | +7.05% | **2 / 11** | 46.62% | +7.24% | **0 / 8** |
   | **Proportionate** | 45.66% | +9.50% | **1 / 11** | 45.39% | +10.16% | **0 / 8** |

   And the *size* differs far more than the probability: the family's one-way capping trade is
   **$1.18B** iterative versus **$6.71B** proportionate, a **5.7×** spread, because the proportionate
   branch moves XOM from 19.68% to 15.41% and META from 18.01% to 15.75% while the iterative branch
   touches neither. **This ledger does not re-litigate the fork.** It is registered as
   `FT-sp-rebalance-reference-close-2027-03-12-1` and scores off State Street's first holdings file
   dated on or after **2026-09-22** — **77 days before this event**. Naming the date the answer arrives
   is worth more here than a fourth session's re-derivation of the same prose.

6. **Step 3 is not an afterthought, and step 4 was never priced — SUPPORTED, novel.** The full
   methodology, verbatim from the 497, runs four steps. Step 3: *"if any Component Stocks represent
   less than 4.5% … as a result of the application of the second step … the excess weight from the
   first and second steps … will first be applied to such Component Stocks so that they each represent
   4.5%."* Under a proportionate step 2 this mechanically pushes several cohort members back **up** to
   exactly 4.5%, so XLE's cohort lands at **45.66%**, not the flat 45% both siblings assumed. Step 4 is
   the one nobody quoted: *"if a Component Stock represents between 4.5% and 4.8% … prior to the first
   three steps, the weight of such Component Stock shall be reduced to 4.5%."* Wherever the machinery
   triggers at all, **every** name in the 4.5–4.8% band is trimmed too. On the 04-Sep files:

   | Fund | Step-4 band names | Added trim |
   |---|---|---|
   | **XLC** | DIS 4.709 · NFLX 4.678 · TMUS 4.602 · WBD 4.592 | **$131M** |
   | **XLE** | SLB 4.667 | **$70M** |
   | XLY | none | — |

   So **XLC's September capping trade is ~$204M, not the $73M a cohort-only reading gives** — 2.8× —
   and the family iterative total rises from **$1.18B to ~$1.38B** against **$394.62B**, or **0.35%**.
   Small in absolute terms and still not a trade; recorded because a size estimate that omits a step of
   the governing filing is wrong for a reason, not by noise.

7. **AUM is issuer-derived this session, and it validates the vendor figure rather than replacing it —
   SUPPORTED.** Each fund's AUM is computed as its anchor holding's **Shares Held** (State Street's own
   column) × that name's raw 2026-09-04 close ÷ its printed weight — e.g. XLE = 51,941,989 XOM shares ×
   $159.47 ÷ 19.6795% = **$42.09B**. Family total **$394.62B**, against the March sibling's vendor
   (stockanalysis.com) **$391.43B** — **0.8%** apart, which is the right outcome: the vendor number was
   fine, and now nothing in the dollar figures depends on a vendor.

8. **The corridor is the densest of the four instances, and that is a mechanism, not a magnitude —
   MIXED.** Within five days of 2026-12-11 this calendar tracks **26** events. The four that matter:
   [`fomc-2026-12-09`](fomc-2026-12-09.md) (high, `confirmed`, decision + SEP + dot plot),
   [`cpi-2026-12-10`](cpi-2026-12-10.md) (high, `confirmed`, the day before),
   [`cr-expiry-2026-12-11`](cr-expiry-2026-12-11.md) with
   [`government-funding-deadline-2026-12-11`](government-funding-deadline-2026-12-11.md) (high,
   `estimate`, **on the day**), and `russell-reconstitution-2026-12-11` (medium, **on the day**).
   Compare the siblings: the September QQD is struck on a CPI-and-UMich tape, and the March 2027 QQD
   carries **no macro print at all**. So December is the extreme of the sequence. **Why this is MIXED
   rather than SUPPORTED:** the cap tests are on *relative* weights inside a sector, and a macro shock
   is overwhelmingly a common factor that divides out of a name-versus-sector ratio — the same logic
   leg 3 measured directly for reconstitution day. This session did **not** measure CPI- or FOMC-day
   intra-sector dispersion, so the claim "the corridor does not resize the caps" is an argument, not a
   measurement, and it is written down as one. What survives unconditionally is the narrower point the
   [CR ledger](cr-expiry-2026-12-11.md) already carries: a lapse beginning 00:00 on **2026-12-12**
   starts the day *after* this close, so it cannot touch the prices that set these caps at all.

9. **No house playbook is index-flow-keyed — SUPPORTED, re-verified not inherited.**
   `trade-playbooks.md` and `multi-symbol-sweep.md` grepped this session for
   `rebalanc|index effect|select sector|capping`: **zero hits**. S1/G1 are earnings-dated run-ups, S2
   the never-hold-the-print guard, S3 an earnings reaction-day fade (blocked on shorting), S4 an
   overnight-vs-buy-and-hold structural note, E1 a don't-trade-the-open execution rule. The only
   contact is **S4 execution hygiene**, whose close-side preference runs into this rebalance's MOC on
   **2026-12-18** — a guard [`opex-2026-12-18`](opex-2026-12-18.md) already carries.

10. **Adjacency — one dated gap found, in the sequence rather than the corridor — SUPPORTED.** The
    corridor itself needed nothing: all 26 events within five days are already tracked. Enumerating
    December's Select Sector chain against September's fully-populated one did find a gap. September
    carries add/drop pro-forma **09-04** → capped pro-forma and QQD **09-11** → membership effective
    open **09-21**. December carries **12-04** (proposed), **12-11** (this event), the **12-18**
    witching close — and nothing for the open at which the membership changes are in force. **Proposed
    as a new `estimate` file in this PR:** `sp-quarterly-rebalance-effective-2026-12-21`, dated by the
    same convention the September sibling documents from an owner press release (third Friday 12-18 →
    following Monday 12-21; Christmas Day is the fourth Friday and moves neither).

### What the conditions support

Nothing directional, at any horizon. What the conditions support is **a refusal with a reason, two
answered questions, and one deferral that is a feature**:

- **Discipline.** The 2026-12-18 close carries this rebalance's MOC on top of the year's heaviest
  single-stock option settlement. That execution guard is inherited unchanged from
  [`opex-2026-12-18`](opex-2026-12-18.md); this ledger adds none of its own for 12-11, because a
  Quarterly Qualification Date strikes prices and does not print a trade — with the one caveat that
  2026-12-11 *does* now carry a Russell reconstitution MOC, whose effect on the names that bind these
  caps leg 3 measured at below the ordinary daily norm.
- **Deferral, deliberately.** The cohort question is left to `FT-sp-rebalance-reference-close-2027-03-12-1`
  on 2026-09-25 rather than re-argued here. Both branches are priced above, so whichever way it scores,
  this sheet's next pulse reads the answer off a table instead of rebuilding.
- **Measurement.** Two predictions registered, one on the single-name cap and one on the
  reconstitution collision — both scoring inside this event's own week, which is where a market-
  structure claim can actually be checked.

### Honest limits

Every weight here is dated **2026-09-04** and describes September 2026, not the 2026-12-11 close 94
days away; they size the *mechanism*, and no reading of them forecasts which names bind in December —
the September cap resets all of them in between, which is precisely why the base rates rather than the
levels carry the argument. The holdings files are State Street's **ETF** holdings, i.e. capped index
weights drifted by price plus a cash residual, while the tests apply to float-adjusted index weights
recomputed at the reference date with effective-date share counts, a basis this lane cannot see; a
capped name's uncapped weight is *higher* than its printed one, so every cohort sum above is a floor.
The eleven-year window studies hold **current** cohort membership fixed across history, which is wrong
in detail — names entered and left these cohorts over the period — and is used only to characterise
the drift of a mega-cap basket against its own sector, not to reconstruct any past cap test; XLC's
history starts 2018-06, so its n is 8, not 11. Adjusted closes carry dividend-reinvestment assumptions
that differ slightly from index total-return conventions. The reconstitution study uses **June**
reconstitutions as the analogue for a December one that has never happened, and the December leg is
documented by its own ledger as *smaller-scope* than June's — so if anything it overstates the
collision it refutes. AUM is issuer-derived but anchored on a single holding per fund, so a stale
share count in one row would move that fund's total. The `$394.62B` family total covers the eleven
SPDR ETFs only, not every product tracking these indices, so all dollar figures are floors. The
pro-forma release rule in leg 2 remains search-indexed `NEWS:`-grade text; three S&P DJI PDFs 403'd
again today and are logged in `probe-ref.blocked`, never silently substituted. **A data-hygiene note
for the next session:** Yahoo prints a `^VIX` bar for **2026-09-07** (15.30) on a session this
calendar records as a full market closure (`labor-day-market-closure-2026-09-07`), so the honest
prior-session reading is **14.53** at the 2026-09-04 close and today's is **15.72**. Nothing above is a
position: shorting is blocked house-wide, no house playbook is index-flow-keyed, and the date is
`estimate`.

## Stance & kill switches

**Stance (date `estimate`, `EST:` rule-derived).** Treat 2026-12-11 as a **known-mechanism, low-impact
market-structure close** — the Quarterly Qualification Date on which the capped weights are priced, one
week before they are traded into the year-end witching. No position, paper or otherwise, is licensed by
it; the `estimate` label bars date-keyed action independently and no house playbook is index-flow-keyed
regardless. Four things are carried forward. **(a) Expect no single-name breach at this close.** AMZN,
the family's only name over 24% today at **24.65%**, resets to 23.00% on 09-18 and has cleared the
required +4.35% versus XLY in **2 of 11** years over exactly this window, running negative in 8, median
**−3.11%**. **(b) The cohort question is queued, not open** — the proportionate-versus-iterative fork
decides both whether XLE/XLC bind (**2/11** vs **1/11**) and the size (**$1.18B** vs **$6.71B**), and it
scores **2026-09-25**, 77 days ahead. **(c) The Russell collision is a genuine structural first and
measurably immaterial** to the names that bind: recon-day mega-cap-versus-sector dispersion runs
**0.44–0.76×** the ordinary norm in five of seven pairs. **(d) Step 4 was missing from every prior size
estimate**, and adds ~$201M, taking XLC's own trade from $73M to ~$204M. The tail risk worth a line at
every pulse is unchanged from the March sibling: when a cohort crosses 50%, its *smallest* member
absorbs the whole trim in one step, so **a fourth XLK name re-crossing 4.8%** is the discontinuity to
watch — AVGO at **4.53%** is the marginal name and has fallen out.

**Kill switches:**

- **State Street's first file self-dated 2026-12-11 or later (and before the 12-18 effective date)
  prints AMZN's XLY weight at or above 24.00%** — leg 4's whole seasonal argument fails and December
  carries a live single-name cap after all. Registered as `FT-sp-rebalance-reference-close-2026-12-11-1`.
- **The 2026-12-11 close shows mega-cap-versus-sector dispersion at or above 2.0× its trailing
  60-session norm** — leg 3's refutation of the reconstitution collision does not survive its first
  live instance, and every December QQD from here inherits a contaminated reference price. Registered
  as `FT-sp-rebalance-reference-close-2026-12-11-2`.
- **State Street's first XLE holdings file dated on or after 2026-09-22 prints XOM below 18.0%** — the
  proportionate branch is live, and every figure in this document moves to that column: family trade
  **$6.71B**, XLE cohort resetting to 45.66%. Not this ledger's forward test; it belongs to
  `FT-sp-rebalance-reference-close-2027-03-12-1` and is watched here.
- **An S&P DJI or SEC-filed methodology change moves the second-Friday Quarterly Qualification Date,
  the third-Friday effective date, or the 24% / 4.8% / 50% thresholds** — re-check EDGAR CIK
  `0001064641` at every pulse; supersession was checked 2026-09-08 and only an N-CSRS and NPORT-Ps have
  filed since June.
- **FTSE Russell moves its December reconstitution off the second Friday** — the collision leg 3
  measures ceases to exist and this event's corridor simplifies; `russell-reconstitution-2026-12-11`
  carries its own watch on a ground-rules revision past v7.2.
- **A fourth XLK constituent re-crosses 4.8% and the cohort approaches 50%** — the 2024 single-name
  shape becomes live in the largest fund of the eleven ($122.10B) and this event stops being a
  ~$1.4B footnote. AVGO at 4.53% is the marginal name; check the issuer file at every pulse.
- **A 2026-dated S&P DJI or SPDR rebalance schedule becomes fetchable** — the entry promotes off
  `estimate` if it lists 2026-12-11, or the corridor re-dates if it does not. Three S&P DJI PDFs 403'd
  again on 2026-09-08; re-attempt each pulse.
- **A house index-flow instrument gets built** — leg 9's "no playbook is index-flow-keyed" stops being
  a grep result and starts being a measurement, and this sheet is rebuilt on house data.

**Registered forward tests.** `FT-sp-rebalance-reference-close-2026-12-11-1` and `-2` — see
[`forward-tests/sp-rebalance-reference-close-2026-12-11.md`](../forward-tests/sp-rebalance-reference-close-2026-12-11.md).
Both score inside this event's own week, which is the point: a market-structure claim about a specific
close is checkable at that close and nowhere else.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-08 | D94 | Initial research banked; canonical `src/domain/market-events/sp-rebalance-reference-close-2026-12-11.json` written from the single proposal carrying this id, after re-fetching the primary rather than inheriting it. Probe-ref baseline set (no symbols, **VIX 15.72** at today's close, band `low:15+`, 26 adjacents, 3 blocked S&P DJI PDFs). **Sourcing upgrade:** the 497 (acc. `0001193125-26-031948`, re-fetched HTTP 200, **2,388,335 bytes** — byte-identical to three prior sibling fetches) **defines the date as a term no sibling had quoted — the "Quarterly Qualification Date"** — and this session extracted **steps 3 and 4** of the capping methodology, which no prior ledger carried. EDGAR submissions re-checked: only N-CSRS 2026-09-03 and NPORT-Ps since the June 497; January 497 operative. Issuer holdings for all eleven SPDRs re-parsed from OOXML, self-dated **04-Sep-2026** (one session fresher than the March sibling), and **AUM derived issuer-primary** from the Shares Held column × raw closes: **$394.62B** family, within 0.8% of the sibling's vendor $391.43B. **Both proposer questions answered: (1)** December has **no** pro-forma release distinct from this close — capped pro-formas publish after the second Friday's close, so one entry covers both, and the separate add/drop file (**12-04**) is already proposed. **(2)** The `russell-reconstitution-2026-12-11` collision is a **genuine structural first** (FTSE Russell's new December leg is effective after the close of the *second* Friday — the same session as the QQD; the two families have never collided, June's recon being the *last* Friday) **and measurably immaterial**: across 12 June recon closes, top-name-vs-sector one-day dispersion runs **below** its all-day norm in 5 of 7 mega-cap pairs (XOM/XLE **0.48×**, TSLA/XLY 0.46×, NVDA/XLK 0.69×, AMZN/XLY 0.76×; only META/XLC 1.20× and GOOGL/XLC 1.05× above 1, n=9) and IWM/SPY itself runs 0.77×. **Own alarm, killed by own data.** **December-specific finding:** the single-name cap most likely does not bind here — AMZN (**24.65%**, the family's only >24% name) resets to 23.00% on 09-18 and needs **+4.35%** vs XLY over 59 sessions; the exact Sep-3rd-Fri→Dec-2nd-Fri window cleared it in **2 of 11** years, ran negative in 8, median **−3.11%**, vs a **45.1%** unconditional rate — converging with the 12-31 sibling's independent 0-of-11 on a seven-session window via a different mechanism. **Load-bearing:** the cohort question is **queued, not open** — the proportionate/iterative fork sets XLE's post-cap cohort to **45.66%** vs **46.71%** and the family trade to **$6.71B** vs **$1.18B** (5.7×), with re-breach rates 1/11 vs 2/11 (XLC 0/8 either way), and it scores **2026-09-25** as `FT-…-2027-03-12-1`, 77 days before this event; priced both branches rather than re-litigating. **Size correction nobody had:** step 4 trims every 4.5–4.8% name wherever the machinery fires — XLC's DIS/NFLX/TMUS/WBD ≈ **$131M** and XLE's SLB ≈ **$70M**, taking XLC's trade from $73M to **~$204M** and the family iterative total to **~$1.38B** (0.35% of assets). **Adjacency sweep — peers:** none, `symbols: []`, no tracked-name print in the 12-08→12-16 corridor. **Macro:** **26** tracked events within 5 days — FOMC **12-09**, CPI **12-10**, CR expiry + funding deadline **on the day**, Russell recon **on the day** — the densest of the four instances (September's QQD is a CPI day; March 2027's carries nothing). Logged MIXED, not SUPPORTED: cap tests are on relative intra-sector weights and this session did not measure CPI/FOMC-day intra-sector dispersion. A lapse starting 00:00 **12-12** cannot touch these prices. **Volatility regime:** baseline row; VIX **15.72** (09-08 close) vs **14.53** (09-04) — and a data-hygiene note, Yahoo prints a spurious ^VIX bar for **2026-09-07**, a full closure. **Geopolitical:** nothing touching index-capping mechanics. **Event tape:** `trade-playbooks.md` + `multi-symbol-sweep.md` grepped for `rebalanc\|index effect\|select sector\|capping` → **zero hits**. **One dated adjacency proposed as `estimate` in this PR:** `sp-quarterly-rebalance-effective-2026-12-21` — found by enumerating December's chain against September's fully-populated one, which has an effective-open entry December lacks. Registered **FT-…-1** (AMZN below 24.00% on the first file self-dated 12-11 or later) and **FT-…-2** (12-11 mega-cap dispersion below 2.0× its trailing-60d norm), both scoring inside this event's own week. | — (stance set: stand aside on all four horizons; the output is a refusal with a measured reason, two answered proposer questions, one killed alarm and a size correction) | 2026-10-08 (low, ≥15d band: every 30d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint notes any
row past ~1,200 chars): it is a note to the next session, not an essay, and a stance *change* earns its
sentence in the Stance section with the row as its receipt. The adjacency sweep (peer prints · macro
surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in every row; a dated
adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-sp-rebalance-reference-close-2026-12-11.json`
(`status: "estimate"`) in the same PR — your own file, never another event's canonical one (#1717).
Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from memory
— after which this doc goes quiet.
