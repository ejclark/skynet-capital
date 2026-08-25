# AVGO earnings print — avgo-2026-09-02-print

**Kind:** earnings · **Date:** 2026-09-02 (estimate, NEWS: Broadcom PR 2026-08-03 — Wed Sep 2 AMC; IR fetch blocked 2026-08-17) · **Impact:** critical
**Last assessed:** 2026-08-24

## At a glance

**TL;DR.** No position into AVGO's print. S1 is dead on this symbol, so there is no positioning bid
to take, and the late-week window is FT-2's **zero-size** observation — contaminated this cycle
anyway, because NVDA's 2026-08-26 print sits at its open. Get flat by the **2026-09-02 close** and
let it pass. The thing that makes this print unusual is not the beat: the XPV financing overhang plus
the VMware exploit raise the odds it trades on **disclosure quality** instead of the number — which
widens caution and licenses nothing. The calendar carries an estimate; Sep 2 is primary-sourced and a
correction is proposed, and the *earlier* of the two governs the flat deadline.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — no pre-print position | High | S1 is dead on AVGO; the only late-week interest is FT-2 at zero size, and NVDA's 08-26 print contaminates it this cycle | FT-2 clearing its base rate under the 2-of-3 rule, sympathy-decontaminated |
| This week | **Flat by the 2026-09-02 close (S2)** | High | The earlier of the estimated and primary-sourced dates governs the deadline; an estimate never licenses an entry, only an earlier exit | ≥3 new prints showing a repriced gap regime |
| This month | **Nothing pre-committed post-print** | High | The D+1 fade is absent on AVGO and the gap-hold is kill-listed — there is no researched post-print play to pre-commit to | A registered post-print study clearing controls on this symbol |
| This quarter | **Treat XPV as live event risk, not a thesis** | Medium | Residual-value guarantees plus the VMware exploit make disclosure quality the swing factor; that is risk, not an edge | Broadcom quantifying or capping the guarantees in a filing, or AVGO round-tripping the 8/14 drop above ~$417 |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — hold unhedged AVGO through the print for the gap; the family is kill-listed.
- **Flat deadline** — the **2026-09-02** close, governed by the earlier of the estimated and primary-sourced dates.
- **FT-2 only, zero size** — and treat this cycle's observation as contaminated by NVDA's **2026-08-26** print at the open.
- **Watch (dated)** — the honest print window **2026-08-27** to **2026-09-10** until IR confirms · NVDA print **2026-08-26** · any XPV disclosure in a filing or PR.
- **Redo the cadence math immediately if** — Broadcom's IR moves or contradicts the Sep 2 date.

## Initial research

**The question.** What is likely to happen at Broadcom's Q3 FY2026 print and how will the market
react — and does any house playbook license action on it?

**One-line verdict.** Guard rails only: no playbook earns a position on AVGO — S1 doesn't travel
here, the gap-hold is on the kill list, the fade is absent — while Friday's −5.9% XPV-financing
scare hands the print a live bear narrative that a revenue beat doesn't answer; S2 applies with
feeling (last print gapped −14.66%), and the only open thread is the zero-size FT-2 observation.

**Date, tightened at the primary source.** The calendar carries **2026-09-03 (estimate)**.
Broadcom's own newsroom announces Q3 FY2026 results for **Wednesday, September 2, 2026, after
market close** (call 2:00 p.m. PT / 5:00 p.m. ET) — [Broadcom financial release
64621](https://www.broadcom.com/company/news/financial-releases/64621), cross-checked against the
[PRNewswire/Yahoo carry](https://finance.yahoo.com/markets/stocks/articles/broadcom-inc-announce-third-quarter-120000388.html)
and [StockTitan](https://www.stocktitan.net/news/AVGO/broadcom-inc-to-announce-third-quarter-fiscal-year-2026-financial-dkaqc3d1n73a.html)
(checked 2026-08-17). The old estimate was one day late; Sep 2 sits inside the honest
Aug 27–Sep 10 cadence window. The correction ships in the same PR as this doc — date moved to
Sep 2, status held at **estimate** because Broadcom's IR site itself was fetch-blocked (503) at
verification time, and only a directly-read primary earns the confirmed flip. Every date-keyed
statement below stays labeled **estimate**, and the safe direction (per the date policy) treats
**Sep 2** as the operative print night.

**Method.** Both instruments re-run fresh 2026-08-17 (cache busted earlier today; price history
through 2026-08-14): `earnings-cycle.mjs AVGO --bench QQQ --peers NVDA,MRVL,AMD` (33 prints,
2018-06-07 → 2026-06-03) + `intraday-edges.mjs AVGO` (721 sessions, hourly + 5-min). Read against
the house playbooks exactly as [`multi-symbol-sweep.md`](../multi-symbol-sweep.md) (2026-08-12)
characterizes them for AVGO — the sweep already red-teamed these; this is the event-shaped
synthesis plus what changed since. Sourced web research for date, consensus, and tape.
**Instrument sanity check:** the sweep's pipeline-integrity findings (MRVL/CRWV event-list
corruption, forward-window guard) do not contaminate this run — AVGO's 33-print list is a
complete quarterly cadence 2018-06 → 2026-06 with the newest print (2026-06-03) now fully inside
the history window, and the peer control uses peer *price* over AVGO's windows, not the corrupted
peer event lists.

**Conviction legs, tested.**

1. **"The pre-print run-up is an AVGO edge" (S1 travels) — REFUTED.** Sweep verdict
   (2026-08-12): shape-inverted-but-insignificant on AVGO. Fresh run agrees: modern-era D-20
   run-up looks seductive (n=14, +7.25%, win 79%) but the base-rate control kills it —
   P(11/14 positive | the era's own 67% base) = 0.26, NOT SIGNIFICANT — and the peer control
   shows NVDA (+10.35%), MRVL (+12.18%) and AMD (+7.33%) running over AVGO's *own* windows:
   sector seasonality wearing an AVGO costume. Never stack pre-print longs (sweep,
   portfolio critique #2).
2. **"The AVGO gap pays" (hold the print) — REFUTED, kill list #5.** Win rate indistinguishable
   from an ordinary overnight (p=0.567), mean one-print-carried, latest print gapped −14.66%.
   Fresh gap table is consistent: modern win 57%, p10 −6.5%, and the −14.66% minimum sits below
   the p10. Not re-proposable without ≥3 new prints showing a repriced gap regime.
3. **"Semi late-week bid" (long close D-5 → close D) — MIXED, already registered as FT-2.**
   Shelved at p=0.161; fresh run shows the shape again (modern D-5→D +4.21%, win 71%, vs +0.73%
   baseline; the interior split puts the whole run-up in the last five days: D-10→D-5 is −0.34%).
   New wrinkle: with the print at Sep 2 (estimate label; primary-source-dated), the D-5 close is
   **Aug 26 — NVDA's confirmed print night** — so NVDA's reaction gap opens *inside* FT-2's
   window. Scoring must account for sympathy contamination, exactly the confound that gutted the
   MRVL version (~70% of window return). Zero size, observation only; scored per
   [`forward-tests.md`](../forward-tests.md) FT-2, never duplicated here.
4. **"Fade the reaction-day open" (S3) — REFUTED on AVGO.** The sweep found S3 absent on the
   semis; fresh run agrees: earnings-reaction session −0.67% / win 50% vs an ordinary session's
   +0.03% / 49% — no event-locked signal, and shorting is blocked regardless.
5. **"A clean beat-and-rally print" — MIXED.** Consensus (aggregators, estimate-quality):
   revenue ~$29.4–29.9B, non-GAAP EPS ~$3.24–3.30 (vs $1.69 a year ago), AI semi revenue guided
   ~$16B (>200% y/y, over half of revenue) —
   [moomoo preview](https://www.moomoo.com/ca/articles/broadcom-stock-earnings),
   [tickerleague](https://tickerleague.com/companies/AVGO/estimates). But the tape just changed:
   **Friday 2026-08-14 AVGO fell −5.94% to $392.99** on a BofA note flagging **XPV**, Broadcom's
   off-balance-sheet AI-financing vehicle (built with Apollo/Blackstone), with a path to ~$370B
   of senior vehicle debt by 2029 and residual-value-guarantee contingent liabilities
   ([Benzinga](https://www.benzinga.com/markets/prediction-markets/26/08/61219624/broadcom-ai-financing-370-billion),
   [24/7 Wall St.](https://247wallst.com/investing/2026/08/14/broadcom-sinks-6-as-bofa-flags-370b-in-ai-debt-amd-climbs-4-on-bairds-1250-call/),
   [tradingkey](https://www.tradingkey.com/analysis/stocks/us-stocks/262108959-broadcom-avgo-ai-xpv-residual-value-guarantee-risk-400-tradingkey)).
   Separately, VMware vCenter CVE-2026-59310 is being actively exploited across ~47 countries
   within days of disclosure ([Rapid7](https://www.rapid7.com/blog/post/etr-critical-vmware-vcenter-vulnerabilities-allow-authentication-bypass-and-remote-code-execution-cve-2026-59309-cve-2026-59310/),
   [SecurityWeek](https://www.securityweek.com/critical-vmware-vcenter-vulnerability-in-attackers-crosshairs/)).
   Two live bear narratives — financing structure and VMware security — that a revenue beat does
   not answer; the last print's −14.66% gap already proved beats don't protect the night here.
   The print likely trades on financing/guarantee disclosure and guide quality, not the
   consensus-relative beat.

**Implied move.** Not yet cleanly priced for this print (options ~2.5 weeks out; the circulating
"~6.7% / $11.98" figure implies a ~$179 price basis — a stale prior-quarter article, not this
event). The 8-quarter median realized move is ~5.6%
([moomoo](https://www.moomoo.com/ca/articles/broadcom-stock-earnings)); re-check once
print-spanning weeklies list (~Aug 28).

**What the conditions support.** Guard rails, nothing else: **S2** (estimate label: flat through
the print night — operative flat-by is the **2026-09-02 close**, the earlier and safer of the
two dates until the table confirms) and **E1** (first hour carries 30.1% of AVGO's volatility at
−0.086% mean drift, win 48%; every intraday strategy tested nets negative at 5bps/side, best
break-even 3.3bps). S4 shows its usual market-wide overnight shape (Sharpe 1.34 vs 1.31
buy-and-hold, b/e 14.2bps) — close-side execution preference only, per the sweep. FT-2 is
observed at zero size. No pre-print entry, no gap-hold, no fade.

**Honest limits.** The domain table's date is still an estimate; the Sep 2 confirmation is
reported here and proposed, not yet in the table. Consensus and implied-move figures are
aggregator-sourced, not primary. Modern-era cells are n=14 in one 2023–26 bull regime; SEC
filing dates stand in for announcement times. The XPV story is three days old and analyst-driven
— its half-life into the print is unknown.

## Stance & kill switches

**Stance (date: estimate in the table; Sep 2 primary-sourced, correction proposed).** No
position into this print. S1 is dead on AVGO, so there is no positioning bid to take; the
late-week window is FT-2's zero-size observation, contaminated this cycle by NVDA's Aug 26
print sitting at its open. S2 with feeling: any paper exposure flat by the **2026-09-02 close**
(estimates only widen caution — the earlier of the estimated/primary-sourced dates governs the
flat deadline, and an estimated date never licenses an entry). Post-print: nothing pre-committed;
the D+1 fade is absent here and the gap-hold is kill-listed. The XPV financing overhang plus the
VMware exploit raise the odds this print trades on disclosure quality rather than the beat —
which *widens* caution and licenses nothing.

**Kill switches.**

- *"No pre-print position"* dies only via FT-2's pre-stated promotion path (clears its base rate
  with the 2-of-3 rule across coming prints, sympathy-decontaminated) — never from this single
  print, and never while the [`multi-symbol-sweep.md`](../multi-symbol-sweep.md) kill list
  stands.
- *"Flat through the print night (S2)"* dies only at the kill-list bar: ≥3 new prints showing a
  repriced gap regime. Nothing short of that re-opens the question.
- *"XPV overhang is live event-risk"* dies if Broadcom quantifies/caps the residual-value
  guarantees in a filing or PR, or if AVGO round-trips the 8/14 drop (> $417 area) before the
  print — either fades the narrative and the print reverts to an ordinary critical print.
- *"Sep 2 is the operative print night"* dies if Broadcom's IR moves or contradicts the date —
  redo the cadence math immediately; the honest window Aug 27–Sep 10 governs until the table
  confirms.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-08-17 | D-17 | Initial research banked (above). Both instruments run clean on today's fresh cache (history through 8/14); AVGO's 33-print event list passes the cadence sanity check — the sweep's forward-window blindness no longer applies to AVGO. **Date:** Broadcom newsroom PR sets the Q3 FY26 print at **Wed 9/2 AMC** (call 2pm PT) — the calendar's 9/3 estimate is one day late; correction proposed same-PR (primary IR source, confirmed-grade). Adjacency: no peer prints since 8/15 (weekend); NVDA 8/26 + MRVL 8/27 confirmations already proposed via today's NVDA scan ([`nvda-2026-08-26-print.md`](nvda-2026-08-26-print.md)). Macro: none since 8/15; **Jackson Hole 8/27–29 with new Fed chair Warsh's first keynote Fri 8/28** lands inside AVGO's D-5→D window (proposed); Aug jobs Fri 9/4 (est) = D+2; CPI 9/11 post-print. VIX ~14.56 at Friday's close (2026 low) but SKEW +6.6% m/m and Brent +6%/wk — calm index, rising tail-hedge demand (per the same-day NVDA row). Geopolitical: standing Jan-2026 Section 232 25% semi-tariff / H200-license regime; nothing new AVGO-specific. Event tape (date estimate in table, Sep 2 primary-sourced): **AVGO −5.94% Fri 8/14 to $392.99** on BofA's ~$370B XPV off-balance-sheet AI-financing note (Apollo/Blackstone vehicle, residual-value guarantees) + actively exploited VMware vCenter CVE-2026-59310 — two bear narratives a beat doesn't answer. Consensus ~$29.4–29.9B rev / ~$3.24–3.30 EPS / ~$16B AI semi rev; per-print implied move not yet cleanly priced (stale-quarter figures circulating; 8-print median realized ~5.6%). FT-2 note: with a Sep 2 print, the D-5 close is Aug 26 — NVDA's print night opens inside FT-2's window; score with the sympathy caveat. | — (stance set) | 2026-08-19 (critical, 8–20d band: every 2d) |
| 2026-08-19 | D-14 | Cache busted; both instruments re-run clean on fresh cache (history through 8/18). No new AVGO print since last quarter, so cells are essentially unchanged from 8/17 (rounding-level drift only: E1 first-hour vol share 30.0% vs 30.1%, mean −0.090% vs −0.086%, win 47% vs 48% — verdict holds). **IR blocker resolved:** `investor.broadcom.com` now 301-redirects cleanly to `www.broadcom.com` (no longer 503-blocked), and the primary source cited in the initial doc is directly fetchable and confirms "Wednesday, September 2, 2026" — a **PROPOSED confirmed-grade flip** (IR: prefix) for `earnings-calendar.ts`'s AVGO row, not actioned here; table stays **estimate**. Adjacency — peers: NVDA −2.19% 8/18 on AMD competitive-pressure narrative (Advancing AI event); MRVL −8.32% 8/18 on macro/yield-driven sector pullback, not company news — both peers softening into their 8/26 and 8/27 prints, raising odds the sympathy-gap signal into AVGO's Sep-2 print trades weak rather than strong this cycle (widens caution only). Macro: no CPI/FOMC/jobs surprises since 8/17. VIX closed 15.84 on 8/19 (+4.28% day), up from the 8/17 row's ~14.56 2026-low. Geopolitical: no new export-control/tariff news touching AVGO since 8/17. Event tape: AVGO extended its XPV-driven slide, −3.33% on 8/18 on top of Friday's −5.94%, landing well below the $417 round-trip kill-switch bar — the XPV overhang reads as deepening, not fading; VMware vCenter CVE coverage continues, no new development. Consensus unchanged; no whisper number found; implied move still not cleanly priced. | unchanged | 2026-08-21 (critical, 8–20d band: every 2d) |
| 2026-08-24 | D-9 | Both instruments re-run clean, cache busted (history through 8/21): modern-era run-up still NOT SIGNIFICANT (11/14, p=0.254, unchanged read); D-5→D leg +4.21%/71%; reaction-day fade −0.67%/50% — no edge, consistent with the 8/17 row. Adjacency — peers: MRVL's Google/Alphabet warrant deal (8/19, own doc) is now drawing explicit press comparison to AVGO's financing model ("Broadcom Guarantee Grows With Every AI Rack Sold: BofA Warning Meets Marvell-Google Deal," techtimes 8/20) — a competitive narrative framing AVGO's balance-sheet-heavy XPV structure against MRVL's lighter-touch deal, worth watching into both prints. NVDA's implied move fell to ~5.3% (own doc). Macro: no CPI/jobs/FOMC surprise since 8/19; Sep-16 read unchanged (hawkish-hold, per FOMC sibling). Volatility regime: VIX 15.13, calm, no shift. Geopolitical: Brent -1.38% to $93.09 on 8/24, first pause in the two-week escalation — same finding as sibling docs. Event tape: **XPV overhang deepened, not faded** — AVGO fell a further -4.61% on 8/19 (BofA's $370B modeled ceiling), and SiliconANGLE (8/20) reported Broadcom is separately seeking up to $100B in fresh debt financing for an AI chip deal, extending rather than resolving the financing-risk narrative; AVGO now $368.90 (8/24), well below the $417 round-trip kill-switch bar and below even the D-17 row's already-depressed $392.99. No new VMware CVE development found. Consensus unchanged; still no clean implied-move figure. | unchanged (XPV overhang still live, kill switch further from firing not closer) | 2026-08-26 (critical, 8-20d band: every 2d) |

**Rules.** Rows append only — editing a past row is falsification. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed to `market-events.ts` as an `estimate` in
the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first),
never from memory — after which this doc goes quiet.
