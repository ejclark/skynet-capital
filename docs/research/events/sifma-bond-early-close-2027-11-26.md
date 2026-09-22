# SIFMA-recommended US fixed-income early close, 2:00 p.m. ET — the one session a year the cash bond tape outlives the equity tape — sifma-bond-early-close-2027-11-26

**Kind:** rates · **Date:** 2027-11-26 (estimate — NEWS: SIFMA `sifma.org/resources/general/holiday-schedule` US Holiday Recommendations panel, fetched and payload-parsed first-hand 2026-09-08; `estimate` is a taxonomy gap plus a source non-binding by its own terms, not a doubt about the published date) · **Impact:** low
**Last assessed:** 2026-09-08
<!-- probe-ref: {"symbols":{},"vix":15.72,"daysBand":"low:15+","adjacentIds":["consumer-confidence-2027-11-30","fhfa-hpi-2027-11-30","fomc-blackout-start-2027-11-27","thanksgiving-half-day-2027-11-26","thanksgiving-market-closure-2027-11-25"],"screenStreak":0,"blocked":[]} -->

## At a glance

**TL;DR.** **Stand aside — and correct the shape of what this session is.** The date and the 14:00 ET
time reproduce first-hand from SIFMA's own 2027 US panel. What does not survive is the intuition every
neighbouring ledger has leaned on, that a 3½-hour holiday session is a nothing session for bonds.
Measured against the pre-Memorial-Day early close as a control, **the day after Thanksgiving removes
volume from the fixed-income tape without removing price movement.** Volume collapse is decisive
(SPY thinner than the control in **26 of 33** years, p = 0.0013; SHY **20 of 23**, p = 0.0005; LQD
**18 of 23**, p = 0.011; BND **16 of 19**, p = 0.0044) — but the |move| suppression that is
*significant* on the control slot (TLT above-normal in only **6 of 24** years, p = 0.023; LQD 6/24,
p = 0.023; BND 4/20, p = 0.012) **vanishes here** (TLT 11/24, IEF 13/24, BND 10/19, every p > 0.5).
So this half session is thin, not calm, and 2021-11-26 — the same Thu-Nov-25 geometry 2027 has — is
the proof: **TLT +2.53%, the 10-year yield −16.3bp against a 2.95bp median, VIX +54%, on 3½ hours.**
The issuer agrees it is not for price discovery: Treasury has held **0 auctions in 27 consecutive
years** on this date while **settling 98 securities** across the same 27 dates. Everything here carries
the event's **`estimate`** label, `symbols` is empty, and no house playbook is calendar-keyed
(re-grepped to zero hits).

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — a recommended bond early close is not a tradeable event | High | D-444, `symbols: []`, `impact: low`; `trade-playbooks.md` and `multi-symbol-sweep.md` grepped this session for `holiday\|thanksgiving\|black.?friday\|half.?day\|early.?close\|closure\|blackout` return **0 hits in both** | A calendar- or session-hours-keyed house playbook being written and back-tested before **2027-11-26** — the "nothing can fire on this date" leg dies and this sheet is rebuilt on measured data |
| This week | **Write the correction down; do not act on it** | High | The deliverable is that thin ≠ calm on this slot, plus two narrowings of sibling claims (what ends at 13:00 is the *core session and closing auction*, not all listed trading; TLT/IEF/SHY list on **Nasdaq**, not NYSE Arca, and Nasdaq publishes no 2027 calendar) | Nasdaq publishing a 2027 early-close calendar that omits 2027-11-26, or SIFMA re-dating the recommendation, before **2026-10-08** |
| This month | **Stand aside** — nothing near-dated is created by this row | Medium | The adjacency sweep found no untracked dated event; the two other untracked 2027 US bond early closes are recorded below and deliberately **not** proposed, per the 03-25/05-28 siblings' precedent | A 2027 US early-close date appearing on SIFMA's panel that is **not** one of 03-25 / 05-28 / 07-02 / 11-26 / 12-23 / 12-31, checked at the **2026-10-08** pulse |
| This quarter | **Do not carry "half session ⇒ quiet bond tape" as a planning assumption** (`estimate` — a planning refusal, never an entry) | Medium | The |move| suppression is real on the pre-Memorial slot and absent here; the sample's largest bond move landed *on* a half day (2021-11-26) | IEF's **2027-11-26** |move| ratio printing below **0.80×** its trailing-20 median while its volume ratio prints below 0.70× — thin *and* calm, and the asymmetry dies. Registered as **FT-sifma-bond-early-close-2027-11-26-1** |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit or hedge is keyed to 2027-11-26. The date is `estimate`, the source is
  explicitly a recommendation, and date-keyed action requires `confirmed` regardless.
- **The execution note, stated precisely.** Equities and eligible options end their **core** session at
  13:00 / 13:15 ET; SIFMA recommends cash and OTC fixed income out at **14:00 ET**. Listed venues keep a
  late session to 17:00 ET, so the honest fact is that **every listed bond proxy prints its official
  close an hour before the cash tape it tracks stops trading** — not that nothing trades in that hour.
- **Size for slippage, not for silence.** Volume is reliably ~½ of normal on this slot; the size of the
  price move is not. Thin books with an unchanged move distribution is a worse execution environment
  than a genuinely quiet session, and it is the environment this date actually is.
- **No supply event, ever.** Treasury has never auctioned on the day after Thanksgiving (0 of 27,
  2000–2026), so the extra hour of cash trading carries no issuance. It does carry **settlements** —
  98 across those 27 dates — consistent with SIFMA's verbatim note that early-close recommendations
  *"do not affect the closing time for settlements."*
- **The blackout composition is real and unpriceable.** 2027-11-26 is the last session before the
  December 2027 FOMC gate opens 12:00 a.m. ET Saturday 2027-11-27 (`estimate`; the 2027-12-07/08
  meeting is itself tentative on `federalreserve.gov`). The deadline is a fact; there is no base rate.
- **Watch (dated)** — next pulse **2026-10-08** · Nasdaq 2027 calendar publication (unscheduled) ·
  VIX expiration **2027-11-17** (est) · **NYSE closed 2027-11-25** (est) · this early close
  **2027-11-26** (est) · blackout opens **2027-11-27** (est) · month-end print stack **2027-11-30**.

## Initial research

### The question, plainly

This id existed only as a proposal, written by the `thanksgiving-market-closure-2027-11-25` adjacency
sweep, which argued the row earns its place because bonds outlive equities by an hour on this session
and because it is the deadline session of the December FOMC blackout. Two questions follow. **Is the
one-hour split a real market-structure fact, stated at the precision the sources support?** And — the
question no sibling in this class has asked — **does the fixed-income tape behave differently on a
half session than on an early close where only the cash market is truncated?**

**One-line verdict:** the schedule facts hold and reproduce, two inherited claims need narrowing, and
the measured finding is an asymmetry nobody had looked for: this slot removes volume from the bond tape
without removing price movement, unlike the pre-Memorial-Day early close, which removes both.

### Method

Macro / market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — no
symbol-keyed instrument applies (`symbols: []`). Every primary was fetched this session; nothing is
inherited from the proposal or from the 05-28 sibling.

- **SIFMA** `sifma.org/resources/general/holiday-schedule` — HTTP 200, 299,159 bytes. The year/region
  tabs are hidden panels the rendered text drops, so the embedded RSC payload was parsed and the 2027
  US Thanksgiving card read verbatim from payload node 98, with its surrounding cards used to establish
  panel attribution. The scope and settlement paragraph was read verbatim, not summarised.
- **NYSE** `nyse.com/markets/hours-calendars` — HTTP 200, 109,180 bytes (needs `curl -L`); every
  `close early at` footnote extracted in full, including the late-session sentence the proposal omitted.
- **Nasdaq** `nasdaqtrader.com/trader.aspx?id=Calendar` — HTTP 200, 54,661 bytes. **Not blocked on this
  runner**, contrary to the standing blind-spot note in `EVENT-RESEARCH.md` → *Honesty rules*.
- **US Treasury** `api.fiscaldata.treasury.gov` `auctions_query` — 27 `auction_date` queries and 27
  `issue_date` queries, one per day-after-Thanksgiving 2000–2026, all HTTP 200.
- **Measured, Yahoo split/dividend-adjusted daily bars** (the source `scripts/research/market-data.mjs`
  uses) with volume: **SPY, TLT, IEF, SHY, AGG, LQD, BND, TIP, HYG, MUB, ^VIX, ^TNX**, on two slots —
  the **day-after-Thanksgiving** (fourth Thursday of November + 1) and, as the control, the
  **pre-Memorial-Day Friday**, 1990–2026 wherever an instrument existed. Metric per instance: session
  volume ÷ trailing-20-session median volume, and |close-to-close return| ÷ trailing-20-session median
  |return|. Significance by **two-sided exact sign test** on same-year paired differences.
- **Read, not fetched:** Yahoo chart metadata `fullExchangeName` for each ETF's listing venue.
- **Re-grepped, not cited:** `docs/plans/trade-playbooks.md`, `docs/research/multi-symbol-sweep.md`.

### Conviction legs, tested

1. **The date, the 14:00 ET time and the panel attribution reproduce first-hand — SUPPORTED (and it
   stays `estimate`).** Payload node 98 is three fields: `Thanksgiving Day` / `Thursday, November 25,
   2027` / `Early Close (2:00 p.m. Eastern Time): Friday, November 26, 2027`. Attribution is settled by
   the run it sits in — `Labor Day / Monday, September 6, 2027`, `Columbus Day / Monday, October 11,
   2027`, `Veterans Day / Thursday, November 11, 2027` — a US-only sequence, where the Japan panel's
   cards each carry a `Tentative - Subject to confirmation by the Bank of Japan` note this one lacks.
   The full 2027 US early-close set is **03-25, 05-28, 07-02, 11-26, 12-23, 12-31**; MLK and Presidents
   Day 2027 carry no note (the negative control). Statute and arithmetic agree independently: 5 U.S.C.
   6103 fixes the fourth Thursday, 2027-11-01 is a Monday, so the fourth Thursday is 2027-11-25 and the
   day after is Friday 2027-11-26. It stays `estimate` on three counts — the prefix taxonomy has no
   slot for a trade association's recommended schedule, this lane may not self-confirm, and the source
   is non-binding by its own terms.

2. **The one-hour split is real, but the proposal overstated it — MIXED, and this is narrowing one.**
   NYSE footnote `***` reads verbatim: *"Each market will close early at 1:00 p.m. (1:15 p.m. for
   eligible options) on Friday, November 27, 2026, Friday, November 26, 2027, and Friday, November 24,
   2028 (the day after Thanksgiving). NYSE American Equities, NYSE Arca Equities, NYSE National, and
   NYSE Texas late trading sessions will close at 5:00 p.m."* The proposal wrote that between 13:00 and
   14:00 ET *"the US Treasury tape is the only US price discovery still running"* — the second sentence
   of the footnote refutes that as written. What ends at 13:00 is the **core session and the closing
   auction**. So the accurate statement is narrower and still useful: on 2027-11-26 every listed bond
   proxy stamps its **official closing price an hour before the cash market it tracks stops trading**,
   and that hour has late-session prints at minimal depth and no auction to mark against.

3. **The duration ETFs list on Nasdaq, not NYSE Arca — SUPPORTED, and this is narrowing two.** The
   05-28 sibling's leg 2 asserts *"NYSE Arca — where every duration ETF trades."* Yahoo chart metadata
   read this session: **TLT, IEF, SHY, BND → NasdaqGM**; AGG, LQD, TIP, HYG, MUB → NYSEArca; SHV →
   NYSE; SPY → NYSEArca. NYSE's `***` footnote binds *NYSE's* markets, so for the three Treasury
   ETFs the operative venue is Nasdaq — and **Nasdaq's own calendar publishes early closes only through
   2026-12-24, with no 2027 rows at all.** Nothing here doubts that the half day will apply market-wide;
   it records that as of 2026-09-08 the 13:00 close for TLT/IEF/SHY is **not yet documented by their own
   listing venue**, which the sibling's framing would have hidden.

4. **The half session removes volume from the bond tape without removing price movement — SUPPORTED,
   and it is this ledger's contribution.** Two slots, each session against its own trailing-20 median:

   | Instrument | Day-after-Thanksgiving vol / \|ret\| | Pre-Memorial Friday vol / \|ret\| |
   |---|---|---|
   | **SPY** | **0.429×** / 0.684× | 0.781× / 0.807× |
   | **TLT** (20y+) | **0.480×** / **0.953×** | 0.737× / 0.572× |
   | **IEF** (7–10y) | **0.456×** / **1.126×** | 0.799× / 0.672× |
   | **SHY** (1–3y) | **0.441×** / 0.819× | 0.780× / 0.750× |
   | **AGG** | 0.509× / 0.833× | 0.767× / 0.549× |
   | **LQD** (IG) | 0.449× / 0.763× | 0.751× / 0.528× |
   | **BND** | 0.501× / **1.235×** | 0.867× / 0.406× |
   | **TIP** | 0.548× / **1.101×** | 0.885× / 0.858× |

   Same-year paired, **volume is decisively lower on the half day**: SPY thinner in 26 of 33 years
   (p = 0.0013), SHY 20/23 (p = 0.00049), LQD 18/23 (p = 0.011), BND 16/19 (p = 0.0044), AGG 16/22
   (p = 0.052). The |move| side is where the slots part. On the **control** slot the bond tape is
   significantly *quieter* than normal — above-normal |move| in only 6 of 24 years for TLT (p = 0.023),
   6/24 for LQD (p = 0.023), 4/20 for BND (p = 0.012). On the **half day** that suppression is gone:
   TLT 11/24, IEF 13/24, SHY 9/24, AGG 10/23, BND 10/19, TIP 13/22 — every p > 0.5, medians clustered
   0.82×–1.24×. Volume halves; the move distribution does not shift. **Thin is measured; calm is not.**

5. **The medians above 1.0× are not a claim that the belly moves *more* — REFUTED as a directional
   read.** IEF's 1.126× and BND's 1.235× medians are tempting and do not survive their own sign test
   (13/24, p = 0.84; 10/19, p = 1.00), and the per-year IEF series spans **0.07× to 4.00×**. The
   supported claim is the *absence* of suppression, not the presence of excess. Recording the refusal
   is the point: the same numbers would have made a much more exciting and much less true ledger.

6. **The sample's largest bond move landed on a half day, in 2027's own weekday geometry — SUPPORTED.**
   **2021-11-26** (Omicron): SPY **−2.23%**, TLT **+2.53%**, IEF **+1.29%**, `^TNX` **−16.3bp** against
   a 2.95bp median for this slot, VIX **+54.0%** — on 3½ hours. 2021 is one of the four years since 1999
   in which Thanksgiving fell on **November 25**, the same date it falls in 2027. It is n = 1 and proves
   no base rate; it is the existence proof that makes leg 4's asymmetry consequential rather than cute.

7. **The issuer treats the session as unusable for price discovery but not for cash — SUPPORTED, from a
   primary independent of both calendars.** `auctions_query` filtered on `auction_date` returns **0 rows
   for all 27 day-after-Thanksgiving dates 2000–2026**. Filtered on `issue_date` the same 27 dates return
   **98 settlements** — 13-week, 26-week and 4-week bills every year, plus a `9-Year 8-Month` note (a
   10-year reopening) in 2013/2014/2019/2024/2025 and a `1-Year 11-Month` note (a 2-year reopening) in
   ten years since 2014. The auction slate moves *around* the closure instead: in 2025 the 7-year note
   went off Wednesday 2025-11-26, and in 2024 Monday/Tuesday/Wednesday carried the 2y/5y/7y. So on
   2027-11-26 the extra cash hour carries **settlement obligations and no supply event**, which is
   exactly what SIFMA's own sentence predicts: *"Previously scheduled SIFMA early close recommendations
   do not affect the closing time for settlements."*

8. **The bond tape holds up *relatively* better than equities on this slot than on the control —
   MIXED, deliberately not claimed.** Paired against SPY the same day, TLT's volume ratio exceeds SPY's
   in **17 of 24** half days (median relative 1.083, p = 0.064) and AGG's in 16 of 23 (1.195, p = 0.093),
   where on the control slot TLT is 11/24 (0.948, p = 0.84) and AGG 11/23 (0.981, p = 1.00). Tempting,
   and it is left at MIXED for a reason: both SPY and the ETFs are truncated **identically** on this
   date, so no hours mechanism can explain it, and the obvious confound — SPY's retail and day-trading
   flow being the component that vanishes on a holiday Friday — is untested here. Registered as a
   forward test rather than asserted.

9. **The Fed-deadline composition is a fact with no base rate — MIXED, inherited unchanged.**
   2027-11-26 is the last session before the December 2027 FOMC communications gate opens 12:00 a.m. ET
   Saturday 2027-11-27 (`fomc-blackout-start-2027-11-27`, `estimate`, for a meeting `federalreserve.gov`
   itself calls tentative). That lane measured only 4 of 167 gates since 2007 with this geometry, so
   there is no sample to price it from, and legs 4–6 bound the *holiday* component only.

10. **Nothing in the house system is calendar-keyed — SUPPORTED, re-verified not inherited.** A grep of
    `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md` for
    `holiday|thanksgiving|black.?friday|half.?day|early.?close|closure|blackout` returns **zero hits in
    both**, run this session.

11. **The adjacency sweep found no untracked dated event — and two known ones are deliberately not
    proposed.** Within ±5 days, all tracked, all `estimate` except one:
    `thanksgiving-market-closure-2027-11-25` (−1), `thanksgiving-half-day-2027-11-26` (0),
    `fomc-blackout-start-2027-11-27` (+1), `consumer-confidence-2027-11-30` (+4) and
    `fhfa-hpi-2027-11-30` (+4, `confirmed`). `vix-expiration-2027-11-17` sits at −9, outside the window.
    The SIFMA parse names two further untracked 2027 US bond early closes — **2027-07-02** and (as a
    canonical file) **2027-12-31** — recorded here and **not** proposed, following the 03-25/05-28
    siblings' stated precedent: structurally identical objects with zero measured impact, where four
    proposals would spend four sessions re-deriving leg 4.

### What plays the conditions support

None. `symbols` is empty, impact is `low`, the date is `estimate` and the source is a recommendation
rather than a rule. The supported outputs are the corrected session description, the two sibling
narrowings, the thin-not-calm asymmetry, the issuer's auction-free/settlement-heavy treatment, and
three registered forward tests.

### Honest limits

- **Two slots is n = 2 slots.** Leg 4 contrasts one truncated-equity session against one
  full-equity session; every difference between them (holiday length, month, year-end proximity,
  Thanksgiving's own flow pattern) is confounded with the hours. The asymmetry is a measured
  regularity across 33 years of *one* slot pair, not an identified mechanism.
- **The cash tape itself was never measured.** No retrieved source gives cash-Treasury or TRACE
  volume, so what happens to *cash* liquidity between 13:00 and 14:00 ET is unmeasured. Every number
  here is an exchange-listed proxy.
- **Daily bars only.** The natural question — what the 13:00–14:00 ET hour looks like — needs intraday
  data this repo's instruments do not provide.
- **`^VIX` carries a phantom bar on a confirmed closure.** Yahoo's `^VIX` series has a 2026-09-07 bar
  (15.30) on a date `SPY` correctly skips as the Labor Day full closure. VIX-keyed holiday statistics in
  this class must be filtered against an equity trading calendar, never against the VIX series' own
  dates. It does not affect legs 4–6, whose slot dates are real trading days.
- **The historical bond schedule was not verified year by year.** Only SIFMA's 2026 and 2027 panels are
  published today; the day-after-Thanksgiving 14:00 ET close is assumed to have applied in earlier years.
  This qualifies the *label* on the sample, not leg 4's paired arithmetic.
- **CME was not attempted.** `cmegroup.com` has 403'd this runner in every sibling lane; rather than
  spend a fetch to re-record the same block, this ledger simply does not assert what Globex does with
  rate futures that afternoon. It remains the one channel that could carry the deadline into a
  tradeable instrument.
- **No significance is claimed where the sign test does not support it** (leg 5), and the event is
  `estimate` (leg 1). Estimates widen caution and license nothing.

## Stance & kill switches

**Stance (2026-09-08):** stand aside, permanently and structurally — and **correct the shape of the
session** two sibling ledgers describe. Concretely: (a) the SIFMA-recommended 14:00 ET fixed-income
close on 2027-11-26 reproduces first-hand from SIFMA's own 2027 US panel (`estimate`), against a 13:00
ET equity core close and 13:15 for eligible options. (b) What ends at 13:00 is the **core session and
closing auction**, not all listed trading — listed venues keep a late session to 17:00 ET — so the
precise fact is that every listed bond proxy prints its official close an hour before the cash tape it
tracks stops. (c) TLT, IEF, SHY and BND list on **Nasdaq**, not NYSE Arca, and Nasdaq publishes no 2027
calendar as of today. (d) Measured across 33 years against the pre-Memorial-Day early close as a control,
this slot removes **volume** from the fixed-income tape (SPY 26/33, p = 0.0013; SHY 20/23, p = 0.0005;
LQD 18/23, p = 0.011; BND 16/19, p = 0.0044) but **not price movement** — the significant |move|
suppression on the control slot is absent here, every p > 0.5. (e) The direction is *not* claimed: the
above-1.0× medians fail their own sign tests and are refused. (f) 2021-11-26, 2027's own weekday
geometry, is the existence proof — TLT +2.53%, 10y −16.3bp, VIX +54% on 3½ hours. (g) Treasury holds
**0 auctions in 27 years** on this date and **98 settlements**, so the extra cash hour carries
obligations and no supply. Every statement carries the event's **`estimate`** label.

**Kill switches:**

- **IEF's 2027-11-26 |move| ratio prints below 0.80× its trailing-20 median while its volume ratio
  prints below 0.70×** — thin *and* calm on the instance that matters, and the asymmetry in (d) dies.
  Registered as **FT-sifma-bond-early-close-2027-11-26-1**, score by 2027-12-03.
- **Treasury announces or holds an auction dated 2027-11-26** — the 0-of-27 structural fact in (g)
  breaks, and the extra cash hour acquires a supply event. Registered as
  **FT-sifma-bond-early-close-2027-11-26-2**, score by 2027-12-03.
- **TLT's 2027-11-26 volume ratio prints below SPY's same-day volume ratio** — the relative-resilience
  pattern in leg 8 fails on the instance, and the MIXED verdict hardens to REFUTED. Registered as
  **FT-sifma-bond-early-close-2027-11-26-3**, score by 2027-12-03.
- **SIFMA revises, withdraws or re-dates the 2027-11-26 recommendation** — the event's premise changes
  and this ledger re-dates.
- **NYSE removes or re-times the `***` early close for 2027-11-26** — the one-hour split inverts or
  vanishes, and (a), (b) and leg 4's whole slot definition need rewriting.
- **Nasdaq publishes a 2027 calendar whose early closes exclude 2027-11-26** — (c) becomes a live
  discrepancy between two listing venues rather than an undocumented-yet note, and the ETF-hours
  premise behind leg 4's proxies has to be re-argued.
- **A calendar- or session-hours-keyed house playbook is written and back-tested** — leg 10 goes stale
  and the stand-aside must be re-argued on measured data rather than on absence.
- **The adjacent blackout's premise moves** — if the meeting before it does not confirm a 2027-12-07/08
  FOMC, the "last session before the gate" framing in leg 9 loses its date entirely.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-08 | 444 | **Initial research; canonical `<id>.json` written**, shadowing the one proposal (`from-thanksgiving-market-closure-2027-11-25`), read first. SIFMA fetched (HTTP 200, 299,159 B), payload node 98 = `Thanksgiving Day` / `Thursday, November 25, 2027` / `Early Close (2:00 p.m. ET): Friday, November 26, 2027`; attribution fixed by the surrounding US-only run (Labor/Columbus/Veterans 2027); MLK + Presidents Day carry no note. **Two sibling claims narrowed:** NYSE's `***` footnote (HTTP 200, 109,180 B) also says late sessions run to 17:00 ET, so what ends at 13:00 is the *core session and closing auction*, not all listed trading; and TLT/IEF/SHY/BND list **NasdaqGM**, not NYSE Arca, while Nasdaq's calendar (HTTP 200, 54,661 B — **not blocked on this runner**) publishes no 2027 rows. **Measured (new), day-after-Thanksgiving vs pre-Memorial-Day control, 1990–2026:** volume decisively thinner on the half day (SPY 26/33 p=0.0013, SHY 20/23 p=0.0005, LQD 18/23 p=0.011, BND 16/19 p=0.0044) but the control slot's significant \|move\| suppression (TLT 6/24 p=0.023, LQD 6/24 p=0.023, BND 4/20 p=0.012) is **absent** here (TLT 11/24, IEF 13/24, BND 10/19, all p>0.5). Above-1.0× medians **refused** (fail own sign tests). Existence proof: 2021-11-26, same Thu-Nov-25 geometry — TLT +2.53%, `^TNX` −16.3bp vs 2.95bp median, VIX +54%. **Treasury (fiscaldata, 54 queries):** 0 auctions on all 27 day-after-Thanksgiving dates 2000–2026; **98 settlements** across the same dates. Adjacency — peers n/a (`symbols: []`); macro: none datable to 11-26; VIX **15.72** (close 2026-09-08); geopolitical: none; tape: 5 tracked events within ±5 days (11-25 closure, 11-26 half day, 11-27 blackout, 11-30 confidence + FHFA). CME not attempted (403 in every sibling lane). **No new calendar file proposed:** 2027-07-02 recorded, not proposed, per the 03-25/05-28 precedent. | Initial stance set: **stand aside**, with the session re-described as **thin but not calm** and two sibling claims narrowed. Registers **FT-sifma-bond-early-close-2027-11-26-1**, **-2** and **-3**. | 2026-10-08 |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-sifma-bond-early-close-2027-11-26.json`
(`status: "estimate"`) in the same PR — your own file, never another event's canonical one (#1717).
Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from
memory — after which this doc goes quiet.
