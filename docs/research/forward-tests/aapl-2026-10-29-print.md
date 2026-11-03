# Forward tests — aapl-2026-10-29-print

<!-- One event's pre-registered hypotheses, written ONLY by the lane that owns
     docs/research/events/aapl-2026-10-29-print.md — never by a sibling lane, which is
     what lets every research PR merge without touching a shared file (issue #1449). The register at
     ../forward-tests.md is composed from these files; never add a row there. Ids are
     FT-aapl-2026-10-29-print-<n>, <n> counting up within this file. Rows append only;
     the Outcome column is the one cell the close-out fills. -->

| # | Hypothesis | Prediction | Kill switch | Score by | Outcome |
| --- | --- | --- | --- | --- | --- |
| FT-aapl-2026-10-29-print-1 | **AAPL post-print drift on the print that actually happened** — re-anchors legacy [FT-5](legacy.md) (long close D+1 → close D+11, vs QQQ) from the estimated 2026-10-29 print to the 2026-11-02 after-close print (SEC 8-K Item 2.02, accession 0000320193-26-000024). Registered 2026-11-03 pre-market, before the D+1 session traded; zero capital. Anchors on the record: AAPL close 2026-11-02 $338.32, extended-hours $328.81 (−2.81%, indicative); QQQ $681.09; VIX 21.15; the study's POST row close D+1 → close D+6 is mean +1.27% / win 64% all-era but +1.47% / win 47% over 2023-26 (n=15) | AAPL's **close 2026-11-03 → close 2026-11-17** return **exceeds QQQ's over the same dates** (positive vs-QQQ excess). FT-5 and this row are one observation, counted once | Excess **≤ 0** → this print adds a miss to FT-5's tally (FT-5's own kill stays ≥~6 prints at vs-QQQ ≤ 0 or win ~50%). **Void, not scored,** if either close is missing from the instrument history on 2026-11-18 | 2026-11-18 | _open_ |
