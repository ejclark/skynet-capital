# NVDA earnings cycle — what 87 prints actually say

**Question (Eric's, 2026-08-11):** _"Historically NVDA rises ahead of earnings then falls post
earnings."_ True or folklore? And if true, what trades fall out of it?

**Verdict: true — but only since 2023, and the useful part is not the part that sounds useful.**
The run-up is real and NVDA-specific. The pullback is real. But the run-up is *front-loaded* — it
is over roughly a week before the print — and the sharpest, most repeatable edge in the whole
dataset is not the run-up at all. It is that **the post-print pop fades within the same session.**

Reproduce: `node scripts/research/earnings-cycle.mjs NVDA --peers AMD,AVGO,MRVL`

---

## Method, and the one thing that nearly broke it

- **87 prints, 2004-11-04 → 2026-05-20.** Earnings dates come from **SEC 8-K filings carrying
  Item 2.02** (Results of Operations) via EDGAR — authoritative, exact, free.
- **Prices:** daily bars back to 1999, split- and dividend-adjusted so returns are comparable
  across NVDA's four splits.
- **D = the release day.** NVDA reports *after* the close, so the market's verdict is **D+1**.
  Every window below is anchored on that.

**The near-miss worth recording.** The first version derived earnings days from price action —
the largest overnight gap inside each reporting window. Intuitive, and wrong in the worst
possible way: the biggest gap in a window is often a *macro shock*, not a print. It picked the
August-2024 yen-carry unwind over the real Aug-28 report, the COVID crash over the Feb-2020
report, and missed four of the last fourteen. Every error was biased in the same direction —
substituting crash days for print days — which would have **manufactured the exact "post-earnings
drop" the study set out to test.** A confirming result from a self-confirming instrument.

The lesson generalizes past this study: when a detector's failure mode is correlated with the
hypothesis, a positive result carries no information. Go to the authoritative source.

## The four ways this analysis lies, and the control for each

| Trap | Why it would fool us | Control |
|---|---|---|
| **Drift** | NVDA compounded ~50%/yr; *any* 20-day window looks great | every edge reported as excess over the era's own base rate |
| **Beta** | 2023-26 was a bull market | every edge also reported net of QQQ, same calendar window |
| **Regime** | a 22-year mean blends a $10B company with a $4T one | everything split by era |
| **Small n** | 4 prints/year ⇒ one era is n≈14 | n printed everywhere; binomial test vs the era's base rate |

---

## Findings (modern era, 2023-2026, n=14)

### F1 — The pre-print run-up is real, and it is NVDA's alone

| | mean | win rate |
|---|---|---|
| every 20-day window, 2023-26 (n=883) | +6.57% | 67% |
| **the 20 days into a print (n=14)** | **+9.08%** | **100%** |
| same windows, net of QQQ | +6.28% | 100% |

Fourteen for fourteen. Against the era's own 67% base rate, **P = 0.0041**.

**It is not a sector seasonal.** Over NVDA's *own* pre-print windows, peers barely beat a coin
flip — AMD 50%, AVGO 50%, MRVL 64% (n=14 each). Whatever this is, it is positioning into
*NVDA's* print specifically, not semis drifting up together.

### F2 — The run-up is front-loaded. The last week is dead money.

| leg | mean | win rate |
|---|---|---|
| D-20 → D-10 | **+6.30%** | 93% |
| D-10 → D-5 | +3.61% | 79% |
| **D-5 → D** | **-0.77%** | **50%** |

This is the finding that changes the trade. The bid builds four weeks out and is **exhausted
about a week before the print** — by D-5 the positioning is done and you are holding a coin flip
into a binary event. Exiting at D-5 historically beat holding to D.

### F3 — The pop fades inside the reaction session

The print itself is, on average, *good news*: the overnight gap averages **+5.35%** (64% up).
Then the session gives it back.

| | mean | win rate |
|---|---|---|
| any ordinary 2023-26 session, open→close | +0.10% | 54% |
| **reaction day, open D+1 → close D+1** | **-2.48%** | **21%** |

Eleven of fourteen red, some violently (-11.0% after the Feb-2025 print, -7.8% after Nov-2025).
**P = 0.015.** The gap is the entire move; buying the pop at the open has been the single most
reliably losing thing you could do around an NVDA print in this era.

### F4 — The bleed continues for about a week, then stops

| window | mean | vs QQQ | win rate | era base rate |
|---|---|---|---|---|
| close D+1 → D+6 (5 sessions) | -2.18% | -2.09% | 36% | +1.72% / 60% |
| close D+1 → D+11 | +1.36% | +0.17% | 43% | — |
| close D+1 → D+21 | +2.07% | -0.44% | 57% | — |

Eric's "falls post earnings" is a **one-week** phenomenon. By three weeks out NVDA is back to
roughly market-neutral — there is no month-long slump to short.

### F5 — This is a 2023+ regime, not a law of nature

The same tables for earlier eras say something different: 2013-2019 post-print drift was
*positive* (+1.29%, 61% win), and so was 2020-2022 (+2.26%, 75% win). The modern pattern —
buy the anticipation, sell the news — coincides with NVDA becoming the most crowded
single-name trade in the market. **It will end when the crowding does**, and n=14 will not tell
us on which print that happened.

---

## Honest limits — read before sizing anything

1. **Multiple testing.** Roughly 15 windows were examined. At a Bonferroni-corrected threshold
   (~0.003), **F1 at P=0.0041 does not clear the bar** and F3 at 0.015 does not either. Both
   clear an uncorrected 5%. Treat these as *strong priors worth trading small*, not as
   established facts. The corrected view: F1+F2+F3 tell one coherent mechanical story
   (positioning in, positioning out), which is worth more than any single P-value — but a
   coherent story is also exactly what overfitting produces.
2. **n=14, and it only grows 4×/year.** The next genuine out-of-sample test is the next print.
3. **Regime dependence** (F5) is the real risk, and it is unhedgeable by more history.
4. **The August 2026 print date is an estimate, not a fact.** NVDA reported Aug 23 (2023),
   Aug 28 (2024), Aug 27 (2025) — last Wednesday/Thursday of August, after the close, so
   **~2026-08-26**. This was *not* confirmed against NVDA IR; EDGAR only shows the filing after
   it happens. **Confirm the date before any position is sized off it.**
5. **F3 needs a short.** Our order path is equities, market orders, `day` only — no options, no
   brackets. Fading the open means an actual short position, with the borrow and unlimited-loss
   profile that implies, on a name that has gapped +26% in a single session (May 2023).

---

## Where we stand right now (as of the 2026-08-10 close, $217.55)

Assuming a **~2026-08-26** print, today (Aug 11) is roughly **D-12**.

| marker | date | NVDA |
|---|---|---|
| D-20 — the historical entry | ~2026-07-30 | $195.04 |
| today — ~D-12 | 2026-08-10 close | $217.55 |
| **run-up already delivered** | | **+11.5%** |
| D-5 — the historical exit | ~2026-08-19 | — |

**So the read that we "missed the run-up" is half right, and the half that's wrong matters more.**
The run-up was not missed — it *happened*, and then some: **+11.5% in eight sessions against a
+9.08% mean for the entire twenty-day window.** What was missed is the entry, and by this study's
own logic what remains (D-12 → D-5) is the weaker tail of the move, with the dead zone right
behind it.

The actionable item this week is therefore **not an entry. It is an exit date (~Aug 19) and a
decision about the print itself** — which, on the numbers, is the one thing you are paid to sit
out.

---

## Strategies this supports, ranked by (edge × implementability)

| # | Strategy | Mechanics | Edge | Buildable today? |
|---|---|---|---|---|
| **S1** | **Positioning bid** | long at D-20, flat at D-5 | ~+10% mean, 93%/79% legs | **Yes** — plain long equity |
| **S2** | **Never hold the print** | a *rule*, not a trade: force flat by D-1 | removes a -6.4% p10 coin flip | **Yes** — a guard, not an order |
| **S3** | **Fade the reaction open** | short at open D+1, cover at close D+1 | +2.48% mean, 11/14 | Needs shorting; single-session |
| **S4** | **Post-print bleed** | short close D+1 → close D+6 | +2.18% mean, 9/14 | Needs shorting; weakest |

**S1 + S2 together are one playbook and the only one worth building first**: they need nothing
the order path doesn't already have, they are long-only, and S2 is a safeguard that makes S1
honest. S3 is the statistically sharpest single finding but is a short on the most violently
gapping large-cap in the market — it belongs behind a size cap and Eric's explicit sign-off, not
in the first cut.

**What the data does *not* support:** buying the pop, holding through the print for the gap, or
shorting the three weeks after (F4 — the bleed is one week and then it's over).
