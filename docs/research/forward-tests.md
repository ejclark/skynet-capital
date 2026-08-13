# Forward-test register — predictions logged before outcomes

Pre-registration ledger: every shelved hypothesis gets its prediction, kill switch, and score-by
date written **here, before** the outcome exists — so the next sweep tests hypotheses instead of
retrofitting them. Zero capital by design; these exist to generate the out-of-sample n every red
team demanded. Source: [`multi-symbol-sweep.md`](multi-symbol-sweep.md) deployment rank #4.

| # | Hypothesis | Prediction (registered 2026-08-12) | Kill switch | Score by | Outcome |
|---|---|---|---|---|---|
| FT-1 | **MRVL late-week bid** (long close D-5 → close D) | The D-5→D window into the est. 2026-08-27 print clears its 5-day base rate (win + positive excess) | Fails to clear base rate in 2 of the next 3 prints → kill; also killed if the window's gain coincides with an NVDA print gap inside it (sympathy, not MRVL) | ~2026-08-28 | _open_ |
| FT-2 | **AVGO late-week bid** (same shape) | Same test on the est. ~2026-09-03 print (window honest range Aug 27–Sep 10; IR confirmation required first) | Same 2-of-3 rule; entry never taken on an unconfirmed date | ~2026-09-11 | _open_ |
| FT-3 | **CRWV post-print behavior** (the 2026-08-11 midday print — first out-of-sample point for gap/fade/bleed) | Prior-print template (ugly D+1, monotone bleed) does NOT repeat — the red team called the "always down" read a windowing artifact, and the first hours ran green (+2.42%) | n/a — pure observation | D+6 ≈ 2026-08-19, D+11 ≈ 2026-08-26 | _open — early tape (+2.4% first hours, reported spiking on 08-12) already against the bleed template, consistent with the red-team read_ |
| FT-4 | **META post-print stand-aside** (D+21 of the 07-29 print) | The stand-aside window shows nothing distinguishable from noise (modern-era evidence was win 43%, p=0.19) | n/a — observation | ~2026-08-27 | _open_ |
| FT-5 | **AAPL post-print drift** (long close D+1 → close D+11) | Registered for the est. 2026-10-29 print (current window ~7 sessions elapsed — chasing forbidden); predicts positive vs-QQQ excess | vs-QQQ ≤ 0 or win ~50% over ~6 prints → kill | D+11 of the Oct print | _open — the 07-30 window (closes ~08-14) is logged as context, not a scored test, since registration happened mid-window_ |

**Rules.** An outcome is scored from the cached instrument data (re-run the study script after the
score-by date), never from memory of the tape. A scored `kill` moves the hypothesis to the sweep
doc's kill list. A scored `pass` is one observation, not a promotion — promotion needs the
pre-stated count (2–3 prints). New registrations append here with their date; editing a
registered prediction after the fact is falsification and never happens.
