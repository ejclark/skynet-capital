# NVDA Aug-2026 print — conviction test + playbook fit

**Question (Eric's, 2026-08-15):** _"NVDA quarterly earnings in under two weeks. I expect positive
surprise exceeding expectations on data center revenue and several other areas; estimates are lofty
but chronically underestimated; AI infra capex spend expectations still expanding. Research data
points that support or invalidate my convictions. Identify the best plays to execute if my
convictions hold. I have $25k dry powder."_

**Verdict in one line: the conviction is right on the fundamentals and wrong about what pays.**
Two of the three legs are supported by hard data; the third (chronic underestimation) is true on
the numbers and refuted as a trading thesis — NVDA has beaten revenue consensus nine straight
quarters and the stock closed **down after six of the last eight prints anyway**. The best plays
under "conviction holds" therefore sell the crash, not buy the pop.

**Method:** fresh `symbol-sweep` run (earnings-cycle + intraday instruments, NVDA vs
AMD/AVGO/TSM/MRVL, independently red-teamed) + external evidence sweep (consensus, whispers,
hyperscaler guidance, options pricing) on 2026-08-15. Predecessors:
[`nvda-earnings-cycle.md`](nvda-earnings-cycle.md), [`multi-symbol-sweep.md`](multi-symbol-sweep.md).

---

## The print

- **Date: Wed 2026-08-26, after close** — confirmed by two calendar sources; the 8-K cadence range
  alone is honest to Aug 19–26, so **re-verify against NVDA IR before any date-keyed action**
  (house date policy: estimates only *widen* the S2 flat window).
- Stock ~$225 (Aug 14 close). Quarter ended Jul 26 (fiscal Q2 FY2027).

| Bar | Number | Source |
|---|---|---|
| NVDA's own guide | $91.0B ± 2% | Q1 FY27 release (May 20) |
| Street consensus | $91.8B rev · ~$2.01–2.07 EPS · 75.0% NG margin | Hudson Labs / Barchart, Aug 2026 |
| **The whisper (the real bar)** | **$94–95B** (BofA; "sell-the-news risk as Wall Street targets $94–95B") | Mitrade/BeInCrypto, Aug 13 |
| Guide bar for Q3 | Street will want ~$100B+ with Rubin ramping | preview commentary |
| Upside scenario | SemiAnalysis: H2 DC revenue tracking **~20% above consensus** (HBM4 unblocked, Rubin to 8 clouds this fall) | Investing.com, Jun 30 |

## Conviction legs, tested

### Leg (a) — positive surprise, especially data center → **SUPPORTED**

- Last print (May 20): revenue $81.6B vs $78.9B est; **DC $75.2B vs $73.5B est** (+92% YoY);
  Huang: cloud GPUs "sold out."
- Supply unlocked, not binding: TSMC CoWoS scaling to ~130–150K wafers/mo by late 2026 (~4x
  late-2024), NVDA holding ~60% of it; HBM4 bottleneck cleared; Rubin R100 full production since
  June 1, shipping in the fall.
- Demand is contracted, not hypothetical: OpenAI–NVIDIA 10GW alliance (first capacity H2 2026),
  Stargate ~7GW/$400B+, OpenAI's $300B Oracle commitment, CoreWeave ~$22.4B.
- **Caveat:** a beat is table stakes — guide-vs-print beats have run $2–5B for four straight
  quarters. A $93B print "beats consensus" and still lands under the whisper.

### Leg (b) — "lofty but chronically underestimated" → **half right, and the wrong half is the expensive half**

Nine straight revenue beats — and the market stopped paying for them:

| Print | Beat? | Next-day stock |
|---|---|---|
| May 2024 | ✓ rev + DC | **+9%** |
| Aug 2024 | ✓ | −6% |
| Nov 2024 | ✓ | −2.5% |
| Feb 2025 | ✓ | −8.5% |
| May 2025 | ✓ | **+6%** |
| Aug 2025 | ✓ rev, DC hair-miss | slightly down |
| Nov 2025 | ✓ | −3% after initial pop |
| Feb 2026 | ✓ + guided Q1 **$5B above** consensus | **−5.5%** (−$260B) |
| May 2026 | ✓ rev + DC | −0.9 to −1.5% |

Feb 2026 is the controlled experiment: traders publicly expected beat-and-raise (CNBC whisper
piece), NVDA delivered exactly that, and it fell 5.5%. The debate has moved from "will they beat"
to AI-capex sustainability and monetization. Valuation is the *weakest* bear point (fwd P/E ~24 vs
a 5–10yr avg of ~55–62) — the repricing is sentiment about the cycle, not multiple compression risk.

### Leg (c) — AI capex expectations still expanding → **SUPPORTED, with a second-order flip**

- Top-5 hyperscaler 2026 capex estimates: ~$600B (Nov 2025) → ~$620B (Jan) → **~$750B**
  (CreditSights, mid-2026) — revised up ~25% in nine months.
- Alphabet raised its 2026 top-end to $205B (Jul); Meta to $125–145B; Amazon ~$200B;
  Microsoft tracking ~$190B. Plus non-hyperscaler GW-scale commitments (OpenAI, Oracle, CoreWeave).
- **The flip:** raises are now *punished* — Alphabet fell 7% on its raise, dragging the group;
  capex increasingly debt-financed as spend outruns cash flow. Intact for NVDA's **revenue**;
  no longer an automatic **multiple** tailwind.

### Counter-evidence worth holding

1. **Custom ASIC share shift:** ASIC AI-server shipments projected ~28% of the 2026 market,
   growing 45% YoY vs 16% for AI chips overall; Broadcom's XPV platform (Jun 2026) targets NVDA's
   frontier-lab customers directly.
2. **China ≈ zero both ways:** H20 dead, H200 approved but shipments "trivial" per Commerce
   testimony (Jul 14); Blackwell/Rubin barred. Nothing in guidance to lose, no upside either.
3. **Rubin Ultra 4-chip config downsized** (SemiAnalysis, Jun 30) — long-term impact unclear.

## What the options market says (the load-bearing fact)

- Implied move for the print: **~7%** (weekly straddle ~6.5%) — *below* its own ~8% 10-print avg.
- Realized post-print move, last 4 quarters: **~2.8% avg**; May 2026 realized ~1–1.5% against ~8%
  implied. Actual exceeded implied on only **~25% of the last 16 prints**.
- 95th-percentile tail is still ±20% — the seller's edge is a distribution, not a guarantee.

**Read: being right on the beat has not paid the straddle for five quarters. The persistent
mispricing is implied-vs-realized, not consensus-vs-actual.**

## What the fresh sweep + red team added (2026-08-15 run, data through 08-14)

- **The gap-hold is now formally killed.** "Hold shares through the print because the beat is
  coming" died on its own data: win rate 9/14 vs the 60% ordinary-overnight base (p=0.486 —
  indistinguishable from any random overnight); the +5.35% mean gap is carried entirely by four
  2023-24 prints (ex-top-4: +1.72%); **3 of the last 5 prints gapped down**. Third member of the
  0-for-3 hold-the-print family (AVGO, META, now NVDA). Kill-list entry added.
- **S1 (pre-print run-up) survived weakened** — 14/14 wins is real but p=0.0042 fails the house
  ~0.001 family bar, the windows were fitted in-sample, and roughly half the +9.08% level is
  sector beta (peers ran +3.7–5.3% over the same windows). Regardless: **the D-20 entry window
  has passed** and the dead zone (D-5→D: −0.77%, 50% win) opens ~Aug 19.
- **Reaction-day fade weakened but alive as a watch:** 11/14 red (8 straight since Aug-2024),
  mean −2.48% but outlier-softened to −1.32%; p=0.0139 fails the family bar; carried by the
  MSFT/GOOG class replication, not its own stats. Blocked on shorting anyway.
- **S2 (never hold the print) regraded weak→fits on NVDA:** honest EV cost ~+1.7%/print in the
  current regime against a pooled −5.49% p10 tail. Cheap insurance. **Note the seam with the
  options plays below:** S2 was built for undefined-risk *equity* holdings; a defined-risk premium
  structure with known max loss is the honest, sized way to hold a print — an explicit opt-in
  override, which is exactly what S2's "opt-in override only" clause exists for.
- Two new zero-size forward tests registered (FT-6 S1-tight, FT-7 post-print dead week) —
  see [`forward-tests.md`](forward-tests.md).

---

## The playbook — if the conviction holds, ranked by fit × evidence

Conditional on Eric's scenario (big DC beat, capex intact): the evidence says the *most likely*
outcome is "beat lands, stock does ±3%." The ranked plays monetize that, keep a small hook out for
the whisper-breaker, and refuse the two trades history punishes. Options structures are outside
the app's current order path (equities/market/day) — these are recipes for wherever the $25k
actually lives; the app-side options roadmap is a separate build.

**P0 — the guards (unconditional, cost ~nothing).**
Confirm the print date against NVDA IR before anything is timed to it. No new share purchases for
the "run-up" (window passed; dead zone from ~Aug 19). Any unhedged share position flat by D-1 per
S2. No entries in the first hour ever (E1). And the single most reliably losing move of the era:
**do not buy the pop at the D+1 open** (11/14 red).

**P1 — sell the crash you don't believe in: bull put spread (~40–50% of deployed risk).**
Sell a put vertical below the implied-move floor (spot ~$225, 7% implied ⇒ floor ~$209: e.g. short
~$205 put / long ~$190 put, expiry just past the print). Wins in the muted-reaction scenario AND
the pop scenario; loses only on the guide-down/miss the conviction explicitly rules out — it is
the purest "my conviction holds" expression that does not need the market to pay for the beat.
Collects the 7%-implied vs ~2.8%-realized gap. Defined risk; max loss = width − credit, known at
entry. Size to ~$4–6k max loss of the $25k. Kill switch: exit if NVDA breaks the short strike
*before* the print (thesis is about the print, not a pre-print slide).

**P2 — the whisper-breaker hook: small OTM call spread (~5% of capital, lottery-ticket framing).**
If SemiAnalysis is right (H2 DC ~20% above consensus) and the Q3 guide prints ~$100B+, the
five-quarter muted streak breaks upward. A ~$240/$260 call spread past the print costs little and
pays multiples in that tail. History says this loses ~75% of the time — cap it at ~$1.0–1.5k and
never average up. This is the *only* long-premium expression the evidence tolerates.

**P3 — the post-print share entry (the patient half, ~$15–18k stays dry).**
If the goal is owning NVDA on conviction legs (a)+(c), the record says the *cheapest* entries of
the cycle come after the print, not before: reaction day is 11/14 red and the shelved dead-week
observation (D+1→D+6, all controls negative in the modern era) costs nothing to respect. Recipe:
no entry before D+1; prefer entries after ~D+6; execute after 10:00 ET per E1. This is also FT-7's
first live observation — the entry discipline and the forward test are the same act.

**P4 — explicitly not recommended, on the record.**
Naked long calls or an ATM straddle into the print (fighting a 7%-implied vs 2.8%-realized tape
that has paid sellers 12 of 16); holding unhedged shares through the print for the gap (killed
this cycle, p=0.486, 3 of last 5 gaps down); an iron condor (the short-call wing sells the exact
tail leg (b)'s whisper-breaker scenario keeps alive — P1 collects most of the same premium without
capping the thesis' own upside).

**Net allocation sketch on $25k, conviction-conditional:** ~$5k defined-risk short-put-spread
premium at risk (P1) + ~$1.25k convexity hook (P2) + ~$18.75k held for post-print share entries
(P3). Worst realistic case (guide-down print): P1 max loss + P2 premium ≈ −$6k (−24%), with the
dry powder then buying the dislocation. Muted-reaction case: P1 pays, P2 expires, P3 enters lower
or flat. Whisper-breaker case: P1 + P2 both pay.

## Honest limits

Modern-era earnings cells are n=14 and single-regime; S1/S3/dead-week all sign-flip in at least
one prior era; the sweep's own portfolio critique holds NVDA to the same ~0.001 family bar as the
peers (only the no-alpha guard rules clear cleanly). The implied/realized gap is itself a crowded
observation and can reprice in one print — the 95th-percentile ±20% tail is why every recipe above
is defined-risk. Print date needs IR confirmation. External figures are press/preview-sourced
(cited in-line by outlet and date); consensus and whisper numbers drift daily into the print.
Educational, paper-standard context — sizing is illustrative, and the deploy/no-deploy call on
real capital is Eric's alone (the irreversible class).
