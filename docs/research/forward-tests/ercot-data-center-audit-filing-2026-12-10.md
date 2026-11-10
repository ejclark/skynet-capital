# Forward tests — ercot-data-center-audit-filing-2026-12-10

<!-- One event's pre-registered hypotheses, written ONLY by the lane that owns
     docs/research/events/ercot-data-center-audit-filing-2026-12-10.md — never by a sibling lane, which is
     what lets every research PR merge without touching a shared file (issue #1449). The register at
     ../forward-tests.md is composed from these files; never add a row there. Ids are
     FT-ercot-data-center-audit-filing-2026-12-10-<n>, <n> counting up within this file. Rows append only;
     the Outcome column is the one cell the close-out fills. -->

| # | Hypothesis | Prediction | Kill switch | Score by | Outcome |
| --- | --- | --- | --- | --- | --- |
| FT-ercot-data-center-audit-filing-2026-12-10-1 | **ERCOT meets its own 12-10 goal.** Registered 2026-11-10 (estimate-grade event; zero capital, no position). Basis: ERCOT's 2026-11-05 PUC open-meeting decks (ercot.com) state the Eligibility Verification Report is filed with the PUCT "on December 10, 2026" and the Community Impact final report is targeted for "December 10, 2026"; first-round RFIs came back on time, second-round RFIs go to ~80% of developers with the cure window still open. The [09-02 row](../events/ercot-data-center-audit-filing-2026-12-10.md) leaned slip on a 0-for-2 base rate; the 08-31 miss resolved in 3 days (09-03). My call: ~60% | **Both** the Batch Zero Eligibility Verification Report **and** the Community Impact Review Report are published on ercot.com or filed at the PUCT **dated on or before 2026-12-10** (checked on ercot.com and, if reachable, PUCT interchange, by 2026-12-11) | Either report dated **after 2026-12-10**, or ERCOT/PUCT announces a new date before then → kill (the goal slips a third time). If only one of the two lands on time, that is a kill and the row says which. **Void** if the audit is folded into the Batch Zero study or a rulemaking before 12-10 (no separate filing exists) | 2026-12-11 | _open_ |
