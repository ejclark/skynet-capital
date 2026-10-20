# Forward tests — spcx-lockup-expiry-2026-12-08

<!-- One event's pre-registered hypotheses, written ONLY by the lane that owns
     docs/research/events/spcx-lockup-expiry-2026-12-08.md — never by a sibling lane, which is
     what lets every research PR merge without touching a shared file (issue #1449). The register at
     ../forward-tests.md is composed from these files; never add a row there. Ids are
     FT-spcx-lockup-expiry-2026-12-08-<n>, <n> counting up within this file. Rows append only;
     the Outcome column is the one cell the close-out fills. -->

| # | Hypothesis | Prediction | Kill switch | Score by | Outcome |
|---|---|---|---|---|---|
| FT-spcx-lockup-expiry-2026-12-08-1 | The Dec 8 stage (up to 797.6M shares, confirmed date, [ledger](../events/spcx-lockup-expiry-2026-12-08.md)) does not produce an abnormal pullback: the first sale session is Dec 8 or Dec 9 (filing wording gap), so read both. | SPCX's summed close-to-close return over Dec 8 and Dec 9 minus SPY's over the same two sessions is above −6% (about 1.3σ of a two-day move at 52% realized vol). SPY, not QQQ: SPCX joined the Nasdaq-100 on 2026-07-07. Scored from re-run Yahoo daily bars. | Excess return ≤ −6% over Dec 8–9 | 2026-12-16 | _open_ |
| FT-spcx-lockup-expiry-2026-12-08-2 | A smaller stage trades smaller: Dec 8 (797.6M) moves SPCX by less than the ~Oct 22 stage (~1.3B, estimate) did. | \|SPCX excess return vs SPY summed over Dec 8–9\| is smaller than \|the same over Oct 22–23\|. If the Oct 22 release is dated differently once Q3 results are out, use its first two sale sessions per the filing. Scored from re-run Yahoo daily bars. | Dec 8–9 absolute excess return ≥ Oct 22–23's | 2026-12-16 | _open_ |
