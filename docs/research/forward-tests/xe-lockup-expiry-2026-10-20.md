# Forward tests — xe-lockup-expiry-2026-10-20

<!-- One event's pre-registered hypotheses, written ONLY by the lane that owns
     docs/research/events/xe-lockup-expiry-2026-10-20.md — never by a sibling lane, which is
     what lets every research PR merge without touching a shared file (issue #1449). The register at
     ../forward-tests.md is composed from these files; never add a row there. Ids are
     FT-xe-lockup-expiry-2026-10-20-<n>, <n> counting up within this file. Rows append only;
     the Outcome column is the one cell the close-out fills. -->

| # | Hypothesis | Prediction | Kill switch | Score by | Outcome |
|---|---|---|---|---|---|
| FT-xe-lockup-expiry-2026-10-20-1 | **XE's slide since the 2026-09-01 early unlock is not finished relative to its nuclear peers** — registered **2026-10-20** against the [xe-lockup-expiry-2026-10-20](../events/xe-lockup-expiry-2026-10-20.md) stand-aside call. Measured this session from Yahoo daily bars: XE **-41.7%** since the unlock (2026-08-31 close) against OKLO -31.1% and SMR -38.8%; XE trailed both by 7-9 points in the first two weeks. Anchors on the 2026-10-19 close: XE **$10.54**, OKLO **$27.24**, SMR **$5.69**; QQQ 718.36; VIX 18.44. A coin-flip base rate, honestly: this is a call on an overhang, not a measured edge | **From the 2026-10-19 close to the 2026-11-13 close (the session after the estimated 2026-11-12 Q3 print), XE's return is below the average of OKLO's and SMR's returns.** Unconditional base rate ~50%, so a pass is one observation and never a promotion. Zero capital: the call is stand aside, and no position is licensed on any outcome | XE beating the OKLO/SMR average by **5 points or more** kills it, and the kill is informative: the post-unlock supply effect is spent. **Void** (not killed) if X-Energy moves the Q3 print past 2026-11-13 or either peer is acquired or delisted before then | 2026-11-13 | _open_ |
