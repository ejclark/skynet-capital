# Options volume at the Bollinger edge — the pre-registered back-test came back underpowered

**Kind:** candidate playbook back-test · **Date:** 2026-10-18 · **Symbols:** 500 liquid stocks · **Plan:** [#4808](https://github.com/ejclark/skynet-capital/issues/4808) slice 3, part 2

**Question:** when heavy option volume arrives on a day a stock closes at the edge of its 20-day range, does the next 5 sessions' return (net of QQQ) differ from what a band touch on ordinary volume gives?

Reproduce: `node scripts/research/occ-volume-pull.mjs && node scripts/research/optvol-bollinger-backtest.mjs 500`

## The call

| # | The call | Confidence | The one-line why | The dated observation that proves it wrong |
|---|---|---|---|---|
| 1 | **Stand aside: the candidate stays a candidate and never trades.** | high | Nothing passed: the best cell (upper band, continuation) read +1.75% with t 2.59 against a bar of 3.29, and on dates 5 sessions apart its t falls to 0.32. | A re-run on the larger universe in call 3 reads t ≥ 3.29 in a cell, and the same cell holds on non-overlapping dates. |
| 2 | **Do not put it on the kill list.** It is underpowered, not refuted. | high | 376 independent days against 1,298 needed at the observed spread. This test could only have seen an excess of about **2.8%** or more; the idea's own size, 1.5%, was out of reach. | None needed: the kill list stays closed until a powered run fails. |
| 3 | **Do not re-run the same design for more days.** The OCC serves 502 sessions in total, so 1,298 days cannot exist. Re-register with a wider universe or a larger effect first. | medium | The dates are noisy because a typical date has 2–3 signal events behind it: per-date spread is 13%, not the 4% assumed in step 2. About 10× the events per date would be needed. | By 2026-12-31 a re-registered design shows the needed days fit inside the history available (it is arithmetic, not a market claim). |
| 4 | **Archive OCC's files now (#4832).** Every day the window rolls is a day of this test lost for good. | high | The pull cached all 502 sessions locally for this one run only; nothing durable holds them. | #4832 ships with the 2-year backfill stored on the volume. |

## What ran

- **Data:** OCC whole-market daily option volume, every session from 2024-10-16 to 2026-10-16 (502 files; 2024-10-15 and earlier are already refused). Daily bars from Yahoo, earnings dates from SEC 8-K Item 2.02 filings.
- **Universe:** the 500 underlyings with the most option volume over the window that also have bars and SEC earnings dates (738 tried; the rest were ETFs, indices and symbols Yahoo spells differently).
- **Events:** a close at or beyond the 20-day, 2σ band. **Signal** = option volume ≥ 3× its own trailing 20-session mean (2,512 events). **Control** = under 1.5× (12,234 events). Between the two is left out. Touches within 5 sessions of an earnings report, either side, are dropped from both.
- **Outcome:** return over the next 5 sessions, minus QQQ's over the same dates. A date is one observation: signal mean minus control mean.

| Cell | Independent days | Needed at observed spread | Mean excess | t (bar 3.29) | t on dates 5 apart | Events behind a typical date |
|---|---|---|---|---|---|---|
| Upper band · continuation | 376 | 1,298 | +1.75% | 2.59 | 0.32 | 3 |
| Upper band · reversal | 376 | 1,298 | −1.75% | −2.59 | −1.96 | 3 |
| Lower band · continuation | 272 | 1,419 | −0.82% | −0.98 | −2.21 | 2 |
| Lower band · reversal | 272 | 1,419 | +0.82% | 0.98 | −0.63 | 2 |

The verdict rule, fixed before the run (`scripts/research/optvol-bollinger-math.mjs`): any cell passing means pass; otherwise any underpowered cell means underpowered; only when every cell was powered and none passed is it a kill. All four cells were underpowered.

## Caveats, said plainly

- **Overlap flatters t.** Five-session outcome windows on adjacent dates share days, so the main t is generous. The "dates 5 apart" column is the honest read, and it is weaker in every cell that looked positive.
- **The universe was ranked by volume over the whole window,** which includes the future. It mildly favours names that had surges. A pass would have needed this fixed; a non-pass is not helped by it.
- **Four cells at one bar** is a family of tests; none passed, so no correction was needed.
- **The earnings dates come from SEC filings,** so the filter is only as good as that feed (`docs/research/multi-symbol-sweep.md` records the earnings-date pipeline's known corruption on 2 of 8 event lists; this run used the SEC dates directly).
