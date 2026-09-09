# Forward tests — canada-counter-tariffs-effective-2026-09-08

Registered by [`events/canada-counter-tariffs-effective-2026-09-08.md`](../events/canada-counter-tariffs-effective-2026-09-08.md).
Recipe and rules: [`forward-tests.md`](../forward-tests.md).

**Standing note on scoring.** That ledger was written as a same-session initial research **and**
close-out (the event reached the calendar the day after it happened), so it goes quiet once its
`## Outcome` exists and no lane is assigned to return here. The row below therefore carries a fully
mechanical scoring procedure — five closing prices on one named date — so any reader of the register
can score it without re-deriving anything. It is a standing pre-registration, not an assignment
handed to a lane that never agreed to it.

| # | Hypothesis | Prediction | Kill switch | Score by | Outcome |
|---|---|---|---|---|---|
| FT-canada-counter-tariffs-effective-2026-09-08-1 | In a tariff exchange the **protected domestic producer is a winner**, so US steel equities are not damaged by Canada's 50% surtax on US steel — their US book is shielded by the Section 232/338 wall and only their small export leg is taxed. Registered 2026-09-09 against the measured escalation window CLF **+9.05%** / NUE **+5.24%** / STLD **+5.09%** vs SPX **−0.01%** (2026-08-21 → 2026-09-08). | The equal-weight average total return of **CLF, NUE, STLD** from the **2026-09-08** close to the **2026-11-10** close is **not more than 5 percentage points below** `^GSPC`'s over the same window. Scoring procedure, fully mechanical: pull daily closes for `CLF`, `NUE`, `STLD`, `^GSPC` from the Yahoo v8 chart endpoint `scripts/event-material-scan.mjs` uses; baselines are CLF **12.29**, NUE **256.40**, STLD **240.31**, `^GSPC` **7673.52**. | The basket underperforms SPX by **more than 5 pp** over that window — the protection-beats-retaliation sign is wrong for these names, and the ledger's "do not short US steel as a tariff loser" call was bad advice. Also killed, in the other direction, if the US Section 338 duty is voided or withdrawn before 2026-11-10, which removes the protection leg and makes the window untestable rather than merely adverse. | 2026-11-11 | — (open) |
