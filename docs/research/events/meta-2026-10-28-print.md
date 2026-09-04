# META earnings print — meta-2026-10-28-print

**Kind:** earnings · **Date:** 2026-10-28 (estimate, 8-K cadence) · **Impact:** critical
**Last assessed:** 2026-09-04
<!-- probe-ref: {"symbols":{"META":611.31},"vix":14.1,"daysBand":"critical:21+","adjacentIds":["aapl-2026-10-29-print","amzn-2026-10-29-print","consumer-confidence-2026-10-27","fomc-2026-10-28","gdp-q3-2026-advance-2026-10-29","goog-2026-10-28-print","ism-manufacturing-2026-11-02","msft-2026-10-27-print","pce-2026-10-29","sloos-2026-11-02","treasury-borrowing-estimates-2026-11-02"],"screenStreak":0} -->

## At a glance

**TL;DR.** Stand aside directionally and let the guards do the work. META's print is a known-date
variance bomb — 2026 tails run ±10% in a single night — and no META-specific edge survived the
sweep's red team. **The Q3 EPS line is pre-broken and the street has not marked it:** Meta's
2026-08-26 state-AG settlement carries a self-disclosed **~$10B legal accrual in Q3 2026**,
explicitly outside the guidance given on the Q2 call — roughly **$3.90/share** pre-tax on ~2.57B
diluted shares — and **nine days later the street Q3 EPS number is still ~$6.75, unmoved**. So a
headline "EPS miss" on 10-28 is *mechanically expected*, into a market that sold exactly that shape
9.6% after hours in July. **The stock, meanwhile, added ~7% in two sessions** on the 09-03 Muse
Spark 1.3 release — narrative repricing with no measured edge attached, which raises event risk
rather than resolving it. At **$613.88** (09-03) META is still ~**22% below** its $790.00 record
close, set **2025**-08-12; the "round-tripped back toward highs" framing was retired on 09-01 and a
7% pop does not revive it. Date is still an **estimate** (D-54), and an estimate only widens caution.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** | High | No META-specific edge survived the red team; "the legal overhang cleared" and now "Muse Spark 1.3 re-rates the AI story" are narratives, not measured edges, exactly like punish-capex-then-forgive | ≥3 new prints showing a repriced gap regime — the only stated bar |
| This week | **Nothing to do** | High | The date is unconfirmed and the one dated catalyst before the print (Connect, 09-23) is a product event, not a numbers event | IR confirms a date ≠ **2026-10-28**, re-keying the S2 flat-by date |
| This month | **Treat the post-print leg as unresolved, not as tested** | Medium | FT-4's score date passed unscored and the instrument is blind to the print it measures — absence of a score is not evidence of no signal | FT-4 actually scored — by a repaired instrument or an owner that isn't a close-out — with signal in either direction |
| This quarter | **S2 and E1 only — flat across the print** | High | ±10% single-night tails, no edge to pay for them, a pre-announced ~$10B charge the street has not marked into its ~$6.75, and ~7% of fresh AI-narrative air added in two sessions — more distance to give back, not less | Nothing kills a no-alpha guard; shorting unblocking activates S3 on MSFT first, META only as a lean |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — take a directional META position into the print; the tails are ±10% and nothing pays for them.
- **Never** — treat punish-capex-then-forgive, the cleared legal overhang, or a model-release pop as a signal; all three are risk observations, not edges.
- **Never** — compare the 10-28 headline EPS to the ~$6.75 street number without first establishing whether that number carries the ~$3.90/share charge; a mechanical miss is not a fundamental one.
- **Watch (dated)** — street Q3 EPS still **$6.75 as of 2026-09-04**, unmoved 9 days after the charge was disclosed; registered as **FT-meta-2026-10-28-print-1**, scored **2026-10-27** · Meta Connect keynote **2026-09-23** (now on the calendar, `estimate`) · FT-4 **overdue since ~2026-08-27**, blocked on instrument coverage · IR date announcement, expected ~**2026-10-07** · estimated print **2026-10-28**, the same day as the confirmed FOMC statement.
- **If shorting unblocks** — the S3 mega-cap fade activates on MSFT first; META is a direction-only lean, never at MSFT sizing.
- **Re-opens the gap-capture kill only on** — ≥3 new prints showing a repriced gap regime.

## Initial research

**The question, plainly.** META reports Q3 2026 around 2026-10-28 (**estimate**). What is likely
to happen, how will the market react, and do any house playbooks apply — given the sweep already
killed most META-shaped alpha on 2026-08-12?

**One-line verdict:** No directional edge survives on META — this print is a guard-rails event
(S2 flat-by-print, E1 execution discipline) into a newly volatile reaction function: the July
Q2 print showed the market now punishes capex/EPS softness hard (−9.6% after hours) and then
forgives fast (full recovery within ~2 weeks).

**Method.** Both instruments re-run fresh 2026-08-17 (cache busted earlier today):
`earnings-cycle.mjs META --bench QQQ --peers GOOG,MSFT,AMZN` (56 prints, 2012-07-26..2026-04-29,
history through 2026-08-14) and `intraday-edges.mjs META` (721 sessions, 2023-09-18..2026-08-14,
hourly + 5-min). Read against the house playbooks exactly as
[`multi-symbol-sweep.md`](../multi-symbol-sweep.md) characterizes them for META, plus sourced web
research on the Q2 print, Q3 consensus, and the print date. **Instrument caveat (known debt, not
repaired here):** the earnings-cycle event list ends at the 2026-04-29 print — META's real newest
print (2026-07-29) is absent, consistent with the sweep's forward-window-guard blindness
("Pipeline integrity" item 5). Every "modern era n=14" figure below therefore excludes the July
print — whose −9.6% after-hours reaction is precisely the tail the excluded sample understates.

**Conviction legs tested:**

1. **S1 pre-print positioning on META — REFUTED** (sweep kill list, re-confirmed by today's
   re-run). Modern-era D-20 run-up is +4.91%/win 71%, but the control kills it: P(10/14 | the
   era's own 63% base) = 0.3762, not significant — and peers run *harder* over META's own
   pre-print windows (GOOG +5.85%/86%, AMZN +5.14%, MSFT +3.69%): sector seasonality wearing a
   META costume. No pre-print entry, at any window (date **estimate** — irrelevant, since no
   entry exists to time).
2. **Hold-the-print / gap-capture — REFUTED** (kill list #6; anti-S2). The 2023–26 gap mean
   +4.74%/win 64% looks seductive; the sweep showed it t=1.69-fragile against a −24.26% p10 in
   2020–22, win rate indistinguishable from an ordinary overnight. Today's re-run reproduces the
   same shape (ALL-era gap win 59%, p10 −7.48%). The 2026-07-29 print — outside the instrument's
   corrupted window — gapped ~−9.6% after hours on a *revenue beat* (EPS miss on legal/severance
   charges, FCF $784M, capex guide raised to $130–145B; tradingkey.com / investing.com
   transcripts, 2026-07-29/30). Fresh out-of-sample confirmation that the gap is bought
   insurance, not income. S2 applies with feeling (date **estimate**: flat-by-D-1 must key off
   the IR-confirmed date, not the cadence estimate).
3. **S3 reaction-day fade — MIXED, inert.** Direction-only lean per the sweep (META never
   cleared the corrected bar; MSFT/GOOG did). Re-run: modern reaction-day session −0.70%/win 29%
   vs an ordinary session's +0.07%/51% — the lean persists but shorting is blocked, so this stays
   observation-only (registered below as a zero-size forward-test candidate, subject to the
   caller's register).
4. **Post-print drift — MIXED, negative-leaning.** D+1→D+21 vs QQQ is negative in 3 of 4 eras
   (modern −1.25%/win 43%); the stand-aside read is already registered as FT-4 in
   [`forward-tests.md`](../forward-tests.md) (scores ~2026-08-27 on the July print — do not
   duplicate). Nothing here licenses a post-print entry either way.
5. **The reaction function has repriced — SUPPORTED (new since the sweep).** Q2 2026 (07-29):
   revenue $60.8B beat (+28% y/y) yet the stock fell ~9.6% after hours on the EPS miss and capex
   fear, dropped toward a 52-week low, then rallied ~25% off the low with reports of a fresh
   all-time high by mid-August (barchart/nasdaq, 2026-08-12; vantagemarkets August outlook). The
   October print's bar is therefore **margins and capex discipline, not revenue** — Q3 guide is
   $61–64B (company, 07-29), street consensus ~$63.1–63.3B revenue / ~$6.95 EPS (TipRanks /
   Investing.com aggregates, checked 2026-08-17). Both surprise directions are live: another
   EPS/FCF miss meets a stock that has round-tripped back to highs.
6. **Intraday structure — E1/S4 as characterized.** First hour carries 31.7% of daily vol at
   −0.003% mean (E1 supported: defer non-urgent entries); overnight carries ~75 of the 87.2
   total buy-and-hold points, but no timing strategy beats buy-and-hold net of 5bps (S4 kill
   stands; keep only the close-side execution preference).

**What the conditions support:** guard rails only. S2 (universal, no-edge claim): any paper
position flat by D-1 of the **IR-confirmed** date — until confirmation, the cadence estimate
only widens caution (treat the whole 10/26–10/30 mega-cap week as the danger window). E1 for any
execution near the event. No S1-family entry; no gap-hold; no stacking with the GOOG pre-print
long (GOOG prints the same estimated day — the sweep's one-trade-eight-slots warning applies
verbatim).

**Honest limits.** Instrument sample excludes the July 2026 print (known pipeline debt); all
modern intraday numbers are one 2023–26 bull regime; the date is a cadence **estimate** (Meta IR
listed no upcoming events as of 2026-08-17 — aggregators converge on Wed 10-28 AMC, and Meta's
own Q3 cadence, 2024-10-30 and 2025-10-29, both last-Wednesday-of-October, is consistent);
implied move is not meaningfully quotable at D-72 and was not found from a primary source.

## Stance & kill switches

**Stance (date estimate throughout):** stand aside directionally; enforce S2 and E1. The print
is a known-date variance bomb whose 2026 tails run ±10% single-night; no META-specific edge
survived the sweep's red team and nothing since 2026-08-12 resurrects one. The one genuinely new
fact — the market's punish-capex-then-forgive reaction to Q2 — raises event risk without
licensing a trade (estimates only widen caution, never license action).

**Amendment 2026-09-01 (receipt: the ledger row of that date).** Two things the initial research
did not have, neither of which moves the call:

- **The Q3 headline is pre-broken.** The 2026-08-26 state-AG settlement carries a company-disclosed
  **~$10B legal accrual in Q3 2026**, stated as outside the expense outlook given on the 07-29 call
  — ≈**$3.90/share** pre-tax on the Q2 diluted count. Street EPS still reads ~$6.75. So a headline
  EPS miss on 10-28 is *mechanically expected*, and this doc's own leg-5 framing ("the bar is
  margins and capex, not revenue") now has a third term that is neither: an accounting charge. The
  Q2 tape sold a charge-driven miss −9.6% after hours, but this charge is **pre-announced**, which
  cuts both ways — it widens the plausible reaction distribution rather than pointing at a
  direction. That strictly reinforces stand-aside; it does not create a fade.
- **Level correction (an error this doc carried, not a market move).** META closed **$572.34** on
  2026-08-31 — ~**27% below** the $790.00 record close and ~10% *above* the $520.26 52-week low.
  That record was set **2025-08-12**; the initial research read it as 2026-08-12 and wrote "reports
  of a fresh all-time high by mid-August," a framing the 08-24 and 08-29 rows then repeated. It is
  retired. Past rows stand as written (append-only); the correction lives here and in the 09-01 row.

**Amendment 2026-09-04 (receipt: the ledger row of that date).** The call does not move; two things
are now sharper than the 09-01 amendment could state:

- **The street has not marked the charge.** Q3 consensus EPS reads **$6.75** on 2026-09-04 — a
  fourth consecutive flat pass, and the first one that falls *after* the 08-26 disclosure has had
  more than a week to propagate. That turns "a headline miss is mechanically expected" from an
  inference into a measurable, falsifiable claim, registered as **FT-meta-2026-10-28-print-1**
  (zero capital, scored at D-1). **Honest limit:** the aggregators do not publish the *basis* of
  the $6.75 figure, so "the street has not marked it" and "the street quotes an ex-charge number by
  convention" are not distinguishable from the printed consensus alone. Either way the practical
  instruction is the same and unchanged: never read the 10-28 headline against $6.75 raw.
- **Settlement size, primary-sourced.** The 09-01 row logged an unreconciled press range
  ($16.68B–$18B). The state AGs' own releases narrow it: NY "up to **$17.1 billion**", California
  "**$17 billion**", Virginia "$17 billion" — paid over 10 years, approved by Judge Yvonne Gonzalez
  Rogers (N.D. Cal.) on **2026-08-26** with an independent compliance auditor. CNN's "$18 billion"
  is the outlier. The **~$10B Q3 accrual** figure is unchanged and consistent across every source.

**Kill switches / what changes this stance:**

- **IR confirms a date ≠ 2026-10-28** → the S2 flat-by date re-keys immediately; the estimate
  never anchors action.
- **≥3 new prints showing a repriced gap regime** → the only stated bar for revisiting the
  gap-capture kill (sweep rule); nothing less reopens it.
- **Shorting unblocks** → the S3 mega-cap fade class activates on MSFT first, META only as the
  lean it is (direction-only, never at MSFT sizing).
- **Street Q3 EPS consensus drops below ~$6.00 on any pulse** → the charge *is* being absorbed, and
  the "a headline miss carries no information" framing must be retired from the decision header,
  because a miss against a marked number would then be a real one (FT-meta-2026-10-28-print-1's
  kill switch, scored 2026-10-27).
- **FT-4 scores ~2026-08-27** → if the July stand-aside window shows real signal either way, the
  post-print leg of this stance gets rewritten with that receipt.
  **Status 2026-08-29: the date passed and the switch did not fire, because nothing scored it.**
  [`forward-tests.md`](../forward-tests.md) still shows FT-4 `_open_`. A cache-busted re-run today
  verified the blocker rather than assuming it: `earnings-cycle.mjs META` reports **56 prints,
  2012-07-26 .. 2026-04-29** with price history through **2026-08-28** — fresh prices, stale event
  list. The instrument is still blind to the **2026-07-29** print FT-4 measures (the sweep's known
  forward-window-guard debt, "Pipeline integrity" item 5), so the test cannot be scored from
  instrument data, and no close-out will reach it either: FT-4 is keyed to a *past* print that has
  no ledger of its own, so no `event-passed-unscored` pass owns it. **The honest consequence for
  this stance: the post-print leg stays MIXED/unresolved and must not be read as "tested and
  found flat."** Absence of a score is not evidence of no signal. This doc does not improvise a
  scoring method inside a pulse row; it records the orphan and leaves the register untouched.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-08-17 | D-72 | Initial research banked; both instruments fresh (event list ends 2026-04-29 — the 2026-07-29 print is missing per the sweep's known forward-window blindness; caveated, not repaired). Date hunt: Meta IR lists no upcoming events (checked 2026-08-17); aggregators converge Wed 10-28 AMC — stays **estimate**. Adjacency: no peer prints since 08-15 (weekend); NVDA 08-26 confirmed / MRVL 08-27 confirmed / AVGO 09-02 announced — all already proposed via the NVDA doc's 08-17 row; no macro prints since 08-15; VIX 14.56 Fri 08-15 (2026 low) with SKEW +6.6% m/m and Brent +6.0%/wk — calm index, rising tail-hedge demand; no new export-control/policy action touching META. Event tape (**estimate**): Q3 consensus ~$63.1–63.3B rev / ~$6.95 EPS vs company guide $61–64B; stock has round-tripped the July −9.6% AH selloff back toward highs (~25% off the low); implied move not quotable at D-72. FT-4 (META post-print stand-aside) scores ~08-27, before this doc's next check. | — (stance set) | 2026-08-24 (critical, 61+d band: every 7d) |
| 2026-08-24 | D-65 | Adjacency sweep. Event tape: date convergence on 10/28 holds (TipRanks/Investing.com "confirmed," one Wall Street Horizon page still flags "unconfirmed") — no Meta IR primary posted, stays **estimate**. Consensus drifted slightly: EPS ~$6.75 (from ~$6.95 at D-72), revenue ~$63.26B (essentially unchanged from ~$63.1-63.3B) — normal estimate-revision noise, not material. Peers: NVDA/MRVL both report this week (own docs); AVGO's XPV overhang deepened (own doc). Macro: no CPI/jobs surprise since 8/17; Sep-16 FOMC read is 68.4% hold/31.6% hike as of 8/20 (FOMC sibling doc). Volatility regime: VIX 15.13, calm, no shift. Geopolitical: Brent -1.38% to $93.09 on 8/24, first pause in the two-week escalation (new Iran sanctions pending) — same finding as sibling docs. No new dated adjacency found. | — (no change; too far out for a substantive stance shift) | 2026-08-31 (critical, 61+d band: every 7d) |
| 2026-08-29 | D-60 | Adjacency sweep; band shortened as days-until crossed into the 21–60d/3d cadence. **The headline this pass is a registered falsifier that came due and could not fire.** This doc's decision header named "FT-4 scoring on 2026-08-27 with signal in either direction" as its *This month* falsifier. The date passed; [`forward-tests.md`](../forward-tests.md) still shows FT-4 `_open_`. Rather than assume the reason, both instruments were **re-run with the cache busted** today: `earnings-cycle.mjs META --bench QQQ --peers GOOG,MSFT,AMZN` reports **56 prints, 2012-07-26 .. 2026-04-29**, price history **2012-05-18 .. 2026-08-28** (3,590 sessions) — **fresh prices, stale event list**. The forward-window-guard debt is therefore *unrepaired*, and the instrument remains blind to the **2026-07-29** print FT-4 measures, so the test is unscoreable from instrument data. Compounding it, FT-4 is keyed to a past print with **no ledger of its own**, so no `event-passed-unscored` close-out will ever pick it up — it is an orphan, named here and left untouched in the register (a pulse row does not improvise a scoring method, and editing the register is not this row's job). Honest consequence recorded in the stance: the post-print leg stays **unresolved**, and must not be read as "tested and found flat." **No instrument-level change otherwise** — every modern-era cell reproduces the initial research exactly (D-20 run-up 2023–26 n=14 **+4.91%/win 71%**, excess +2.01%; ALL-era gap win **59%**, p10 **−7.48%**), so the S1 refutation and the gap-capture kill both stand unchanged on fresh data. **Event tape:** date convergence on **2026-10-28** holds (TipRanks / Investing.com / Nasdaq, checked today); **no Meta IR primary posting found**, so the status stays **estimate**. Consensus is **flat this pass** — EPS ~**$6.75**, revenue ~**$63.26B** against the company's own $61–64B guide — i.e. no drift at all since the 8/24 row, which is itself worth stating after that row logged a $6.95 → $6.75 move. **Price:** META closed **$575.99** on 8/28 (day range $571.08–$589.19; `event-material-scan` probe reads **$578.02** — small source divergence, unreconciled). **Macro:** Warsh's 2026-08-28 Jackson Hole keynote repriced September hike odds **35.5% → 59.5%** (CME FedWatch; CNBC "coin flip") with a first ~50% October read from a single aggregator — detail in the sibling [`fomc-2026-10-28`](fomc-2026-10-28.md) row filed today. Read-through here is narrow and *reduces* one risk: 8/28 showed this chair's hawkish surprises price into the front end (2y +~8bp), not equity vol (S&P −0.13%/−0.25%, VIX at a 2026 low), which trims the Fed's share of the est.-10/28 collision — while changing nothing about S2, since the ±10% single-night tail is the print's own. Chicago PMI collapsed to **47.1** (Aug data, 8/28) vs ~58 consensus and was ignored by the tape. **Peers:** NVDA beat 8/26 (rev $96.2B, EPS $2.22, +106% y/y) on only ~+4–5% AH; MRVL beat 8/27 and fell **~7.6% AH** on Q3 margin compression; semis gave back on 8/28. No mega-cap peer print since 8/24; MSFT est. 10/27, GOOG est. 10/28, AMZN/AAPL est. 10/29 all still **estimate**, cluster intact. **Volatility regime:** VIX **14.43** (8/28 close, probe) vs 15.13 at the 8/24 row — calm, drifting into the year's low; no term-structure break found. **Geopolitical:** Brent below **$87** on a fourth straight down session after an Iran–Oman Hormuz agreement Tehran says does not reopen the strait; no new policy action touching META. **No new dated adjacency to propose.** Probe-ref block added (this doc had none, which is why the pulse could not be screened). | — (no change to the call — stand aside, S2/E1 only. But the post-print leg is explicitly re-labelled **unresolved rather than tested**: its scoring test is overdue, orphaned, and blocked on unrepaired instrument coverage, and absence of a score is not evidence of no signal.) | 2026-09-01 (critical, 21–60d band: every 3d) |
| 2026-09-01 | D-57 | Adjacency sweep. **The headline is a company-specific fact this ledger had not logged, and it is the largest single change to the 10-28 print since the initial research: Meta settled the 29-state youth-safety case on 2026-08-26 and will take a ~$10B legal accrual in Q3 2026.** Meta's own language, as reported across outlets, is that it "expects to accrue a legal expense of approximately $10 billion in the third quarter of 2026 related to the agreement" and that the charge was **not contemplated in the expense outlook** given on the 07-29 Q2 call, with all other 07-29 guidance ranges unchanged. On the Q2 diluted count (~2.57B) that is ≈**$3.90/share** pre-tax, against a street Q3 EPS still printing **~$6.75** (TipRanks, checked today — flat for a third consecutive pass). **Consequence for reading the print: a headline EPS miss on 10-28 is now mechanically expected and says nothing about the business** — which matters here specifically, because the July print's −9.6% after-hours reaction was itself to a charge-driven EPS miss. The charge is pre-announced, so it widens the reaction distribution rather than pointing a direction; it reinforces S2 and creates no fade. **This ledger logs it three days late** — the settlement broke 08-26, before the 08-29 row, whose sweep covered macro/peers/geopolitics but ran no company-legal check; naming the gap rather than backfilling it. Settlement size is **not reconciled across sources** and is reported honestly as a range: CNBC and Forbes $16.68B, Axios ~$17B, NBC/TechCrunch/WaPo/Variety "up to $18B", paid over 10 years; the ~$10B accrual figure is consistent everywhere. Product terms (teen time limits, nighttime blackouts, school-hour silencing, age verification, parental consent for safety settings) are an **engagement** question, not a charge question: Meta says U.S. under-18 users are ~0.5% of its global base; Wells Fargo and BMO both flag risk to teen engagement/ad load/pricing while Piper Sandler and Evercore read the settlement as clearing an overhang. Tape on the day: META opened +4.1%, gave most of it back once the $10B charge landed, closed ~+1.5% (08-26). **Treat "the overhang cleared" as a narrative, not an edge** — same status as punish-capex-then-forgive. **Level correction (this doc's own error, not a move):** META closed **$572.34** 08-31 (probe and stockanalysis.com agree exactly, resolving the 08-29 row's unreconciled $575.99/$578.02 divergence; −0.98% vs the 08-29 probe, far inside the 5% bar). 52-week range **$520.26–$790.80**; the record *close* $790.00 was **2025-08-12** with a $796.25 intraday 2025-08-15, so META sits ~**27% below** its high and ~10% *above* its low. The initial research's "fresh all-time high by mid-August," repeated in the 08-24 and 08-29 rows, was that 2025 record misdated to 2026 — retired in the Stance amendment above. **Event tape:** date convergence on 2026-10-28 AMC holds (TipRanks/Investing.com/Nasdaq/Zacks, checked today; Zacks still marks it unconfirmed, forecast from cadence); **no Meta IR primary found**, status stays **estimate**. **Peers:** no mega-cap peer print since 08-24 — MSFT est. 10-27, GOOG est. 10-28, AMZN/AAPL est. 10-29, cluster intact; AVGO prints 09-02 (semis, own doc). **Macro:** September hike odds continued the Warsh repricing, **59.5% (08-28) → 66% (08-31, CME FedWatch via Forbes)**; the 10Y hit its highest since January 2025 (^TNX 4.756, 08-31). 08-31 tape: S&P −0.33% to 7,686.14, Nasdaq −0.12% to 26,370.89, Dow −0.7% to 53,185.90, capping a positive August (S&P +2.6%, Nasdaq +3.9%). ISM Manufacturing and JOLTS land today (09-01) after this row; their own ledgers own them. **Volatility regime:** VIX **14.92** (08-31) vs 14.43 at the 08-29 row — +0.49, well inside the 3-point bar, still a 2026-low regime; the cheapness of vol is the one thing that would make an options-shaped guard cheap, and there is no edge to buy with it. **Geopolitical:** the 08-29 row's de-escalation read **reversed** — the U.S. and Iran traded fire on 08-31 for the first time in a month, WTI back above $85, which is what drove the yield/rate-fear leg above. No transmission channel specific to META beyond the long-duration-multiple channel every mega-cap shares. **New dated adjacency proposed:** **Meta Connect 2026-09-23/24** (keynote 09-23, Menlo Park + livestream; meta.com/connect fetched today) — the only company-controlled news venue between now and the print, and this calendar had no entry for it. Filed **`estimate`** per this lane's no-self-confirm limit, exactly as `crwv-fully-connected-2026-09-29` was. It sits 35 days before the print, outside the ±5-day corridor, so it does not enter this event's adjacency set. | — (no change to the call — stand aside, S2/E1 only. Two amendments recorded in the Stance: the Q3 headline EPS is pre-broken by a ~$10B disclosed charge that the ~$6.75 street number does not obviously carry, and the "round-tripped back toward highs" level framing is retired as an error.) | 2026-09-04 (critical, 21–60d band: every 3d) |
| 2026-09-04 | D-54 | Adjacency sweep. **This is the first pulse this ledger has had that the deterministic screen flagged on price: `event-material-scan` returns `material` / `price-move:META:+6.8%`.** META $572.34 (08-31) → **$611.31** (probe today); the 09-03 close was **$613.88**, so **+7.3% close-to-close in two sessions**. **Cause, sourced:** Meta opened paid developer access to **Muse Spark 1.3** on 09-03 — Zuckerberg calling it the company's biggest improvement yet in coding and agentic work, AI chief Alexandr Wang framing it as groundwork for personal AI assistants, and a **75.4 on DeepSWE v1.1**, above OpenAI's GPT-5.6 Sol and Anthropic's Claude Fable 5.1 on that benchmark (Motley Fool 09-03: +3.7% intraday to $608.69). It followed **+3.42% to $598.34 on 09-02** on tech momentum, inside a broad rally (Nasdaq +1.5%, S&P +1.1% on 09-03) that Waller's dovish remarks lit. **What it changes for this doc: nothing about the call, and the reason is worth stating plainly.** A two-session melt-up on a model release is precisely the class of move this stance already refuses to trade — a narrative repricing with no measured edge attached, the same status as "the legal overhang cleared" and punish-capex-then-forgive. If it moves the risk at all it moves it the wrong way: ~7% of fresh AI-optimism air now sits under a print whose headline EPS is pre-broken. **Level honesty:** $613.88 is still ~**22% below** the $790.00 record close (2025-08-12) and ~**18% above** the $520.26 52-week low; the 09-01 correction stands and a 7% pop does not revive "back toward highs." **The 09-01 row's dated watch item came due today, and the answer is no.** Street Q3 EPS reads **$6.75** (TipRanks, checked today) — flat for a **fourth** consecutive pass and now **9 days** after Meta disclosed the ~$10B Q3 accrual, i.e. the consensus number visibly does not carry the ~$3.90/share the charge implies. Registered as a falsifiable test rather than left as an inference: **FT-meta-2026-10-28-print-1**, zero capital, scored **2026-10-27**. **Honest limit recorded in the Stance:** the aggregators do not publish the *basis* of $6.75, so "not yet marked" and "quoted ex-charge by convention" are indistinguishable from the printed number alone — the instruction is the same either way. **Settlement, now primary-sourced:** the 09-01 row's unreconciled press range ($16.68B–$18B) narrows on the AGs' own releases — NY "up to **$17.1B**", California and Virginia "**$17B**" (VA: $353M state share), over 10 years — with CNN's $18B the outlier; **approved 08-26 by Judge Yvonne Gonzalez Rogers (N.D. Cal.)** hours after filing, with an independent compliance auditor plus default teen time limits, overnight blocks and age assurance to be implemented "within months." **No dated deadline is published, so there is nothing to propose to the calendar from it.** The ~$10B accrual figure is unchanged everywhere. **Peers:** **AVGO printed 09-02** — revenue **$29.59B (+86% y/y)**, net income $13.09B / **$2.68** EPS (vs $0.85), AI semi revenue beating its own $16B target by **4.4%**, Anthropic and OpenAI named as expanding customers — and the stock **barely moved** after hours: the beat was only ~0.3% on revenue / ~2.5% on EPS, the current-quarter revenue guide disappointed, and AVGO is +~6% YTD against the S&P's +12%. Read-through here is a mild caution, not a signal: the AI-capex complex is being paid for *delivery against a raised bar*, not for enthusiasm, which is the opposite of what META's Muse Spark pop was paid for. No mega-cap peer print since 08-24; MSFT est. 10-27, GOOG est. 10-28, AMZN/AAPL est. 10-29 — cluster intact, all **estimate**. **Macro — the sharpest whipsaw since this ledger opened, netting to roughly flat.** September hike odds: **66% (08-31)** → Waller's 09-03 Reuters NEXT outlook pushed back on a September hike and moved FedWatch ~13pp **in minutes (~67% → 54.6%)**, then to ~**50%** → today's **August jobs report** reversed it: **+162k payrolls vs +53k consensus** (strongest since March), unemployment steady **4.1%**, June+July revised **+55k** combined (July's reported loss now a +21k gain), AHE **+0.3% m/m / +3.1% y/y** — odds back to **~59%**. Both legs are tracked events with their own ledgers (`fed-waller-outlook-2026-09-03`, `jobs-2026-09-04`); the read-through to META is the shared long-duration-multiple channel only, and the print's own ±10% tail is untouched by it. **Volatility regime:** VIX **14.10** (probe today) vs 14.92 at the 09-01 row — **−0.82, well inside the 3-point bar**; a market-data source puts the 09-03 close at 14.32 (−5.8% on the day), unreconciled at the decimal, same regime call. Still 2026-low vol. The thing worth naming: index vol **fell** while META added 7% and Brent added ~10% — the tape is not pricing the geopolitical leg at all. **Geopolitical — the 09-01 row's re-escalation deepened materially.** US–Iran strikes continued; Iran retaliated against US regional allies **Jordan and Bahrain**, and Kuwait's armed forces reported engaging Iranian missiles and drones. **Brent settled $95.63 and WTI $91.01 on 09-03** (from Brent <$87 on 08-29 and WTI "back above $85" on 08-31 — roughly **+10% Brent over the pass**); Hormuz transit reportedly down to ~**6 mb/d**; US diesel at its highest since mid-2022. No META-specific transmission channel beyond the inflation/long-duration one every mega-cap shares — but this is now the largest un-hedged macro tail sitting between here and the print, and a 14-handle VIX is not paying for it. **Event tape:** date convergence on **2026-10-28 AMC** holds (TipRanks now labels it "Confirmed", Investing.com/Nasdaq agree, MarketChameleon and Wall Street Horizon still say unconfirmed/forecast-from-cadence); **no Meta IR primary posted**, and an aggregator's "confirmed" flag is not an `IR:` source, so status stays **estimate**. Implied move still not quotable at D-54 from a primary source. **New dated adjacency: none.** Meta Connect **09-23**, proposed on the 09-01 pass, is now on the calendar as `meta-connect-2026-09-23` (`estimate`); at 35 days before the print it stays outside the ±5-day corridor, so this event's adjacency set is **unchanged at 11 ids**. | — (no change to the call — stand aside, S2/E1 only. The +7% AI-narrative move is logged as risk, not signal. One new registration: **FT-meta-2026-10-28-print-1**, the claim that the street's ~$6.75 Q3 EPS never absorbs the ~$3.90/share charge before the print, with a matching kill switch added to the Stance.) | 2026-09-07 (critical, 21–60d band: every 3d) |

**Rules.** Rows append only — editing a past row is falsification. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed to `market-events.ts` as an `estimate` in
the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first),
never from memory — after which this doc goes quiet.
