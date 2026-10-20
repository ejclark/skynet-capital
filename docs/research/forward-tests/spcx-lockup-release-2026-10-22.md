# Forward tests — spcx-lockup-release-2026-10-22

<!-- One event's pre-registered hypotheses, written ONLY by the lane that owns
     docs/research/events/spcx-lockup-release-2026-10-22.md — never by a sibling lane, which is
     what lets every research PR merge without touching a shared file (issue #1449). The register at
     ../forward-tests.md is composed from these files; never add a row there. Ids are
     FT-spcx-lockup-release-2026-10-22-<n>, <n> counting up within this file. Rows append only;
     the Outcome column is the one cell the close-out fills. -->

| # | Hypothesis | Prediction | Kill switch | Score by | Outcome |
|---|---|---|---|---|---|
| FT-spcx-lockup-release-2026-10-22-1 | The ~1.3B-share stage (estimate date, [ledger](../events/spcx-lockup-release-2026-10-22.md)) does not trade as a supply pullback once the Q3 print's reaction is behind it. Anchored at the Oct 21 close so the print reaction is excluded; if the results slip, anchor at the close of the first full session after them and read the next two sessions. | SPCX's close-to-close return from the Oct 21 close to the Oct 23 close minus SPY's over the same sessions is above −8% (about 1.7σ of a two-day move at 52% realized vol). SPY, not QQQ: SPCX joined the Nasdaq-100 on 2026-07-07. Scored from re-run Yahoo daily bars. | Excess return ≤ −8% from Oct 21 close to Oct 23 close | 2026-10-26 | _open_ |
| FT-spcx-lockup-release-2026-10-22-2 | Attention fades between stages: the first sale session of the larger, later stage draws less share volume than the Aug 6 stage did, because the cohort's take-up has run 22–28% of eligible and the 20-day ADV (81.7M) is below August's. | SPCX share volume on Oct 22 (or the second full session after the Q3 release if it slips) is below the 255.2M traded on Aug 6. Scored from re-run Yahoo daily bars. | Volume on the stage day ≥ 255.2M | 2026-10-26 | _open_ |
