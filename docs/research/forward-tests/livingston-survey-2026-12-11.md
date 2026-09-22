# Forward tests — livingston-survey-2026-12-11

<!-- One event's pre-registered hypotheses, written ONLY by the lane that owns
     docs/research/events/livingston-survey-2026-12-11.md — never by a sibling lane, which is what
     lets every research PR merge without touching a shared file (issue #1449). The register at
     ../forward-tests.md is composed from these files; never add a row there. Ids are
     FT-livingston-survey-2026-12-11-<n>, <n> counting up within this file. Rows append only; the
     Outcome column is the one cell the close-out fills. -->

| # | Hypothesis | Prediction | Kill switch | Score by | Outcome |
|---|---|---|---|---|---|
| FT-livingston-survey-2026-12-11-1 | The Philadelphia Fed's calendar row is the real date, despite the scheduling rule that produces it having missed its last three editions (registered 2026-09-09, [ledger](../events/livingston-survey-2026-12-11.md) leg 2: `FOMC-decision + 2 days` matched 15/16 editions Jun-17 → Dec-24, then 0/3 — Jun-25 06-24, Dec-25 12-19, Jun-26 06-24 — while the modal December slot 2017-2025 is the 3rd Friday, 8 of 9, which in 2026 is 12-18) | The December 2026 Livingston Survey is published on **2026-12-11 at 10:00 a.m. ET**, and the bank's own `livingston-release-dates.xlsx` subsequently carries `2026-12 → 2026-12-11` | The survey publishing on any other date — specifically **2026-12-18 or later**, which would confirm the 2025-2026 regime as the new practice and void the collision framing this event was proposed on | 2026-12-14 | — |
| FT-livingston-survey-2026-12-11-2 | The panel is a drift constant, so its December 2026 S&P 500 forecast lands inside the band every December edition has landed in since 2004 (registered 2026-09-09, ledger leg 4: n=84, MAE 13.90% vs 14.13% for random-walk-plus-drift; 62-for-62 up at 12M/1Y/2Y; Dec `12M` implied growth ranged +2.86%/yr in Dec-2012 to +12.37%/yr in Dec-2009) | The December 2026 median `SPIF_12M` in `medians.xlsx` is **above** its own `SPIF_BP` (the 2026-10-31 S&P 500 close) **and** implies annualized growth from that base inside **+2.5% to +13.0%/yr** | `SPIF_12M ≤ SPIF_BP` — the first down-year call in 21 December editions — **or** implied annualized growth outside the +2.5% to +13.0% band, either of which means the drift-constant characterisation no longer holds and leg 4 must be re-derived | 2026-12-31 | — |
