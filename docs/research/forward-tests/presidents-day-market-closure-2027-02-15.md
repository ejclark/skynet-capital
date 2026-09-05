# Forward tests — presidents-day-market-closure-2027-02-15

| # | Hypothesis | Prediction | Kill switch | Score by | Outcome |
|---|---|---|---|---|---|
| FT-presidents-day-market-closure-2027-02-15-1 | The three-day-weekend volatility rebound is a priced, repeatable feature, not a free decay window — implied vol is marked down into the pre-holiday Friday close and snaps back on reopen ([ledger leg 6b](../events/presidents-day-market-closure-2027-02-15.md)) | VIX closes **higher** on Tuesday **2027-02-16** than on Friday **2027-02-12**. Base rate from SPY/VIX daily bars 2010-01-01 → 2026-09-04: **71% (60/84)** of Monday-holiday weekends vs **56% (422/755)** of ordinary weekends; median ΔVIX **+0.575** vs **+0.150** | VIX closes at or below its 2027-02-12 close on 2027-02-16 — the live instance fails and the stance's short-vol-carry caution drops back to a historical base rate with no 2027 observation behind it | 2027-02-17 | — |

**Rules.** Score from re-run instrument data (`scripts/research/market-data.mjs` bars for `^VIX`,
cache busted first), never from memory of the tape. One observation is not a promotion. Editing a
registered prediction after the fact is falsification. Both dates above sit around an `estimate`
event; the test is an observation, never a licence to act.
