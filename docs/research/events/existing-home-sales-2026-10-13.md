# Existing-Home Sales (NAR, September 2026 data) — existing-home-sales-2026-10-13

**Kind:** macro-print · **Date:** 2026-10-13 (**confirmed**, `IR:` NAR's own 2026 Statistical News Release Schedule — nar.realtor/press-releases/nar-statistical-news-release-schedule, fetched direct 2026-09-08, "OCTOBER | Tue., Oct. 13 | September Existing-Home Sales", plus its `.docx` twin whose `docProps/core.xml` records creation 2025-11-06; promoted this session from two competing `EST:` proposals) · **Impact:** low
**Last assessed:** 2026-09-08
<!-- probe-ref: {"symbols":{},"vix":15.26,"daysBand":"low:15+","adjacentIds":["beige-book-2026-10-14","cpi-2026-10-14","ecb-account-2026-10-08","g20-fmcbg-bangkok-2026-10-15","import-export-prices-2026-10-16","imf-world-bank-annual-meetings-2026-10-12","industrial-production-2026-10-16","mtis-2026-10-15","norway-gpfg-ethics-committee-2026-10-15","opex-2026-10-16","ppi-2026-10-15","retail-sales-2026-10-15","sifma-bond-market-closure-2026-10-12","ssa-cola-2027-2026-10-14","treasury-30y-bond-2026-10-08","treasury-buyback-10y20y-2026-10-15","treasury-buyback-20y30y-2026-10-08","treasury-coupon-announcement-2026-10-15","treasury-primary-dealer-agenda-2026-10-16","wholesale-trade-2026-10-08"],"screenStreak":0,"blocked":[{"url":"https://fred.stlouisfed.org/graph/fredgraph.csv?id=MORTGAGE30US","status":"CONNECTION_FAILED","at":"2026-09-08"},{"url":"https://www.atlantafed.org/-/media/documents/cqer/researchcq/gdpnow/GDPTrackingModelDataAndForecasts.xlsx","status":"404","at":"2026-09-08"},{"url":"https://www.atlantafed.org/-/media/documents/cqer/researchcq/gdpnow/GDPNowcastDataReleaseDates.xlsx","status":"404","at":"2026-09-08"},{"url":"https://www.nahb.org/-/media/NAHB/news-and-economics/docs/housing-economics/release-schedule.pdf","status":"SOFT_404_HTML","at":"2026-09-08"}]} -->

## At a glance

**TL;DR.** **Stand aside on the print, and fix the instrument two sibling ledgers are about to read it
with.** 2026-10-13 is an empty Tuesday — nothing else this calendar tracks lands on it — and the tape
says the print itself is inert: **114** existing-home-sales release days over **2,514** sessions leave
SPY (p=**0.66**), ITB (p=**0.58**) and XHB (p=**0.45**) at baseline, and so do the **100** solo ones.
It sits **outside** any FOMC blackout (the 10-28 meeting's window opens **2026-10-17**), which removes
the one regime measured to widen homebuilders. What makes this edition worth a session is that it is
the **free rehearsal** two siblings keyed their kill switches to — and the switch names a sheet that
cannot answer. `ContribArchives` is a strict concatenation of **49** completed-quarter blocks (**0**
overlap) that today ends **2026-07-28**; the live 2026:Q3 run sits in `ContribHistory` in the same
workbook. A 10-13 vintage is a Q3 vintage, and Q3 does not close until **2026-10-28**, so
"no `ContribArchives` vintage dated 2026-10-13 by 2026-10-16" is **false by construction**. The fix is
the **sheet**, not the date. Date is `confirmed` on NAR's own calendar; the call is stand aside on
every horizon.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-35) | **Stand aside** | High | `symbols: []` re-derived on **2,514** sessions (2016-09-06 → 2026-09-04, Nasdaq API), reproducing both siblings within **0.01pp** on an independent pull: **114** EHS days leave ITB (p=0.58), XHB (p=0.45) and SPY (p=0.66) at baseline, and the **100** solo ones do too. A re-run grep of `trade-playbooks.md` and `multi-symbol-sweep.md` returns **0** housing hits — no instrument attaches on any date. | A macro- or housing-keyed playbook landing in `docs/plans/trade-playbooks.md` before **2026-10-13** — none exists today |
| This week | **Stand aside — nothing about this event is live this week** | High | D-35 is the far end of the `low` band (`15+`, every 30 days), so the next look is **2026-10-08** by cadence and there is no in-week observation to make. This week's homebuilder tape belongs to the **2026-09-10** sibling's session and the **2026-09-11** CPI, both inside the current blackout (opened 2026-09-05), not to a print five weeks out. | Any dated NAR notice changing the 2026-10-13 release before **2026-10-08**, which would pull this event forward out of its band |
| This month | **Watch 2026-10-13 on `ContribHistory`, not `ContribArchives` — and read the sheet, not the headline** | High | The rehearsal fires this month. 10-13 is **unscheduled** on the Fed's `PostedUpdates`, the shape that produced a **solo** existing-home-sales vintage on **6 of 6** unscheduled 2026 dates (including **2026-08-11**, out of sample for both siblings). But the sheet 11-12's switch names carries **only completed quarters** — 49 of 49 blocks, currently ending 2026-07-28 — and Q3 closes **2026-10-28**. Registered as `-1` and `-2`. | A vintage dated **2026-10-13** appearing in `ContribArchives` by **2026-10-19** (kills the block model and my Leg 2), **or** no 10-13 vintage in `ContribHistory`/`CurrentQtrEvolution` by **2026-10-19** (kills the 6-of-6 solo base rate) |
| This quarter | **Treat the ≥0.30pp residential switch as retired for 2026 editions** | Medium | Both siblings call ≥0.30pp "far past anything in the class." Measured: **5 of 123** solo EHS vintages (**4.1%**) cleared it — and **all five** immediately followed a **housing-starts** vintage, while **0 of 22** that followed anything else ever did (max **0.2021pp**). NAR's 2026 calendar moved EHS *ahead* of starts: **111 of 133** EHS vintages 2014-2025 followed starts, **0 of 7** in 2026 do, and 2026's seven Δresidential readings top out at **0.0595pp**. Registered as `-4`. | The 2026-10-13 vintage moving Q3-2026 residential investment by **≥0.30pp** — which would mean the switch still has a channel after the reordering, scored by **2026-10-19** |

**Signals & conditions** — the buy/sell/hold triggers:

- **No buy and no sell signal exists off this event.** Inert on 114 EHS days and on the 100 solo ones;
  no macro- or housing-keyed playbook exists. Research is not action, and `confirmed` is not licence.
- **Read `ContribHistory`/`CurrentQtrEvolution` on 10-13, never `ContribArchives`.** The archive
  structurally excludes the running quarter; the current-quarter sheets carry the same `Data releases`
  text on the day itself.
- **This session is NOT the blackout session.** The 10-28 meeting's window opens **2026-10-17**; the
  regime measured to widen ITB **+9%** (p<0.001, n=678) is absent here, unlike on 2026-09-10.
- **A wide Tuesday is not the print, and there is no base rate saying it will be narrow either.**
  10-13's exact shape — the session after a bond-only closure *and* one day before CPI — has hosted
  **0 of 114** past EHS releases. Both components measure flat; the compound (n=**5**) does not, and
  n=5 is noise, not a finding.
- **The corridor's real events are 10-14 and 10-15**, not 10-13: CPI + Beige Book Wednesday, PPI +
  retail sales Thursday, opex Friday, blackout Saturday.
- **Watch (dated)** — bond-market closure **10-12** (equities open) · **this print 10-13** · **CPI**
  + Beige Book **10-14** · PPI + retail sales **10-15** · **opex 10-16** · blackout opens **10-17** ·
  NAHB HMI **10-19** (proposed here) · September PHSI **10-20** · **FOMC 10-27/28** · Q3 GDP advance
  **10-29** · October data **11-12** · November data **12-09**.

## Initial research

### The question, plainly

This id reached the calendar as **two** competing proposals filed the same day, 2026-09-08, by two
sibling sweeps that disagreed about what it is for. `pending-home-sales-2026-09-17` filed it as
housekeeping — *"this calendar carries the 11-12 and 12-09 editions of Existing-Home Sales but not
the October one, so the September-data closings read had no row."* `existing-home-sales-2026-09-10`
filed it over a third sibling's on-record decline, for a mechanical reason:

> `existing-home-sales-2026-11-12` declined the October edition as *"routine… the thing worth
> watching is a workbook re-pull at the next pulse, not a calendar row"* — while in the same document
> making **2026-10-13** the dated observation for its own first kill switch (*"No `ContribArchives`
> vintage dated 2026-10-13 exists by 2026-10-16"*).

So this event exists to be a **rehearsal**: a free, month-early test of the sibling ledgers' central
machinery. Three questions follow. **Does NAR's own calendar carry the date?** **Can the rehearsal
actually be run — is the observation the switch names observable on the date it names?** And, because
the whole family's stand-aside rests on an inert tape: **does this session's shape, which is unlike
any EHS session before it, change anything?**

**One-line verdict:** the date is the publisher's own and promotes to `confirmed`; the rehearsal is
worth running but **cannot be run on the sheet the switch names** — `ContribArchives` carries only
completed quarters and 2026:Q3 does not close until 2026-10-28, so the switch would fire as a false
positive on 2026-10-16 whatever GDPNow posts, and the amendment is the *sheet* rather than the date;
and the tape is unchanged — inert print, no blackout, and a session shape with no precedent whose two
measurable components are both flat.

### Method

Macro-print mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md). `symbols: []`, so neither
`earnings-cycle.mjs` nor `intraday-edges.mjs` applies and the cache-busting rule has no target; the
equity work below is a purpose-built read of daily bars. Six inputs, all fetched direct on 2026-09-08:

1. **`nar.realtor/press-releases/nar-statistical-news-release-schedule`** (HTTP 200, 483,177 bytes) and
   its downloadable twin **`/sites/default/files/2025-11/2026-nar-statistical-news-release-schedule.docx`**
   (HTTP 200, 55,384 bytes), unzipped and read as XML for the full year, including `docProps/core.xml`.
2. **`nar.realtor/research-and-statistics/housing-statistics/existing-home-sales`** (HTTP 200,
   588,410 bytes) — the current edition, the Yun quote and the next-release note.
3. **`GDPNowcastDataReleaseDates.xlsx`** (Atlanta Fed) — `PostedUpdates`, **82 dated rows**
   2025-12-23 → 2026-12-23. *The forward **schedule**.*
4. **`GDPTrackingModelDataAndForecasts.xlsx`** — `ContribArchives` (**1,871 vintages**, 2014-05-01 →
   2026-07-28), and — new to this ledger — `ContribHistory` and `CurrentQtrEvolution`, the
   **current-quarter** sheets carrying 17 more vintages, 2026-07-30 → 2026-09-03.
5. **`federalreserve.gov/monetarypolicy/fomccalendars.htm`** (HTTP 200, 164,831 bytes) for the 2026
   meeting panel, read against this calendar's own `fomc-blackout-start-2026-10-17` entry and the
   blackout rule it quotes from the Fed's blackout-calendar PDF.
6. **Nasdaq's historical-quote API**, SPY / ITB / XHB, **2,514 daily sessions 2016-09-06 → 2026-09-04**,
   with 20,000-iteration permutation tests on medians; **CBOE `VIX_History.csv`** and
   `delayed_quotes/_VIX.json` for volatility.

**Collection notes, none substituted silently.** Two source paths failed and both are recorded in
`probe-ref.blocked` rather than quietly replaced. **FRED failed to connect** on this runner
(`fredgraph.csv`, 0 bytes, same failure the 09-10 sibling hit two days ago), so **no FRED-sourced
series is restated here** and the mortgage-rate line the earlier siblings carried is dropped rather
than repeated from a document this session could not read. The Atlanta Fed media path every early
sibling cites — `/-/media/documents/cqer/researchcq/gdpnow/…` — now returns a **404 HTML page for both
workbooks**; the live path is `/-/media/Project/Atlanta/FRBA/Documents/cqer/researchcq/gdpnow/…`,
discovered from the GDPNow landing page's own links and used throughout (independently reproducing the
11-12 lane's note that the old path 404s). A NAHB release-schedule PDF path returned HTML rather than a
PDF and was abandoned in favour of NAHB's own HMI release-dates table, which answered.

**One data-quality catch, independently reproduced.** CBOE's `VIX_History.csv` again carries a row for
**09/07/2026** closing at **15.30** — a Monday that was a full market closure (Labor Day). CBOE's own
`delayed_quotes/_VIX.json`, fetched this session, reports `prev_day_close` = **14.53** (the 2026-09-04
close), and Nasdaq's bar series ends 2026-09-04 for all three ETFs. The CSV row is dropped as spurious.
This reproduces the 09-10 sibling's catch from an independent pull two days later; that lane owns the
Labor Day closure entry and nothing is written to it here.

### Leg 1 — the date · **SUPPORTED**, and promoted to `confirmed`

Two primary NAR documents, read this session:

> **OCTOBER** — Tue., Oct. 13 · **September Existing-Home Sales** · Tue., Oct. 20 · September
> Pending Home Sales Index · Thu., Oct. 29 · Third Quarter Metro Home Prices

on the schedule page, under its standing note *"All releases at 10 a.m. Eastern Time"*, and word for
word in the `.docx` twin — whose `docProps/core.xml` records `dcterms:created`
**2025-11-06T20:57:00Z**. The date was published **eleven months** ahead of the event and has not
moved since.

A third corroboration comes from outside NAR: NAR's 2026 schedule matches the EHS vintages the Atlanta
Fed has actually posted this year **8 for 8** — 01-14, 02-12, 03-10, 04-13, 05-11, 06-09, 07-09 in
`ContribArchives`, plus **08-11** in `ContribHistory`. A second institution's model has hit NAR's
published dates on every 2026 edition to date.

**Status promoted `estimate` → `confirmed`, prefix `EST:` → `IR:`,** on exactly the precedent both
siblings used on this identical page (`challenger-job-cuts-2026-09-03`: a private publisher's own
release carries `IR:`; NAR produces this series rather than aggregating it). The proposals' stated
reason for `estimate` — *"this lane may not self-confirm an event it discovered in-sweep"* — does not
bind here: the discovering lanes were `existing-home-sales-2026-09-10` and
`pending-home-sales-2026-09-17`, and this is the canonical file being written by the event's own
initial research, the same position 09-10 and 11-12 were both in. Per the lane's hard limits a flip
requires a primary source and there are two, plus an independent execution check; per the date policy
it licenses nothing.

**One thing deliberately NOT claimed as a source.** NAR's live statistics page reads *"Existing-Home
Sales for August 2026 will be released on Thursday, September 10, 2026 at 10:00 a.m. Eastern"* — it
names the **September** edition, because its forward pointer advances one edition at a time. The 09-10
sibling could cite that page as a third independent statement of its own date; this ledger cannot, and
says so rather than counting a page that does not mention 10-13.

### Leg 2 — the sibling switch names a sheet that cannot answer · **REFUTED**, and this is the ledger's central finding

`existing-home-sales-2026-11-12`'s first kill switch reads, verbatim:

> **No `ContribArchives` vintage dated 2026-10-13 exists by 2026-10-16.** That is the free rehearsal…
> Its absence would mean the premise Leg 2 refutes is right after all, a month before it matters.

The observation is unavailable on that date, and not by accident.

**`ContribArchives` is a strict concatenation of completed-quarter blocks.** Grouping its 1,871
vintages by the `Quarter being forecasted` column gives **49 blocks**, and **0 of 49** overlap the
previous block's date range — every block runs contiguously from a quarter's initial nowcast to its
final one, and the next block starts after it ends. The last ten:

| Quarter | Vintages | First | Last |
|---|---|---|---|
| 2024:Q1 | 40 | 2024-01-26 | 2024-04-24 |
| 2024:Q2 | 37 | 2024-04-26 | 2024-07-24 |
| 2024:Q3 | 41 | 2024-07-26 | 2024-10-29 |
| 2024:Q4 | 39 | 2024-10-31 | 2025-01-29 |
| 2025:Q1 | 38 | 2025-01-31 | 2025-04-29 |
| 2025:Q2 | 41 | 2025-04-30 | 2025-07-29 |
| 2025:Q3 | 44 | 2025-07-31 | 2025-12-16 |
| 2025:Q4 | 23 | 2025-12-23 | 2026-02-19 |
| 2026:Q1 | 30 | 2026-02-20 | 2026-04-29 |
| **2026:Q2** | **40** | **2026-04-30** | **2026-07-28** |

**The running quarter is absent, not late.** The archive's last vintage is **2026-07-28** — 42 days
before today — and there is **no 2026:Q3 row anywhere in it**. But GDPNow has plainly been running:
`ContribHistory`'s header row and `CurrentQtrEvolution` in the **same workbook** carry **17** Q3
vintages, **2026-07-30 → 2026-09-03**, starting exactly one posting day after the archive's last Q2
vintage. The handoff is clean and the two sheets do not overlap by a single date. The workbook is
current; `ContribArchives` simply does not carry the quarter it is currently nowcasting.

**So the switch cannot fire truthfully.** A vintage dated **2026-10-13** is a **2026:Q3** vintage, and
the Fed's own `PostedUpdates` puts *"Final nowcast of 2026:Q3 GDP growth"* on **2026-10-28** with the
Q4 cycle opening 10-29. For a 10-13 vintage to be in `ContribArchives` by **2026-10-16**, the Atlanta
Fed would have to close and publish the Q3 block twelve days before the quarter's run ends. The switch
would read "absent" on 2026-10-16 with **certainty**, and a lane scoring it would record a kill against
a stance that is intact.

**The amendment is the sheet, not the date.** The identical observation — does a 10-13 vintage exist,
and does its release text name existing-home sales alone — is available **on 2026-10-13 itself** in
`ContribHistory`/`CurrentQtrEvolution`, which carry the same `Data releases`/`Major Releases` free
text. Handed back to both siblings, and registered here as `-1` and `-2`.

**The defect is not confined to that one switch.** `FT-existing-home-sales-2026-11-12-1` and `-2` both
require a **2026-11-12** vintage — a **2026:Q4** vintage — read from `ContribArchives` and scored by
**2026-11-18**, when the Q4 run will be three weeks old and nowhere near closing.
`FT-existing-home-sales-2026-09-10-3` and `-4` are better placed but not safe: they need a Q3 vintage
by **2026-11-15**, which requires the Q3 block to publish within **18 days** of closing on 10-28. The
only lag this session can bound is the Q2 block's — present today, **≤42 days** after its close — which
does not establish that 18 is enough. All four are scoreable on the current-quarter sheets on their own
dates; none of them needs to wait.

### Leg 3 — the solo-vintage base rate, now 6 of 6 · **SUPPORTED**, and out of sample

`existing-home-sales-2026-11-12`'s Leg 2 established that the Fed's forward schedule is *"a floor,
never a ceiling"* and that unscheduled EHS dates produce **solo** vintages — 5 of 5 in 2026 at the time
it was written. This session extends that on data that did not exist then.

`PostedUpdates` schedules **no** posting on **2026-10-13** (nor on 08-11, nor on 11-12); the nearest
scheduled neighbours are 10-08 (wholesale trade) and 10-15 (retail sales + PPI). And the 2026 record,
re-derived from both sheets:

| Date | Fed-scheduled? | What the vintage names |
|---|---|---|
| 2026-01-14 | yes | Retail trade, Producer Price Index, Existing-home sales |
| 2026-02-12 | no | **Existing-home sales** (solo) |
| 2026-03-10 | no | **Existing-home sales** (solo) |
| 2026-04-13 | no | **Existing-home sales** (solo) |
| 2026-05-11 | no | **Existing-home sales** (solo) |
| 2026-06-09 | yes | International trade (Full report), Wholesale trade, Existing-home sales |
| 2026-07-09 | no | **Existing-home sales** (solo) |
| **2026-08-11** | **no** | **Existing-home sales** (solo) — *`ContribHistory`, new this session* |

**6 of 6** unscheduled 2026 dates produced a solo vintage; **2 of 2** scheduled ones were multi-release.
The 08-11 row is the first out-of-sample confirmation either sibling's prediction has had, and it is
only visible because this session looked in the current-quarter sheets. Independently, the wider window
reproduces the 09-10 sibling exactly: **123 of 140** EHS-naming vintages 2014-05-01 → 2026-07-28 are
solo, and a solo one moves change-in-inventory-investment past 0.0010pp just **17 of 123** times
(median **0.0001pp**) against **0.0232pp** median on the 17 shared ones.

### Leg 4 — the ≥0.30pp residential switch was a housing-starts detector, and 2026 disconnected it · **REFUTED as worded**

Both siblings carry, word for word: *"The vintage moves the residential-investment contribution by
≥0.30pp. **Far past anything in the 140-vintage class.**"* Measured on consecutive same-quarter
vintages, it is not.

**5 of 123** solo EHS vintages (**4.1%**) cleared 0.30pp — max **0.4924pp**, p90 0.1488pp, median
0.0399pp. A 4.1% switch is a rare event, not an unprecedented one. But the five have one signature:

| Date | Δresidential | The immediately preceding vintage |
|---|---|---|
| 2020-05-21 | +0.4924pp | 2020-05-19 — **Housing starts** |
| 2020-06-22 | −0.3278pp | 2020-06-17 — **Housing starts** |
| 2020-11-19 | +0.3958pp | 2020-11-18 — **Housing Starts** |
| 2021-05-21 | −0.4480pp | 2021-05-18 — **Housing starts** |
| 2022-02-18 | +0.3369pp | 2022-02-17 — **Housing starts** |

Conditioned on the preceding vintage: **5 of 101 (5.0%)** solo EHS vintages that followed a
housing-starts vintage cleared 0.30pp; **0 of 22** that followed anything else ever did, topping out at
**0.2021pp**. The switch was picking up residential-investment revisions carried by *starts*, arriving
on the next vintage — which happened to be the EHS one, because for a decade EHS released *after*
starts.

**NAR's 2026 calendar reversed that order.** **111 of 133** EHS vintages 2014-2025 immediately followed
a housing-starts vintage; **0 of 7** in 2026 do, because NAR moved the release from the third week of
the month into the second. Every 2026 EHS vintage now follows an employment, trade, CPI or wholesale
vintage, and their Δresidential readings run **+0.0400, −0.0335, +0.0269, −0.0229, +0.0562, +0.0595,
+0.0022pp** — the largest is a twentieth of the switch. For 2026-10-13 the preceding vintage will be
the 10-08 wholesale-trade posting or an unscheduled one; **housing starts is 10-20, after this print**.

The switch is not wrong about what it would mean — a 0.30pp residential move genuinely would be a
component-sized surprise. It is wrong that this is unprecedented, and it is now attached to a channel
the 2026 reordering severed. Registered as `-4`.

### Leg 5 — the print's own tape · **SUPPORTED (null)**, and it reproduces both siblings

Nasdaq's API, **2,514 sessions 2016-09-06 → 2026-09-04**, 20,000-iteration permutation tests on median
session range, a different seed and an independent pull from either sibling:

| Cut | SPY | ITB | XHB |
|---|---|---|---|
| All **114** EHS release days | 0.912% vs 0.884%, p=**0.66** | 1.920% vs 1.872%, p=**0.58** | 1.733% vs 1.666%, p=**0.45** |
| The **100** solo ones | 0.899%, p=**0.82** | 1.915%, p=**0.64** | 1.724%, p=**0.55** |

Every figure lands within **0.01pp** of the 09-10 and 11-12 ledgers. Closes on 2026-09-04 reproduce
them too: **SPY 770.19, ITB 93.91, XHB 103.25**, ITB's last-20-session median range **1.809%**.

### Leg 6 — 10-13's session shape has no precedent, and its two components are flat · **MIXED**

2026-10-13 is unlike any EHS session in the sample. It is the first equity session after
**`sifma-bond-market-closure-2026-10-12`** (Columbus Day — equities open, bonds shut) and one session
**before** the **2026-10-14** CPI. Across the window, **0 of 114** EHS release days had that shape.

So the compound cannot be measured on EHS days, and it is decomposed instead. Bond-only closures are
derived structurally — Columbus Day (second Monday of October) and Veterans Day (Nov 11, rolled to
the adjacent weekday off a weekend), keeping only those with an equity bar, which is exactly the
"equities open, bonds shut" condition — giving **20** instances 2016 → 2025.

| Cut | ITB | SPY | XHB |
|---|---|---|---|
| Session **after** a bond-only closure (n=**20**) | 1.779% vs 1.872%, p=**0.67** | 0.869% vs 0.884%, p=**0.93** | 1.635% vs 1.666%, p=**0.88** |
| …after **Columbus Day** only (n=**10**) | 1.740%, p=**0.67** | 1.022%, p=**0.51** | — |
| One session **before** a CPI vintage (n=**113**) | 1.880% vs 1.872%, p=**0.92** | 0.855%, p=**0.66** | 1.704%, p=**0.67** |
| **Both at once** (n=**5**) | **2.564%** vs 1.872%, p=**0.14** | 0.766%, p=**0.70** | 1.399%, p=**0.53** |

The first cut reproduces 11-12's n=20/p=0.69 and the third reproduces 09-10's n=107/p=0.89 on a wider
sample. The compound is the one number that is not flat — and at **n=5** (2018-11-13, 2019-11-12,
2021-10-12, 2023-11-13, 2024-11-12) with p=0.14 it is noise, reported because leaving it out would be
the dishonest version. It is the reason the call is *stand aside* rather than *expect a narrow
session*: there is no base rate for what 10-13 actually is, only for its parts.

Tail rates, which is what the kill switches need:

| Cut | ITB session range > 3.0% |
|---|---|
| All sessions | 442/2,514 = **17.6%** |
| VIX ≤ 16 | 53/1,051 = **5.0%** |
| EHS days | 19/114 = **16.7%** |
| **EHS days at VIX ≤ 16** | **1/45 = 2.2%** |
| After a bond-only closure | 5/20 = **25.0%** |
| **After a bond-only closure at VIX ≤ 16** | **0/9 = 0.0%** |

The VIX clause the siblings added is doing the work again: the raw after-holiday tail looks elevated
(25.0% on 20 observations), and conditioning on VIX ≤ 16 takes it to zero. Registered as `-3`.

### Leg 7 — the blackout is absent here, and that is the difference from 09-10 · **SUPPORTED**

The 09-10 sibling's central finding is that the **FOMC blackout** — not the print — widens
homebuilders: ITB 2.003% vs 1.838% and XHB 1.784% vs 1.610% across 678 blackout sessions (both
p<0.001) with SPY untouched (p=0.95). That regime does not reach 2026-10-13. The Fed's 2026 panel puts
the fourth-quarter meeting on **October 27-28**, and this calendar's own
`fomc-blackout-start-2026-10-17` entry — sourced to the Fed's blackout-calendar PDF, whose footnote
states the rule verbatim (*"begin at 12:00 a.m. Eastern Time the second Saturday before a meeting and
end at 11:59 p.m. Eastern Time the day after"*) — puts the window at **2026-10-17 → 2026-10-29**.
10-13 sits **four days before** it opens.

That is why 10-13 is the better rehearsal of the two September/October editions: 09-10 carried PPI, a
30-year auction, the ECB and a blackout, so any width had four candidate owners. 10-13 carries
**nothing else this calendar tracks** — it is the only date in the 10-08 → 10-17 corridor with no other
entry. Whatever it does is attributable, and the measured expectation is that it does nothing.

### Primary content read — what the last published edition says

NAR's statistics page, current edition **July 2026 data**, released **August 11, 2026**: existing-home
sales **−1.7% m/m**, median sales price **$431,400**, inventory at a **4.6-month supply**; month over
month sales rose in the Northeast, held steady in the West and declined in the Midwest and South, while
year over year they rose in the Midwest and West and were flat in the Northeast and South. Chief
Economist Lawrence Yun, verbatim: *"Home sales have been remarkably stable, even amid the rising
mortgage rate environment of the past few months… Year-to-date sales are up 2.4% and there's no doubt
that the housing market would be thriving if average mortgage rates were to return near 6%."* The
companion Pending Home Sales Index last read **−2.3%**.

**The SAAR level is not restated.** The 09-10 sibling cites **4.06M**; that figure is **not on the page
this session fetched** (it lives in a linked PDF release), so it is omitted rather than copied from a
sibling's reading. **No content forward test is registered**, for the reason the siblings gave and one
more: FRED — the only source with a historical `EXHOSLUSM495S` window, and a restricted 13-month one at
that — **failed to connect on this runner**, so there is no base rate here to register a numeric
prediction against. A pre-scored guess is worse than a refusal.

### The adjacency sweep

- **Peer prints** — n/a, `symbols: []`. Homebuilders were read as a *class* (Legs 5–7), not as
  holdings: ITB **93.91**, XHB **103.25**, SPY **770.19** (2026-09-04 closes, Nasdaq API, reproducing
  both siblings exactly).
- **Macro surprises** — no prior row; this is the baseline. The corridor, in order: **bond-market
  closure 10-12** (equities open) and the IMF/World Bank annual meetings · **this print 10-13, alone on
  its date** · **CPI** + Beige Book + the 2027 SSA COLA **10-14** · **PPI** + **retail sales** + MTIS +
  a coupon announcement + a 10y-20y buyback + the G20 FMCBG **10-15** · industrial production,
  import/export prices, the primary-dealer agenda and **opex 10-16** · **blackout opens 10-17**.
- **Volatility regime** — **VIX 15.26** intraday 2026-09-08 (CBOE `delayed_quotes/_VIX.json`, 14:09 ET),
  against a **14.53** close on 2026-09-04; the prior week ran 14.92 → 16.34 → 15.20 → 14.32 → 14.53.
  This is load-bearing rather than colour: at VIX ≤ 16 the ITB >3.0% tail is 5.0% unconditionally,
  2.2% on EHS days and 0 of 9 after a bond-only closure, which is what makes `-3` a test rather than a
  coin flip. Thirty-five days is far too long for today's reading to survive to the event; it is the
  baseline the next pulse diffs against.
- **Geopolitical / policy** — the IMF/World Bank meetings (10-12) and the G20 FMCBG (10-15) are
  fiscal/FX venues with no measured channel to homebuilders. **This print is a NAR release, not a
  federal one**, so no US funding-cliff or shutdown mechanism reaches its publication — the one
  genuine advantage this series has over the Census and BLS prints around it.
- **Event tape** — no September consensus is findable at D-35 from a primary source, and this ledger
  publishes none rather than relay an aggregator's. Every content statement above is the last
  *published* edition, never a forecast. Q3 bank earnings conventionally open in this week of October;
  no 2026 date is confirmed and `earnings-calendar.ts` is out of this lane's scope, so nothing is
  claimed about it.
- **One dated event proposed in this PR**, its own file owned by this lane: **`nahb-hmi-2026-10-19`**
  (NAHB's own *"2026 HMI Schedule"* table, *"Oct. 2026 | October 19, 2026"*, standing note *"Normal
  release time: 10:00 AM Eastern Time"*, fetched direct 2026-09-08, HTTP 200, 46,670 bytes). It is a
  hole in a series this calendar otherwise proposes month by month — `nahb-hmi-2026-09-16` and
  `nahb-hmi-2026-11-17` are both already proposed, and the November proposal's own source text quotes
  "October 19" from the same table without filing it. It matters more than the gap: builder sentiment
  landing **inside** the 10-17 blackout is the corridor's most plausible homebuilder mover, given that
  the blackout is the one regime measured to widen ITB.
- **Three classes considered and DECLINED**, so their absence reads as a decision. (i) **September
  PHSI, 2026-10-20** and (ii) **NAR Q3 Metro Home Prices, 2026-10-29** — both found on this session's
  own NAR fetch, and both already owned by `pending-home-sales-2026-09-17`'s proposals; writing a
  competing proposal for an id another lane owns is exactly what #1717 forbids, and it supersedes the
  09-10 sibling's decline of the metro-prices row. (iii) **A calendar row for the Atlanta Fed's Q3
  archive publication** — the observation Leg 2 turns on, but it has no published date, no primary
  source, and no market channel; it belongs in this ledger's kill switches, which is where it is.

### Honest limits

- **The block model is inferred from one snapshot, and its falsifier is registered.** 49 blocks with 0
  overlaps and a completely absent current quarter is strong structural evidence, but this session
  observed the workbook **once**. It cannot see *when* the Q2 block appeared, only that it is there and
  the Q3 one is not. `-2` is registered precisely so the claim is scored rather than asserted: if a
  2026-10-13 vintage does turn up in `ContribArchives` by 2026-10-19, Leg 2 is wrong and the sibling
  switch was fine.
- **The 42-day gap is an upper bound on nothing useful.** It says the Q2 block published within 42 days
  of closing; it does not say the Q3 block will take 42, or 18, or 5. That is why this ledger amends the
  *sheet* rather than proposing a later date — a later date is another guess about a lag nobody here
  has measured.
- **Leg 4's conditioning is post-hoc.** The housing-starts split was found by looking at the five
  exceptions, not predicted before. What rescues it from being a story is that the 2026 reordering is
  an *independent*, dated, documented change to NAR's calendar — and that 0 of 22 in the unconditioned
  arm is a clean out-of-sample arm of the same data.
- **n=5 is not a finding.** The one non-flat tape cut in Leg 6 has five observations and p=0.14. It is
  reported and it is not used to support any call; the call it does affect is the refusal to promise a
  narrow session.
- **The bond-holiday set is derived from statute, not from bond-market data.** No fixed-income
  calendar was fetched; Columbus and Veterans Day are computed from the federal-holiday rule and
  filtered to those with an equity bar. A year where SIFMA departed from the rule would be mislabelled.
  The direction is unaffected — the cut is flat with or without any single instance.
- **All the nowcast work measures a model, not a market.** Every Δ describes the Atlanta Fed's estimate
  of GDP. The only price claims here are session-class studies, and all of them are reasons *not* to act.
- **`symbols: []` is doing real work.** Even were every measurement twice as strong, this event has no
  instrument attached and no house playbook keyed to it.

## Stance & kill switches

**Stance (date is `confirmed`, promoted this session on the publisher's own calendar).** Stand aside on
2026-10-13 and on every edition of this report. Hold four frames. **On the date:** it is NAR's own,
created in a document dated **2025-11-06**, stated identically on the schedule page and its `.docx`
twin, and matched 8 for 8 against the vintages the Atlanta Fed actually posted in 2026 — but *not*
corroborated by NAR's live statistics page, which still names only the September edition, and this
ledger counts two sources rather than three. **On the instrument — the reason this ledger exists:** the
rehearsal both siblings keyed to this date **cannot be run on the sheet they name**. `ContribArchives`
is 49 completed-quarter blocks with 0 overlaps, ends 2026-07-28, and structurally excludes the running
quarter, whose 17 vintages sit in `ContribHistory` in the same workbook; a 10-13 vintage is a 2026:Q3
vintage and Q3 does not close until **2026-10-28**, so *"no `ContribArchives` vintage dated 2026-10-13
by 2026-10-16"* is guaranteed true and carries no information. The amendment handed back to both
siblings is the **sheet, not the date** — and it reaches four of their registered forward tests, all of
which are scoreable on their own dates from the current-quarter sheets. **On the nowcast:** 10-13 is
unscheduled on `PostedUpdates`, the shape that produced a solo existing-home-sales vintage on **6 of 6**
unscheduled 2026 dates, now including **2026-08-11** out of sample; expect a solo vintage and read the
**residential** line, which a solo vintage moves a median 0.0399pp. The ≥0.30pp residential switch both
siblings carry is **retired for 2026 editions**: it is a 4.1% event, all five instances followed a
housing-starts vintage, 0 of 22 that followed anything else cleared it, and NAR's 2026 reordering put
EHS *ahead* of starts (0 of 7 in 2026 follow starts, against 111 of 133 in 2014-2025). **On the tape:**
inert as ever — 114 EHS days and 100 solo ones at baseline on an independent pull that reproduces both
siblings within 0.01pp — and, unlike 09-10, **outside** any FOMC blackout, which removes the one regime
measured to widen homebuilders. The session's exact shape (after a bond-only closure, one day before
CPI) has **no precedent** on an EHS date; both components measure flat and the n=5 compound is noise,
so the honest call is stand aside rather than a promise of quiet. Nothing here licenses an entry, and
there is no instrument to enter.

**Kill switches** — any one of these ends the stance above and earns a ledger row:

- **A `ContribArchives` vintage dated 2026-10-13 exists on or before 2026-10-19.** Leg 2's block model
  is wrong, the sibling switch was correctly specified, and the amendment offered here must be
  withdrawn. Registered as `-2`.
- **No vintage dated 2026-10-13 appears in `ContribHistory`/`CurrentQtrEvolution` by 2026-10-19**, or
  one appears naming a co-release. Either kills the 6-of-6 solo base rate: the first says the Fed does
  gate posting on its published schedule after all, the second says an unscheduled EHS date can be
  shared. Registered as `-1`.
- **The 2026-10-13 vintage moves the Q3-2026 residential-investment contribution by ≥0.30pp.** Leg 4 is
  wrong that the 2026 reordering severed the channel, the switch both siblings carry is live after all,
  and this print acquires a reading worth waiting for. Registered as `-4`.
- **ITB's session range on 2026-10-13 exceeds 3.0% with a VIX close ≤ 16.** A 2.2% event on EHS days in
  that regime and 0 of 9 after a bond-only closure; a clear-through on the calendar's emptiest day of
  the corridor would put `symbols: []` back in question with no other candidate owner. Registered as `-3`.
- **Either ITB or XHB closes 2026-10-13 more than 2.0% from its open.** The directional form of
  inertness; 85.1% / 87.7% of EHS days stay inside it.
- **NAR moves, delays or restructures the 2026-10-13 release on its own schedule.** The `confirmed`
  label reverts to `estimate` and Leg 1 is re-derived; the schedule page and its `.docx` twin are the
  two places that would show it.
- **A macro- or housing-keyed house playbook lands in `docs/plans/trade-playbooks.md` before
  2026-10-13.** The stand-aside is partly an absence-of-instrument argument; a housing-keyed playbook
  makes it a live question rather than a settled one.

**Registered predictions** (zero capital by design, scored from re-run data, never from memory) — see
[`forward-tests/existing-home-sales-2026-10-13.md`](../forward-tests/existing-home-sales-2026-10-13.md):

- `FT-existing-home-sales-2026-10-13-1` — a **GDPNow vintage dated 2026-10-13 exists in
  `ContribHistory`/`CurrentQtrEvolution` and names existing-home sales alone.** Base **6 of 6**
  unscheduled 2026 EHS dates. Score by 2026-10-19.
- `FT-existing-home-sales-2026-10-13-2` — **no vintage dated 2026-10-13 appears in `ContribArchives`
  by 2026-10-19.** The falsifier for this ledger's own central claim; base **49 of 49** blocks are
  completed quarters and 2026:Q3 closes 2026-10-28. Score by 2026-10-19.
- `FT-existing-home-sales-2026-10-13-3` — **ITB's 2026-10-13 session range stays below 3.0%**, scored
  only if that session's VIX close is ≤ 16. Base **97.8%** on EHS days in that regime, **95.0%** on all
  low-VIX sessions, **9 of 9** after a bond-only closure. Score by 2026-10-19.
- `FT-existing-home-sales-2026-10-13-4` — the **2026-10-13 vintage moves the Q3-2026
  residential-investment contribution by less than 0.30pp.** Base **0 of 22** for solo EHS vintages not
  preceded by a housing-starts vintage; 2026's seven readings top out at 0.0595pp. Score by 2026-10-19.

No content forward test is registered (FRED failed to connect, so there is no base rate to register one
against) and no hourly test is registered (no hourly bar source was attempted, so this lane could
neither derive nor score one) — both refusals argued above.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-08 | D-35 | **Initial research on an id that existed only as TWO competing proposals (`from-existing-home-sales-2026-09-10`, `from-pending-home-sales-2026-09-17`), both now shadowed by the canonical file written this session. This event was proposed to be a free rehearsal for its siblings' machinery; the rehearsal is worth running and CANNOT be run on the sheet they name.** **Leg 1 — the date:** NAR's schedule page (HTTP 200, 483,177 B) and its `.docx` twin (55,384 B, `docProps/core.xml` `dcterms:created` **2025-11-06T20:57:00Z**) both read Tue., Oct. 13, 10:00 ET; NAR's 2026 calendar matches the Atlanta Fed's actually-posted EHS vintages **8 for 8**. Status `estimate`→**`confirmed`**, `EST:`→**`IR:`**, on the `challenger-job-cuts-2026-09-03` precedent both siblings used. NOT counted as a third source: NAR's live stats page still names only the 09-10 edition. **Leg 2 — the sibling switch names a sheet that cannot answer (the central finding):** `ContribArchives` is a strict concatenation of **49 completed-quarter blocks, 0 overlapping**, ending **2026-07-28** (the last 2026:Q2 vintage); the live 2026:Q3 run is not missing but elsewhere in the SAME workbook — `ContribHistory`/`CurrentQtrEvolution` carry **17** vintages **2026-07-30 → 2026-09-03**, starting one posting day after the archive ends, with zero overlap. A 10-13 vintage is a **Q3** vintage and `PostedUpdates` puts *"Final nowcast of 2026:Q3"* on **2026-10-28**, so 11-12's switch (*"no `ContribArchives` vintage dated 2026-10-13 by 2026-10-16"*) is **guaranteed true and carries no information** — it would record a kill against an intact stance. **Amendment handed back: the SHEET, not the date** — the identical observation is available on 10-13 itself in the current-quarter sheets. Same defect reaches **`FT-…-11-12-1`/`-2`** (a **Q4** vintage scored 2026-11-18) and puts **`FT-…-09-10-3`/`-4`** (Q3 vintages scored 2026-11-15) on an 18-day publication assumption this session can only bound at ≤42 days. **Leg 3 — the solo base rate is now 6 of 6, out of sample:** `PostedUpdates` schedules nothing on 10-13 (nor 08-11, nor 11-12); of 2026's eight EHS dates the **6 unscheduled** ones (02-12, 03-10, 04-13, 05-11, 07-09, **08-11**) all named *"Existing-home sales"* ALONE and the **2 scheduled** ones (01-14, 06-09) were multi-release. **08-11 is the first out-of-sample confirmation either sibling's prediction has had**, visible only in `ContribHistory`. Wider window reproduces 09-10 exactly: **123/140** EHS vintages solo, solo moves CIPI >0.0010pp **17/123**. **Leg 4 — the ≥0.30pp residential switch was a housing-starts detector, and 2026 disconnected it:** both siblings call it *"far past anything in the 140-vintage class"*; measured it is **5/123 solo (4.1%)**, max 0.4924pp — and **all five** immediately followed a **housing-starts** vintage (2020-05-21, 2020-06-22, 2020-11-19, 2021-05-21, 2022-02-18), while **0/22** that followed anything else cleared it (max 0.2021pp). **NAR's 2026 calendar moved EHS AHEAD of starts: 111/133 EHS vintages 2014-2025 followed starts, 0/7 in 2026 do**, and 2026's seven Δresidential readings run +0.0400/−0.0335/+0.0269/−0.0229/+0.0562/+0.0595/+0.0022pp. 10-13's preceding vintage will be 10-08 wholesale trade or an unscheduled one; **starts is 10-20, after**. **Leg 5 — the tape, independently reproduced:** Nasdaq API, **2,514 sessions 2016-09-06 → 2026-09-04**, 20k permutations; all **114** EHS days SPY 0.912% (p=0.66), ITB 1.920% (p=0.58), XHB 1.733% (p=0.45); the **100 solo** ones SPY 0.899% (p=0.82), ITB 1.915% (p=0.64), XHB 1.724% (p=0.55) — within **0.01pp** of both siblings. Closes 09-04: SPY 770.19 / ITB 93.91 / XHB 103.25; ITB last-20 median range 1.809%. **Leg 6 — 10-13's shape has NO precedent:** it is the session after a bond-only closure (`sifma-bond-market-closure-2026-10-12`) AND one day before CPI (10-14), and **0 of 114** past EHS releases had that shape. Decomposed: after a bond-only closure (n=**20**, Columbus + Veterans derived from statute, equity-bar filtered) ITB **1.779%** vs 1.872% p=**0.67**, SPY p=0.93, XHB p=0.88 — reproducing 11-12's n=20/p=0.69; after Columbus only (n=10) ITB 1.740%, p=0.67; one session before CPI (n=**113**) ITB **1.880%** vs 1.872%, p=**0.92** — reproducing 09-10's n=107/p=0.89 on a wider sample. **The compound (n=5) is the one non-flat cut** — ITB 2.564% vs 1.872%, p=**0.14** — reported as noise and used only to refuse a promise of a quiet session. Tails: ITB >3.0% is 17.6% all sessions, **5.0%** at VIX ≤ 16, 16.7% on EHS days, **1/45 = 2.2%** on EHS days at VIX ≤ 16, 25.0% (5/20) after a bond-only closure but **0/9** there at VIX ≤ 16. **Leg 7 — no blackout, and that is the difference from 09-10:** the Fed's 2026 panel puts the Q4 meeting on **Oct 27-28** and this calendar's `fomc-blackout-start-2026-10-17` puts the window at **10-17 → 10-29**, so 10-13 sits **four days before** it opens — the regime that widens ITB **+9%** (p<0.001, n=678) with SPY untouched is absent, and 10-13 is the only date in the 10-08 → 10-17 corridor carrying no other tracked entry, so anything it does is attributable. **Collection, none substituted silently:** FRED **failed to connect** (0 bytes; in `probe-ref.blocked`) so no series is restated from it and the siblings' mortgage line is dropped; the Atlanta Fed media path every early sibling cites **404s for both workbooks** and the live `/-/media/Project/Atlanta/FRBA/Documents/…` path was used throughout (independently reproducing 11-12's note); a NAHB release-schedule PDF path returned HTML and was abandoned for NAHB's own HMI table, which answered. **Data-quality catch reproduced:** CBOE's `VIX_History.csv` again carries a **09/07/2026** row at 15.30 on a full market closure while its own `delayed_quotes/_VIX.json` reports `prev_day_close` **14.53** (=09-04) and Nasdaq's bars end 09-04 — dropped as spurious; the Labor Day lane owns that event and nothing is written there. **Primary content:** July 2026 edition (released 08-11) — **−1.7% m/m**, median **$431,400**, supply **4.6 months**; NE up, West steady, Midwest and South down; Yun quoted verbatim; PHSI last **−2.3%**. **The 4.06M SAAR figure the 09-10 sibling cites is NOT on the page this session fetched and is not restated.** No content forward test — FRED unreachable, so no base rate. **Adjacency — peers:** n/a, `symbols: []`. **Macro:** 10-13 is ALONE on its date; the corridor is bond closure + IMF/World Bank **10-12**, CPI + Beige Book + SSA COLA **10-14**, PPI + retail sales + MTIS + coupon announcement + 10y-20y buyback + G20 FMCBG **10-15**, IP + import/export prices + primary-dealer agenda + **opex 10-16**, blackout **10-17**. **Volatility:** VIX **15.26** intraday 09-08 (CBOE delayed quote, 14:09 ET) vs **14.53** close 09-04 — load-bearing for `-3`, and a 35-day-old baseline the next pulse diffs against. **Geopolitical:** IMF/World Bank and G20 FMCBG are fiscal/FX venues with no homebuilder channel; a NAR release carries no federal funding mechanism. **Event tape:** no primary-sourced September consensus findable at D-35 and none relayed from an aggregator; Q3 bank earnings conventionally open this week but no 2026 date is confirmed and `earnings-calendar.ts` is out of scope. **One dated event proposed** (own file, `estimate`): **`nahb-hmi-2026-10-19`** — NAHB's own *"2026 HMI Schedule"* table, *"Oct. 2026 | October 19, 2026"* (HTTP 200, 46,670 B), the missing month of a series this calendar already proposes for 09-16 and 11-17, and the corridor's most plausible homebuilder mover because it lands INSIDE the 10-17 blackout. **Three classes declined on the record:** September **PHSI 10-20** and **NAR Q3 Metro Home Prices 10-29** (both on this session's own NAR fetch, both already owned by `pending-home-sales-2026-09-17`'s proposals — #1717 forbids a competing file, and this supersedes 09-10's decline of the metro row), and **a calendar row for the Q3 archive publication** (no published date, no primary source, no market channel — it belongs in the kill switches, where it is). **Four forward tests registered**, all scoreable by **2026-10-19**, inside this event's own close-out window and inside 11-12's 10-16 deadline: `-1` (a 10-13 vintage exists in the CURRENT-QUARTER sheets and names EHS alone; base 6/6), `-2` (**no** 10-13 vintage in `ContribArchives` by 10-19 — the falsifier for this ledger's own central claim; base 49/49 blocks), `-3` (ITB range <3.0% at VIX ≤ 16; base 97.8% EHS / 95.0% low-VIX / 9-of-9 after a bond-only closure), `-4` (Δresidential <0.30pp; base 0/22 unconditioned, 2026 max 0.0595pp). **Honest limits stated rather than implied:** the block model rests on ONE snapshot and cannot see when the Q2 block appeared, which is exactly why `-2` is registered; the 42-day gap bounds nothing useful about Q3's lag, which is why the amendment moves the sheet rather than guessing a later date; Leg 4's housing-starts conditioning is **post-hoc**, rescued only by the 2026 reordering being an independent dated change and by 0/22 being a clean arm; n=5 is not a finding; and the bond-holiday set is derived from statute with no fixed-income calendar fetched. | **Initial stance set: stand aside on every horizon; date promoted to `confirmed` on NAR's own calendar (two primary documents, one created 2025-11-06, plus an 8-for-8 execution check), and the rehearsal this event was proposed to provide REDIRECTED rather than run — `ContribArchives` structurally excludes the running quarter (49/49 completed-quarter blocks, 0 overlaps, ending 2026-07-28 while 17 Q3 vintages sit in `ContribHistory`), so `existing-home-sales-2026-11-12`'s first kill switch is TRUE BY CONSTRUCTION on 2026-10-16 and the amendment handed back to both siblings is the SHEET, not the date, reaching four of their registered forward tests; the solo-vintage base rate EXTENDED to 6 of 6 on the out-of-sample 2026-08-11 vintage; and the ≥0.30pp residential switch both siblings carry RETIRED for 2026 editions — a 4.1% event whose five instances all followed a housing-starts vintage, against 0 of 22 that did not, on a calendar NAR reordered so that 0 of 7 2026 EHS vintages follow starts. Tape unchanged and outside any blackout; the session's exact shape has no precedent, so the call is stand aside rather than a promise of quiet.** | 2026-10-08 (low, 15+ band: every 30d) — then the 0+ band every 7d, with the close-out due by **2026-10-19** (`closeOutWithinDays: 6`) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-existing-home-sales-2026-10-13.json`
(`status: "estimate"`) in the same PR — your own file, never another event's canonical one (#1717).
Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from
memory — after which this doc goes quiet.
