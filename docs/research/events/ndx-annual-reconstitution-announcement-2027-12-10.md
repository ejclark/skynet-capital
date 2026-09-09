# Nasdaq-100 annual reconstitution announced after the close — the untested question is answered on 19 cycles: the addition leg never had an effect, the removal leg had one and lost it around 2016, and the only live signature is turnover on a different session — ndx-annual-reconstitution-announcement-2027-12-10

**Kind:** sector · **Date:** 2027-12-10 (estimate — **EST: the index owner's own published methodology, re-fetched and re-extracted this session, with its effective-date half validated 19-of-19 against observed reconstitutions.** `indexes.nasdaqomx.com/docs/methodology_NDX.pdf`, fetched direct 2026-09-09 (HTTP 200, **422,314 bytes**, 29 Flate streams inflated and the text layer re-extracted in-session): *"Reconstitution Announcement Dates: **After the close on the sixth trading day prior to the Reconstitution Effective Date**"* and *"Reconstitution Effective Dates: **At market open on the first trading day following the third Friday in December**"*. December 2027's Fridays are the 3rd, 10th, **17th**, 24th and 31st, so the effective open is Monday **2027-12-20** and six sessions back is Friday **2027-12-10**. Two independent checks the proposals did not have. **(1) A corollary:** no US holiday ever falls between the second and third Fridays of December, so the six-session count always lands on the **second Friday** — verified mechanically for all 21 cycles 2005–2025, **21 of 21**, and December 2027's second Friday is 2027-12-10. **(2) Observed history:** Wikipedia's *Historical components of the Nasdaq-100* change table (fetched direct 2026-09-09, HTTP 200, 63,555 bytes — a **secondary** source, labelled as such throughout) carries a December reconstitution block for every year 2007–2025, and its **19 dates match the 19 effective dates this rule computes, 19 of 19**. Stays `estimate` on two counts, not the proposals' three: the confirmed-prefix taxonomy in `market-events-data.ts` has no member for an index owner's own methodology, and Nasdaq's 2027 release does not exist yet) · **Impact:** low
**Last assessed:** 2026-09-09
<!-- probe-ref: {"symbols":{},"vix":15.72,"daysBand":"low:15+","adjacentIds":["fomc-2027-12-08","sp-rebalance-reference-close-2027-12-10","vix-expiration-2027-12-15"],"screenStreak":0,"blocked":[{"url":"https://www.spglobal.com/spdji/en/documents/methodologies/methodology-sp-us-indices.pdf","status":"403","at":"2026-09-09"},{"url":"https://www.spglobal.com/spdji/en/governance/index-committee/","status":"403","at":"2026-09-09"}]} -->

## At a glance

**TL;DR.** **Stand aside on every horizon — but this ledger closes a question two proposals and two sibling ledgers explicitly refused to answer, and the answer changes what the corridor should watch.** Both proposals for this id said in capitals that whether the NDX announcement moves NDX constituents the way the S&P announcement moves S&P ones was *"precisely the untested question"* needing *"a constituent-level instrument this house does not own."* This session built one — **19 reconstitution cohorts, 2007–2025, 237 named rows, 166 usable after an automated ticker-reuse guard** — and the answer is three findings, all negative for a trade and one useful for execution. **The addition leg never had an effect.** 48 of 85 positive excess vs QQQ on the reaction session (sign **p=27.8%**), Mann-Whitney against a **1,785-row** baseline of the same names on other sessions in the same December window **p=75.6%**, and **0 of 19** cycle means reached the **+2.31%** directional excess the S&P panel measured (the highest was +1.36%). **The removal leg had one and lost it.** Pooled, it is real and survives every control I could build: **−0.579% mean / −0.575% median, 49 of 75 negative, sign p=1.1%**, MW against that same-window baseline **p=0.5%** (so not tax-loss selling, not momentum), **−0.448% at 48/75, p=2.0%** against a size-closer benchmark, **14 of 19** with the cycle as the unit. But split by era it is entirely pre-2016: **2007–2015 −0.994% (24/32, p=0.7%, MW p=0.2%)** against **2016–2025 −0.271% (25/43, p=36.0%, MW p=23.4%)** and **2019–2025 −0.235% (19/35, p=73.6%, MW p=43.6%)**. That is Greenwood & Sammon's decaying index effect, confirmed **within one family across 19 cycles** instead of one — and it is exactly what the S&P sibling's float mechanism predicts for the 100 largest non-financial names on Nasdaq. **What is not dead is turnover, and it is not on this date.** The cohort's median relative turnover is **1.09× on the announcement session**, **1.25× on the reaction session** (against QQQ's 0.88×), and **4.90× / 4.77×** on the **implementation Friday 2027-12-17** — 85 of 85 and 74 of 75 above 1.0×, while QQQ prints 1.30× and SPY 1.88×. **And one index-level candidate was raised and killed on the control this corridor has now taught three times.** QQQ's relative volume minus SPY's on the reaction session runs **17 of 21 negative (p=0.7%)**, separates from the other quarters' announcement slot (**p=3.6%**) and from ordinary months (**p=0.0%**) — and is **indistinguishable from other Dec 8–18 sessions (MW p=50.8%**, control itself 82/122 at p=0.0%). In December the month is the confound.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** | High | The event is **457 days out**, `symbols` is empty by design, and no house playbook is index-flow-keyed — `trade-playbooks.md` and `multi-symbol-sweep.md` re-grepped this session for `rebalanc\|index effect\|index inclusion\|reconstitut\|deletion\|witching\|closing auction` → **zero hits** in both. The one measured effect is short-side and the house-wide short ban blocks it | A house playbook keyed to index flow or a closing auction landing in `trade-playbooks.md` before **2026-10-09**, this event's next scheduled pulse — there would then be a mechanism to point at this date |
| This week | **Stand aside** | High | Nothing about this event publishes for over a year — Nasdaq's 2027 roster does not exist until after the **2027-12-10** close, and the methodology fixes the date rather than a release | Nasdaq publishing a **methodology change** to the reconstitution schedule before **2026-10-09** — the sixth-trading-day-prior rule that dates this entry, and the second-Friday corollary that cross-checks it, would both stop applying |
| This month | **Do not re-run the index-level volume statistic, and do not re-derive the pooled removal effect without its era split** | High | The QQQ−SPY reaction-session deficit (17/21, p=0.7%) is recorded here as **refuted by its own same-window placebo** (MW p=50.8%), and the pooled removal effect (p=0.5%) is recorded as **carried entirely by 2007–2015** — a later pulse that quotes either without its control has re-found a December seasonal and a dead era | A December control this session could not build — a year with **no** NDX reconstitution — showing the QQQ−SPY mid-December deficit absent. No such year exists in the sample, which is precisely why the statistic stays dead rather than open |
| This quarter | **Treat 2027-12-17, not 2027-12-10, as the session in this chain that carries anything actionable — and it is an execution hazard in the NAMES, not a trade** | Medium | The named cohort's median relative turnover is **4.90× (adds) / 4.77× (removes)** on the implementation Friday, **18 of 19** cycles at ≥ 2.0× (min 1.80×, median of medians 4.64×), while QQQ shows 1.30× and SPY 1.88× on the same session — the flow is real, locatable, and nearly invisible in the index vehicle | The **2026-12-18** implementation session printing the 2026 cycle's named cohort below a **2.0×** median relative turnover — 18 of 19 historical cycles cleared it, and the one execution statement this ledger hands the corridor would be overbuilt. Registered as `FT-…-3` |

**Signals & conditions** — the buy/sell/hold triggers:

- Date is `estimate` — **owner-published rule, 21-of-21 second-Friday corollary, 19-of-19 against observed reconstitutions, no 2027 release yet**. It widens caution and licenses **no** date-keyed action.
- **The addition leg is a null in every era and on both benchmarks** — 48/85 (p=27.8%), MW vs baseline p=75.6%, **0 of 19** cycles reaching the S&P panel's +2.31%. The S&P family's magnitude does not transfer.
- **The removal leg is real pooled and dead modern** — quote it only with its era split. `−0.994%` pre-2016, `−0.271%` post, `−0.235%` since 2019. A pulse that reports the pooled p=0.5% alone is misreporting it.
- **Nothing extends past the reaction session** — reaction open through the effective close is a null on both legs (adds 46/85, p=51.5%; removes 38/74, p=90.8%; MW p=83.0%). Whatever the removal leg did, it did not persist.
- **The index vehicle sees none of it** — QQQ excess over SPY on the reaction session **10 of 21** negative (p=100.0%), NDX over GSPC **10 of 21** (p=100.0%), announcement session **9 of 21** (p=66.4%). Three ledgers now agree the vehicle is blind to this family's index flow.
- **The reference close is a null too** — the last trading day of November is the session that mechanically *determines* the roster, and it measures like any other month-end: QQQ relative volume **0.975× / 0.908×** (MW vs other month-ends **p=11.8%**, in the *quiet* direction), QQQ−SPY difference **−0.110×** against other month-ends' **−0.103×** (**MW p=95.4%**), excess return **11 of 21** (p=100.0%). Declined as a calendar entry on that measurement, not on ignorance.
- **The hazard, if any, is the 2027-12-17 close** — the same session `opex-2027-12-17` already tracks `confirmed` and the S&P sibling already sized at 1.79× median SPY volume. This ledger's contribution is the constituent number: **~4.8×** in the names being added or removed.
- **A correction to a sibling's label, which strengthens rather than weakens its kill.** `sp-quarterly-rebalance-effective-2027-12-20` used the **second Friday of December** as a placebo it called *"(nothing)"*. It is the announcement session. The placebo is still valid — the release lands after that close, so no reconstitution news trades during it — and it still measures like an ordinary December Friday (**−0.077×** vs **−0.099×** for December Fridays excluding the 2nd and 3rd, **MW p=31.7%**). The label was wrong; the inference was right.
- **The corridor is thin and dominated by something else** — **3** tracked ids within five days, all `estimate`: `fomc-2027-12-08` (**high**) at **T−2**, `sp-rebalance-reference-close-2027-12-10` on the **same session**, `vix-expiration-2027-12-15` at T+5. An FOMC two sessions earlier will dominate any tape reading of 2027-12-10.
- Chain: NDX reconstitution **reference close 2027-11-30** (roster determined; declined as an entry) → S&P DJI release ~**2027-12-03** → **NDX announcement + S&P reference close 2027-12-10** → reaction session **2027-12-13** → implementation at the **2027-12-17** close (`opex-2027-12-17`, `confirmed`) → **effective open 2027-12-20** (`sp-quarterly-rebalance-effective-2027-12-20`).

## Initial research

### The question

This id reached the calendar as one proposal from the [`sp-quarterly-rebalance-effective-2027-12-20`](sp-quarterly-rebalance-effective-2027-12-20.md)
initial research (2026-09-08), read in full first per the "your own event was proposed by others" rule. A sibling
lane filed the 2026 instance the next day
(`proposals/ndx-annual-reconstitution-announcement-2026-12-11.from-sp-quarterly-rebalance-effective-2026-12-21.json`,
2026-09-09) and it stands — this session writes only its own canonical file.

Both proposals did the same two things. They dated the announcement from the owner's methodology, and they
named — in capitals, twice — the thing neither could do:

> *"WHAT IS NOT CLAIMED: … that the NDX announcement moves NDX constituents the way the S&P announcement moves
> S&P ones, which is precisely the untested question and needs a constituent-level instrument this house does
> not own."*

The 2027 proposer put it as an instruction: *"A taking lane's first job is to check whether the reconstitution
announcement moves NDX constituents the way the S&P announcement moved S&P ones, which is the out-of-sample draw
that sibling's kill switch asked for."*

**So: does it? And if the S&P family's index effect is real at constituent level, why would the Nasdaq family's
be different?**

**One-line verdict:** it does not, in the way that matters — the **addition** leg has no effect in any era and
never approached the S&P panel's magnitude; the **removal** leg had a real one that **died around 2016**, which
is precisely what the S&P sibling's own float mechanism predicts for the largest non-financial names on Nasdaq;
and the only signature still alive is a **~4.8× turnover print in the names on the implementation Friday**, a
session this calendar already tracks under a different id.

### Method

Macro / market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md). The entry carries
`symbols: []`, so no symbol-keyed instrument applies and `scripts/research/` owns no index-flow instrument.
Nothing was inherited from either proposal or either sibling ledger.

- **The methodology PDF was re-fetched and re-extracted, not quoted from the proposals.**
  `indexes.nasdaqomx.com/docs/methodology_NDX.pdf`, HTTP 200, **422,314 bytes** (matching both proposals' byte
  count, which is itself a useful check that the document has not changed), 29 Flate streams inflated and the
  text layer rebuilt in-session. The extracted layer carries kerning-injected spaces, so every quote below was
  located by whitespace-normalised search and read back against the original span.
- **A secondary roster source, labelled as one.** Wikipedia's *Historical components of the Nasdaq-100*
  (`en.wikipedia.org/w/index.php?title=Historical_components_of_the_Nasdaq-100&action=raw`, HTTP 200,
  **63,555 bytes**), parsed to **226 dated change rows** with ticker *and* security name on both sides. This is
  the instrument both proposals said the house lacked, and it is a secondary source — every claim resting on it
  says so. The S&P sibling recorded a Wikipedia constituent route that *"fetched 200 and did not carry the
  table"*; that was the S&P page, and this is a different one.
- **Yahoo daily bars via `query1`** — QQQ, SPY, `^NDX`, `^GSPC`, `^IXIC`, `^VIX`, 1990→2026-09-08, plus **170**
  cohort tickers 2005→2026-09-08, all fetched this session with a contactable User-Agent. Raw volume for
  turnover, adjusted closes for returns.
- **An automated ticker-reuse guard, because a delisted ticker gets recycled.** Every cohort row's Wikipedia
  security name was matched against Yahoo's own `longName` for that ticker; **11 rows were dropped** where they
  disagreed. Three of the drops prove the guard earns its place: 2011's `GOLD` (Randgold Resources) now returns
  *Gold.com, Inc.*, 2013's `SHLD` (Sears Holdings) now returns *Global X Defense Tech ETF*, and 2015's `SPLS`
  (Staples) now returns a PIMCO ETF. Without the guard those three rows would have been silently wrong.
- **Sessions, not calendar days.** The announcement session is the sixth trading day prior to the effective
  open, computed on SPY's own session calendar; the **reaction session** is the next one, because the release
  lands after the announcement session's close. 21 cycles 2005–2025 for index-level work, **19** for
  constituent work (the change table starts in 2007).
- **Two fetches failed and are recorded, not substituted.** S&P DJI's methodology library
  (`methodology-sp-us-indices.pdf`) and its index-committee governance page both returned **403** to this runner
  — the same block three sibling ledgers recorded, re-confirmed rather than assumed. The consequence is stated
  in *Honest limits*: the "S&P is discretionary, Nasdaq is rules-based" explanation could not be sourced, so it
  is **not** the mechanism this ledger rests on.
- **This repo** — both proposals, [`sp-quarterly-rebalance-effective-2027-12-20`](sp-quarterly-rebalance-effective-2027-12-20.md),
  [`sp-quarterly-rebalance-effective-2026-09-21`](sp-quarterly-rebalance-effective-2026-09-21.md) and
  [`opex-2027-12-17`](opex-2027-12-17.md) read in full; the corridor computed from the calendar files rather
  than by eye; playbooks re-grepped.

### Conviction legs, tested

1. **The date is the second Friday of December 2027, and the rule now has an observed-history record rather than
   only arithmetic — SUPPORTED, and materially stronger than either proposal.** The methodology carries two
   schedules in one table, verbatim from this session's extraction:

   > *"Reconstitution Frequency: **Annually** … Reconstitution Reference Dates: **Last trading day of
   > November** … Reconstitution Announcement Dates: **After the close on the sixth trading day prior to the
   > Reconstitution Effective Date** … Reconstitution Effective Dates: **At market open on the first trading day
   > following the third Friday in December**"*

   > *"Rebalance Frequency: **Quarterly** … Rebalance Announcement Dates: **After the close on the sixth trading
   > day prior to the Rebalance Effective Date** … Rebalance Effective Dates: **At market open on the first
   > trading day following the third Friday in March, June, September, and December**"*

   The 2026 sibling proposal named the dual schedule first and it is credited here rather than re-claimed: in
   December the two coincide, so **one announcement carries both** the annual reconstitution and that quarter's
   rebalance. Two checks neither proposal ran:

   | Check | Result |
   |---|---|
   | The six-session count back always lands on the **second Friday of December** (no US holiday ever falls between the second and third Fridays) | **21 of 21** cycles 2005–2025, verified mechanically. December 2027's second Friday is **2027-12-10** |
   | The **effective-date** half of the rule against **observed** reconstitutions (Wikipedia change table, secondary) | **19 of 19** December blocks 2007–2025 land on the date the rule computes — 2007-12-24, 2008-12-22, 2009-12-21, 2010-12-20, 2011-12-19, 2012-12-24, 2013-12-23, 2014-12-22, 2015-12-21, 2016-12-19, 2017-12-18, 2018-12-24, 2019-12-23, 2020-12-21, 2021-12-20, 2022-12-19, 2023-12-18, 2024-12-23, 2025-12-22. Zero misses |

   The proposals' third estimate count — *"a forward application of a standing rule rather than a fetched
   schedule"* — is retired by the second row. What remains `estimate` is the **prefix** and the **unpublished
   2027 release**.

2. **HEADLINE (a) — the addition leg is a null in every era, on both benchmarks, and never approached the S&P
   panel's magnitude — SUPPORTED, and it answers half the untested question.** Excess return vs QQQ on the
   reaction session, 19 cohorts:

   | Addition leg | n | mean | median | positive | sign p | MW vs same-window baseline |
   |---|---|---|---|---|---|---|
   | **All, 2007–2025** | 85 | −0.007% | +0.222% | 48 / 85 | **27.8%** | **p=75.6%** (baseline n=1,785) |
   | 2016–2025 | 49 | +0.205% | +0.451% | 30 / 49 | 15.2% | p=15.8% (baseline n=1,029) |
   | All, vs `^IXIC` instead of QQQ | 85 | +0.127% | +0.359% | 49 / 85 | 19.3% | p=25.9% |

   And the transfer test that matters most, because it is a *magnitude* comparison rather than a significance
   one: the sibling lane's S&P panel measured **+2.31% mean directional excess** on the announcement session.
   Across 19 NDX cycles, the addition cohort's mean excess reached **+2.31% in 0 of 19** — the highest was
   **+1.36%** (2014) and the median cycle was **+0.01%**. Whatever the S&P announcement does to S&P additions,
   the NDX announcement has never done to NDX additions on this record.

3. **HEADLINE (b) — the removal leg is real pooled, survives every control I could build, and is entirely
   pre-2016 — SUPPORTED, with the era split as the load-bearing part.** Pooled first, because a reader will want
   to know it is not an artefact:

   | Removal leg, reaction session | n | mean | median | negative | sign p | vs control |
   |---|---|---|---|---|---|---|
   | Excess vs QQQ | 75 | **−0.579%** | **−0.575%** | **49 / 75** | **1.1%** | MW **p=0.5%** vs a 1,569-row baseline of the SAME names on other sessions in the SAME December window (that baseline: +0.128% mean, 798/1,569 negative, **p=51.2%** — a null) |
   | Excess vs `^IXIC` (size-closer) | 75 | −0.448% | −0.501% | 48 / 75 | **2.0%** | MW **p=2.0%** vs its own baseline |
   | Cycle as the unit of observation | 19 | −0.811% | −0.606% | **14 / 19** | **6.4%** | — (the honest weakening: names within a cohort are not independent) |
   | Pre-news control: the announcement session itself | 75 | −0.136% | −0.384% | 44 / 75 | 16.5% | MW **p=35.0%** vs baseline — **nothing before the release** |

   The same-window baseline is the control that matters, and it is what separates this from the two statistics
   the sibling ledger killed. Additions are recent winners and removals recent losers **by construction** — a
   signed spread between winners and losers in mid-December is exactly what momentum or tax-loss selling would
   manufacture. It does not appear: the same 75 names on 21 other sessions in the same window print **+0.128%
   mean at 798/1,569, p=51.2%**. Then the era split:

   | Removal leg by era | n | mean | median | negative | sign p | MW vs own-era baseline | cycle-as-unit |
   |---|---|---|---|---|---|---|---|
   | **2007–2015** | 32 | **−0.994%** | −0.939% | 24 / 32 | **0.7%** | **p=0.2%** | **8 / 9, p=3.9%** |
   | **2016–2025** | 43 | −0.271% | −0.330% | 25 / 43 | **36.0%** | **p=23.4%** | 6 / 10, p=75.4% |
   | **2019–2025** | 35 | −0.235% | −0.156% | 19 / 35 | **73.6%** | **p=43.6%** | — |
   | 2016–2025 vs `^IXIC` | 43 | −0.119% | −0.242% | 24 / 43 | 54.2% | p=48.5% | — |

   The pooled `p=0.5%` is carried entirely by the first row. **This is Greenwood & Sammon's decaying index
   effect** — which [`sp-rebalance-proforma-2026-09-04`](sp-rebalance-proforma-2026-09-04.md) banked and
   [`sp-quarterly-rebalance-effective-2026-09-21`](sp-quarterly-rebalance-effective-2026-09-21.md) confirmed for
   the S&P 500 while refuting it one tier down — reproduced **within one family, across 19 cycles**, which is a
   far stronger draw than one announcement. And it is the *predicted* result: that sibling's mechanism was
   **flow relative to a name's float**, and NDX's members are the 100 largest non-financial companies on Nasdaq,
   i.e. the S&P-500 end of the size distribution, not the SmallCap-600 end where the effect survived.

4. **Nothing extends past the reaction session — SUPPORTED, and it is why leg 3 is a measurement rather than a
   position.** Reaction-session **open** through the **effective close**, excess vs QQQ:

   | Path | n | mean | median | signed correctly | sign p |
   |---|---|---|---|---|---|
   | Additions | 85 | +0.432% | +0.525% | 46 / 85 positive | 51.5% |
   | Removals | 74 | +0.935% | −0.221% | 38 / 74 negative | 90.8% |

   Mann-Whitney additions vs removals over the path: **p=83.0%**. A one-session move that does not extend, in a
   direction that is short-side and blocked house-wide, on a magnitude of −0.58% pooled and −0.24% since 2019,
   is a finding about market structure and not a trade.

5. **HEADLINE (c) — turnover is the one live signature, and it peaks on a different session — SUPPORTED.**
   Median relative turnover (each name's volume over its own trailing-60 median), by session:

   | Session | Additions | Removals | QQQ, same session | SPY, same session |
   |---|---|---|---|---|
   | Announcement session (2027-12-10's analogue; release lands after its close) | 0.996× | 1.092× | 1.044× | — |
   | **Reaction session** | **1.268×** | **1.243×** | **0.876×** | — |
   | **Implementation Friday** (2027-12-17's analogue) | **4.900×** (85/85 above 1.0×) | **4.773×** (74/75) | **1.295×** | **1.877×** |

   Two things fall out. **The announcement does produce a flow footprint** — turnover steps from ~1.0× before
   the release to ~1.25× after it, against an index vehicle running *quiet* at 0.88× — so the announcement is
   information that moves **volume** even in the era where it stopped moving **price**. That is what an
   efficient market should do with a mechanically-determined roster change. And **the flow itself prints on the
   implementation Friday**, at ~4.8× in the names against 1.30× in QQQ: the S&P sibling's finding that the index
   vehicle is blind to constituent-level index flow, quantified for the Nasdaq family. Per cycle, the cohort's
   median cleared **2.0× in 18 of 19** (minimum 1.80× in 2008, median of medians **4.64×**) and 3.0× in 16 of 19.

6. **An index-level candidate was raised and killed by the same-window control, making this the third statistic
   in this corridor to die that way — SUPPORTED.** QQQ's relative volume **minus** SPY's on the reaction session
   (a difference, because a December trailing-60 window contains Thanksgiving week and inflates both ratios):

   | Bucket | n | mean | median | negative | sign p |
   |---|---|---|---|---|---|
   | **Reaction session (December)** | 21 | **−0.153** | **−0.110** | **17 / 21** | **0.7%** |
   | Mar/Jun/Sep announcement-reaction slot (rebalance announcement, no reconstitution) | 65 | +0.023 | −0.009 | 33 / 65 | 100.0% |
   | The other eight months' same slot (no announcement at all) | 174 | +0.029 | +0.007 | 84 / 174 | 70.5% |

   Mann-Whitney separates December from the quarterly slot (**p=3.6%**) and from ordinary months (**p=0.0%**).
   Tempting — and the control is decisive:

   | Control | n | mean | median | negative | sign p | MW vs the event |
   |---|---|---|---|---|---|---|
   | **Other Dec 8–18 sessions** | 122 | −0.115 | −0.097 | 82 / 122 | **0.0%** | **p=50.8%** |
   | All other December sessions | 400 | −0.084 | −0.070 | 258 / 400 | **0.0%** | p=15.9% |
   | Other December Mondays | 65 | −0.057 | −0.053 | 42 / 65 | 2.5% | p=5.5% |
   | All other Mondays 2005–2025 | 968 | +0.014 | +0.003 | 478 / 968 | 72.4% | p=0.1% |
   | Placebo: session after the **first** Friday of December | 21 | −0.047 | −0.046 | 13 / 21 | 38.3% | p=11.0% |

   QQQ runs quiet against SPY through **all** of mid-December; it is not a Monday effect (all other Mondays sit
   at chance) and it is not this event. The era steepening is the seasonal's too: the Dec 8–18 control itself
   goes from −0.088 (2005–2015) to −0.116 (2016–2025), and event-versus-control is insignificant in **both**
   eras (**p=75.5%** early, **p=19.6%** late). [`opex-2027-12-17`](opex-2027-12-17.md) killed a post-expiration
   drift this way (raw P=0.064 → era-ranked 0.0047 → same-window control P=0.487); the S&P sibling killed a gap
   effect and a cross-vehicle volume deficit this way; this is the third. **In December, the month is the
   confound.**

7. **The index vehicle sees nothing on this event's own sessions — SUPPORTED, consistent with both siblings.**

   | Channel, 21 cycles | Announcement session | Reaction session |
   |---|---|---|
   | QQQ excess return over SPY | 9 / 21 negative, sign **p=66.4%** | 10 / 21 negative, sign **p=100.0%** |
   | `^NDX` excess return over `^GSPC` | 10 / 21, **p=100.0%** | 10 / 21, **p=100.0%** |
   | QQQ relative volume | 1.024× / 1.044× (MW vs Q3 slot **p=31.2%**, vs other months **p=94.1%**) | 0.919× / 0.842× (MW **p=36.3%** / **p=91.8%**) |
   | Cumulative `^NDX`−`^GSPC`, announcement close → effective close | — | 9 / 21 negative, **p=66.4%** |

8. **The reference close — the session that mechanically determines the roster — is a null, so it is declined as
   a calendar entry — SUPPORTED.** The methodology ranks all eligible companies by full market capitalisation
   *as of the last trading day of November*; top 75 auto-select, current members in the top 100 are retained,
   and 101st–125th are retained conditionally. That makes **2027-11-30** the session where the roster is
   actually decided. It measures like any other month-end:

   | Reference close (21 cycles) | Reading | Control | Test |
   |---|---|---|---|
   | QQQ relative volume | 0.975× / 0.908× | other month-ends 1.138× / 1.023× | MW **p=11.8%**, in the *quiet* direction |
   | QQQ−SPY relative-volume difference | −0.110 | other month-ends −0.103 | MW **p=95.4%** — indistinguishable |
   | QQQ excess return over SPY | 11 / 21 negative | — | sign **p=100.0%** |
   | Session after (first of December): QQQ excess | 11 / 21 | — | **p=100.0%** |

   Notably there is also **no pre-announcement drift** in the constituent panel (leg 3's baseline covers offsets
   −15 through −3 and is a null), so the market is not front-running a roster it could in principle compute.
   The honest reading is not "predictable, therefore priced" but the S&P sibling's own one: **the flow is too
   small relative to these names' float to move price in either window.**

9. **No house playbook fits — SUPPORTED, re-verified not inherited.** `trade-playbooks.md` and
   `multi-symbol-sweep.md` re-grepped this session for
   `rebalanc|index effect|index inclusion|reconstitut|deletion|witching|closing auction`: **zero hits** in both.
   The one measured effect is short-side, and shorting is blocked house-wide.

10. **The corridor is thin and dominated by something else — SUPPORTED.** **3** tracked ids sit within five days
    of 2027-12-10, computed from the calendar files, all three `estimate`: `fomc-2027-12-08` (**high**) at
    **T−2**, `sp-rebalance-reference-close-2027-12-10` on the **same session**, and
    `vix-expiration-2027-12-15` at T+5. Both of the latter two were sibling lanes' proposals when this session
    began and landed as canonical files on `main` while it was in flight; neither changed impact or status, so
    the corridor's composition is as measured. An FOMC decision two sessions earlier will dominate any tape
    reading of this date, which is a reason to score this event's forward tests on **cohort cross-sections**
    rather than on the session's index behaviour.

### What the conditions support

Nothing directional, on any horizon — and unlike the two proposals, that refusal now rests on a measurement
rather than on an absence. **The untested question is answered.** The addition leg has no effect in any era and
never reached a fifth of the S&P panel's magnitude; the removal leg had a real one and lost it around 2016,
exactly as the S&P sibling's float mechanism predicts for the largest non-financial names on Nasdaq. **The
instrument both proposals said the house lacked now exists** — 19 cohorts, 237 named rows, an automated
ticker-reuse guard that caught three rows that would have been silently wrong — and it is reusable by any lane
researching an index-membership event in this family. **One statistic is recorded as dead** so a later pulse does
not rediscover it: the 17-of-21 QQQ−SPY reaction-session deficit is mid-December, not this event. **One number is
handed to the corridor**: the named cohort turns over ~4.8× its own median on the implementation Friday
2027-12-17, 18 of 19 cycles above 2.0×, while QQQ shows 1.30× — an E1-class execution caution for anyone holding
a name on that list, not a trade.

**Three milestones were deliberately NOT proposed**, recorded so a later lane does not re-litigate them.
`ndx-reconstitution-reference-close-2027-11-30` is declined on **leg 8's measurement**: it is the session that
decides the roster and it is invisible on every channel tried, and 2027-11-30 already carries two tracked events,
so filing it would put a measured null on an already-tracked session — the same ground the 2027 S&P sibling
declined `ndx-annual-reconstitution-effective-2027-12-20` on, and that decline still stands on this session's own
data (leg 4's path null and leg 7's vehicle null). `ndx-annual-reconstitution-announcement-2026-12-11` is not
proposed because a sibling lane already filed it. And the **implementation Friday 2027-12-17** needs no new file:
it is `opex-2027-12-17`, `confirmed` on OCC's own calendar, and leg 5's turnover number belongs in that
corridor's reading rather than in a new entry.

### Honest limits

**The roster source is secondary.** Every constituent claim rests on a Wikipedia change table, not on Nasdaq's
own releases, and it is labelled that way throughout. Its 19-of-19 agreement with the methodology-derived
effective dates is strong corroboration of the *dates*, and says less about the completeness of the *names* in
any given block. **Coverage is incomplete and asymmetric.** 88 of 117 named additions (75%) and 78 of 120 named
removals (65%) had usable bars; the attrition is concentrated on removals that were later acquired or taken
private, so the removal panel is **survivor-tilted**. If the dropped names fared worse on their announcement,
leg 3's pooled effect is understated — which cuts against the era-decay conclusion in the early sample (where
attrition is heaviest) and therefore does not rescue the modern-era null. **The cross-sectional control is
missing.** Leg 3's baseline is a *time*-dimension control — the same names on other sessions in the same window
— which is what kills the momentum and tax-loss stories. It is not a matched control group of similar Nasdaq
names that were *not* reconstituted; the addition leg serves as a partial stand-in (same family, same window,
null) but a properly matched cohort would be better and needs a historical Nasdaq market-cap panel this house
does not have. **The 2016 crossover is a split, not an estimate.** It was chosen as the midpoint of the sample
before the era numbers were read, and the effect fades rather than steps: 2019–2025 is weaker still, so the
finding is "decaying" rather than "broke in 2016". **The discretionary-versus-rules explanation is not
sourced and is not this ledger's mechanism.** S&P DJI's methodology library and its index-committee governance
page both returned 403, so the natural story — that an S&P committee announcement carries news a rules-based
Nasdaq ranking does not — could not be read from a primary and is deliberately *not* what legs 2 and 3 rest on.
They rest on float, which is sourced to the S&P sibling's own measurement. **n=21 and n=19 govern the index-level
work**, so every Mann-Whitney involving a December bucket is underpowered; leg 6 is killed on the *pattern* of
its controls rather than on one p-value. **Relative volume in December is structurally inflated** because the
trailing-60 window contains Thanksgiving week; every cross-vehicle figure here is a difference for that reason,
and the single-vehicle levels (0.876×, 4.900×) should be read against each other, not as absolutes. **The date is
`estimate`** and every trading-adjacent statement above carries that label; Nasdaq's 2027 release does not exist,
`symbols` is empty by design, shorting is blocked house-wide, and no house playbook is index-flow-keyed.

## Stance & kill switches

**Stance (date `estimate`, `EST:` from the owner's own methodology re-extracted this session, with a 21-of-21
second-Friday corollary and a 19-of-19 record against observed reconstitutions — prefix-gapped and
one-release-early rather than unsourced).** Treat 2027-12-10 as **a well-dated session whose research value is
that it closes an open question with three negatives and one execution number**. Four legs. **(a) The date is
now the strongest evidence class this lane can reach without a confirmed-tier prefix** — the methodology fixes
it, the second-Friday corollary cross-checks it without needing session data, and the effective-date half of the
same rule matches 19 of 19 observed reconstitutions; only the taxonomy gap and the unpublished 2027 release
remain. **(b) The untested question is answered and the answer is asymmetric.** Additions: null in every era, on
both benchmarks, and **0 of 19** cycles reaching the S&P panel's +2.31%. Removals: **−0.579%** pooled at 49/75
(sign p=1.1%, MW p=0.5% against a 1,569-row same-window baseline, robust to benchmark and to cycle-level
clustering) but **−0.271% at p=36.0%** since 2016 and **−0.235% at p=73.6%** since 2019 — a decaying effect, and
the decay is what the S&P sibling's float mechanism predicts for these names. Quote the pooled number only with
its era split. **(c) Nothing here is a position.** The one live price effect is short-side and blocked, it does
not extend past the reaction session (path p=51.5% / p=90.8%), the index vehicle is blind to all of it, and no
playbook is keyed to index flow. **(d) The live signature is turnover, on 2027-12-17 rather than 2027-12-10** —
~4.8× in the named cohort against 1.30× in QQQ, 18 of 19 cycles above 2.0×. Carry forward the lesson that
outlives this event, and note it is the **third** statistic in this corridor to earn it: **in December, the month
is the confound — a statistic that separates from other quarters, other months and other weekdays but has never
been shown another session in the same calendar window has not been tested.** And carry the corollary this
ledger adds: **a cross-sectional statistic needs the same discipline** — a winners-versus-losers spread in
December is momentum until the same names on neighbouring sessions say otherwise.

**Kill switches:**

- **Nasdaq's 2027 annual reconstitution is announced on any date other than after the close on 2027-12-10** —
  the methodology-derived date, its second-Friday corollary and its 19-of-19 observed record would all break at
  once, and this entry is misdated rather than merely re-assessable. Registered as `FT-…-1`.
- **The 2026-12-11 cycle's NDX addition cohort prints a mean excess over QQQ above +2.31% on 2026-12-14** —
  leg 2's null fails on the nearest out-of-sample draw against a 19-of-19 base rate, and the S&P family's
  announcement magnitude does transfer to the Nasdaq family after all. Registered as `FT-…-2`.
- **The 2026-12-18 implementation session prints the 2026 cycle's named cohort below a 2.0× median relative
  turnover** — leg 5's execution number fails on its own draw against 18 of 19, and the one caution this ledger
  hands the corridor is overbuilt. Registered as `FT-…-3`.
- **QQQ's relative volume on 2027-12-13 exceeds SPY's by more than +0.20×** — leg 7's vehicle null fails on the
  reaction session this event owns, against a base rate of **21 of 21** under that step (maximum +0.168×), and
  the announcement would be moving index-level flow after all. Registered as `FT-…-4`.
- **Nasdaq publishes a methodology change moving the reconstitution announcement off the sixth-trading-day-prior
  rule, or the reconstitution off December** — the entry is invalidated rather than adjusted, and the
  second-Friday corollary stops holding.
- **A later lane builds a matched cross-sectional control — similar Nasdaq names not reconstituted, same
  sessions — and the removal effect disappears in the pre-2016 era too** — leg 3's pooled finding would collapse
  into a size-and-momentum artefact, and the only honest survivor of this ledger would be leg 5's turnover.
- **The removal effect reappears at pre-2016 strength in a modern cycle with a large cohort** — the decay in leg
  3 would be a small-sample illusion rather than the Greenwood & Sammon pattern, and the modern-era null would
  need retracting. The 2026 and 2027 cycles are the next two draws.
- **A primary Nasdaq source shows the reconstitution is not fully determined by the reference-date ranking**
  (a discretionary override, an eligibility screen applied after the fact) — leg 8's framing of 2027-11-30 as
  the deciding session weakens, and the reference close might deserve an entry after all.

**Registered forward tests.** `FT-ndx-annual-reconstitution-announcement-2027-12-10-1` through `-4` — see
[`forward-tests/ndx-annual-reconstitution-announcement-2027-12-10.md`](../forward-tests/ndx-annual-reconstitution-announcement-2027-12-10.md).
Observations, never templates. All four score inside or before the close-out window, and each adjudicates a claim
this ledger *makes* rather than a hypothesis it hopes for — `-1` the date, `-2` the addition-leg null, `-3` the
one execution number, `-4` the index-vehicle null on this event's own reaction session.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-09 | D-457 | Initial research banked; canonical `src/domain/market-events/<id>.json` written this session (the id existed only as `proposals/…from-sp-quarterly-rebalance-effective-2027-12-20.json`, read in full first; the 2026 sibling's `proposals/ndx-annual-reconstitution-announcement-2026-12-11.from-…-2026-12-21.json` stands untouched). **This is the calendar's first canonical Nasdaq-100 milestone in any year.** probe-ref baseline set (no symbols by design, **VIX 15.72**, band `low:15+`, **3** adjacents, **2** blocked fetches). **DATE RE-SOURCED AND CROSS-CHECKED TWICE:** methodology PDF re-fetched (HTTP 200, **422,314 B**, 29 streams inflated, text layer rebuilt in-session) — *"Announcement Dates: After the close on the sixth trading day prior to the … Effective Date"*, *"Effective Dates: At market open on the first trading day following the third Friday in December"*; **(i)** the count-back always lands on the **second Friday of December** because no holiday falls in that span — **21 of 21** cycles 2005-2025, and Dec 2027's second Friday is **2027-12-10**; **(ii)** the effective-date half matches **19 of 19** observed December reconstitutions 2007-2025 (Wikipedia change table, **secondary**, 63,555 B). Retires the proposals' third estimate count; taxonomy gap + unpublished 2027 release remain. **THE QUESTION BOTH PROPOSALS FLAGGED IN CAPITALS IS ANSWERED — A CONSTITUENT INSTRUMENT WAS BUILT:** 19 cohorts, **237** named rows, **11** dropped by an automated ticker-reuse guard (Wikipedia security name vs Yahoo `longName`; it caught 2011 `GOLD`→*Gold.com*, 2013 `SHLD`→*Global X Defense Tech ETF*, 2015 `SPLS`→*PIMCO ETF*), **66** without usable bars — **88/117 adds (75%)**, **78/120 removes (65%)**, attrition survivor-tilted on removes. **ADDITIONS ARE A NULL EVERYWHERE:** 48/85 positive excess vs QQQ on the reaction session (**p=27.8%**), MW vs a **1,785-row** same-window baseline **p=75.6%**; 2016-2025 30/49 (**p=15.2%**); vs `^IXIC` 49/85 (**p=19.3%**); and **0 of 19** cycle means reached the S&P panel's **+2.31%** (max **+1.36%**, median +0.01%). **REMOVALS ARE REAL POOLED AND DEAD MODERN:** **−0.579%/−0.575%, 49/75, p=1.1%**, MW **p=0.5%** vs a **1,569-row** baseline of the SAME names on other Dec-window sessions (that baseline +0.128%, 798/1569, **p=51.2%** — so **not** momentum and **not** tax-loss selling); robust to benchmark (**−0.448%**, 48/75, **p=2.0%** vs `^IXIC`) and to clustering (**14/19**, **p=6.4%**); pre-news session a null (**p=35.0%** vs baseline). But **2007-2015 −0.994% (24/32, p=0.7%, MW p=0.2%, cycles 8/9 p=3.9%)** vs **2016-2025 −0.271% (25/43, p=36.0%, MW p=23.4%)** vs **2019-2025 −0.235% (19/35, p=73.6%, MW p=43.6%)** — Greenwood & Sammon's decay, reproduced **within one family across 19 cycles**, and the outcome the S&P sibling's **float** mechanism predicts for the 100 largest non-financials on Nasdaq. **NOTHING EXTENDS:** reaction open → effective close null on both legs (adds 46/85 **p=51.5%**; removes 38/74 **p=90.8%**; MW **p=83.0%**). **THE LIVE SIGNATURE IS TURNOVER, ON A DIFFERENT SESSION:** cohort median relative turnover **0.996×/1.092×** on the announcement session → **1.268×/1.243×** on the reaction session (QQQ **0.876×**) → **4.900×/4.773×** on the **implementation Friday**, **85/85** and **74/75** above 1.0×, against QQQ **1.295×** / SPY **1.877×**; per cycle ≥2.0× in **18/19** (min 1.80×, median-of-medians **4.64×**). So the announcement moves **volume** even where it no longer moves **price**. **AN INDEX-LEVEL CANDIDATE RAISED AND KILLED — THE THIRD IN THIS CORRIDOR:** QQQ−SPY relvol difference on the reaction session **−0.153/−0.110, 17/21, p=0.7%**, separating from the Mar/Jun/Sep announcement slot (**MW p=3.6%**) and ordinary months (**p=0.0%**) — dies against **other Dec 8-18 sessions** (n=122, −0.115/−0.097, 82/122 at p=0.0%, **MW p=50.8%**), all other Dec sessions (**p=15.9%**), and is not a Monday effect (all other Mondays +0.014, 478/968, **p=72.4%**); the era steepening is the control's too (−0.088→−0.116, **MW p=9.9%**; event-vs-control **p=75.5%** early, **p=19.6%** late). **VEHICLE NULL ON THIS EVENT'S OWN SESSIONS:** QQQ excess over SPY 9/21 (**p=66.4%**) on the announcement session and 10/21 (**p=100.0%**) on the reaction session; `^NDX`−`^GSPC` 10/21 both (**p=100.0%**); cumulative ann→eff 9/21 (**p=66.4%**). **THE REFERENCE CLOSE — THE SESSION THAT DECIDES THE ROSTER (top-75 auto-select, top-100 retention, 101st-125th conditional, all as of the last November session) — IS A NULL TOO:** QQQ relvol **0.975×/0.908×** (MW vs other month-ends **p=11.8%**, *quiet* direction), QQQ−SPY difference **−0.110** vs month-ends' **−0.103** (**MW p=95.4%**), excess 11/21 (**p=100.0%**), and no pre-announcement drift in the panel. **A SIBLING'S PLACEBO LABEL CORRECTED, WHICH STRENGTHENS ITS KILL:** `sp-quarterly-rebalance-effective-2027-12-20` used the **second Friday of December** as a placebo it called *"(nothing)"* — it is the announcement session; the release lands after that close so no news trades during it, and it still measures like an ordinary December Friday (**−0.077** vs **−0.099** for Dec Fridays excl. 2nd/3rd, **MW p=31.7%**). **Adjacency — peers:** none (`symbols: []`); the 166-row constituent cohort is the finding, not a peer sweep. **Macro:** **3** tracked ids within 5d, all `estimate` — `fomc-2027-12-08` (**high**) **T−2**, `sp-rebalance-reference-close-2027-12-10` same session, `vix-expiration-2027-12-15` T+5 (the latter two were sibling proposals when this session began and landed canonical on `main` mid-flight, unchanged in impact and status); an FOMC two sessions earlier will dominate any tape reading of this date. **Vol:** baseline, no prior; **VIX 15.72** (2026-09-08 daily bar). **Geopolitical:** nothing touching index methodology. **Event tape:** playbooks + sweep re-grepped incl. `reconstitut|index effect|index inclusion|deletion|closing auction` → **zero hits**. **BLOCKED, NOT SUBSTITUTED:** spdji `methodology-sp-us-indices.pdf` **403** and spdji `governance/index-committee/` **403**, so the "S&P committee is discretionary, Nasdaq is rules-based" story is **not** sourced and deliberately **not** the mechanism legs 2-3 rest on (that is float, sourced to the Sept-2026 S&P sibling). **NO NEW DATED ADJACENT FILED, AND THREE DECLINED ON THE RECORD:** `ndx-reconstitution-reference-close-2027-11-30` (a measured null on a date already carrying two tracked events), `ndx-annual-reconstitution-effective-2027-12-20` (the 2027 S&P sibling's decline, re-confirmed on this session's own path and vehicle nulls), and the implementation Friday (already `opex-2027-12-17`, `confirmed`; leg 5's number belongs in that reading, not a new entry). Registered **FT-…-1** (Nasdaq announces after the 2027-12-10 close), **FT-…-2** (the 2026 add cohort's mean excess stays below +2.31% on 2026-12-14), **FT-…-3** (the 2026 cohort's median relative turnover ≥ 2.0× on 2026-12-18), **FT-…-4** (QQQ's 2027-12-13 relvol does not exceed SPY's by >+0.20×). | — (stance set: **stand aside** Today/week, **do not re-run the dead index-level statistic or quote the pooled removal effect without its era split** this month, and **treat 2027-12-17 rather than 2027-12-10 as the session carrying anything actionable — an execution hazard in the names, not a trade** this quarter; the refusal rests on a methodology-fixed date with a 21-of-21 corollary and a 19-of-19 observed record, an addition leg that is null in every era and never reached a fifth of the S&P panel's magnitude, a removal leg that is real pooled and dead since 2016 and short-side-blocked anyway, no persistence past one session, a blind index vehicle, and no playbook or instrument keyed to index flow — with one open question, whether a **matched cross-sectional** control leaves the pre-2016 removal effect standing, which needs a historical Nasdaq market-cap panel this house does not own) | 2026-10-09 (band `low:15+`, every 30d). Close-out by 2027-12-16 |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint notes any
row past ~1,200 chars): it is a note to the next session, not an essay, and a stance *change* earns its
sentence in the Stance section with the row as its receipt. The adjacency sweep (peer prints · macro
surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in every row; a dated
adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-ndx-annual-reconstitution-announcement-2027-12-10.json`
(`status: "estimate"`) in the same PR — your own file, never another event's canonical one (#1717).
Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from
memory — after which this doc goes quiet.
