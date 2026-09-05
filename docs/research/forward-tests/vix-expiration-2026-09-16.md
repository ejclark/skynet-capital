# Forward tests — vix-expiration-2026-09-16

<!-- One event's pre-registered hypotheses, written ONLY by the lane that owns
     docs/research/events/vix-expiration-2026-09-16.md — never by a sibling lane, which is what lets every
     research PR merge without touching a shared file (issue #1449). The register at
     ../forward-tests.md is composed from these files; never add a row there. Ids are
     FT-vix-expiration-2026-09-16-<n>, <n> counting up within this file. Rows append only; the Outcome
     column is the one cell the close-out fills. -->

| # | Hypothesis | Prediction | Kill switch | Score by | Outcome |
|---|---|---|---|---|---|
| FT-vix-expiration-2026-09-16-1 | **The September VIX settlement is struck before the FOMC vol decline, not in it** — registered **2026-09-04 at D-12** of the now-`confirmed` [vix-expiration-2026-09-16](../events/vix-expiration-2026-09-16.md). VIX futures/options AM-settle to a Special Opening Quotation (VRO) computed from opening-auction trade prices of the single SPX/SPXW series expiring exactly 30 days later (2026-10-16); expiring futures stop trading 09:00 ET. The 09-16 FOMC decision lands 14:00 ET, ~4.5 hours after the auction, and the FOMC-volatility literature reports VIX declining on decision days largely independent of content. A **mechanic** test of where that decline falls relative to settlement — never a directional claim on vol, which that ledger stands aside from either way | The **2026-09-16** VRO prints **above** that same session's VIX cash close. Anchors on the record: VIX cash **14.32** (09-03 close) and **14.07** intraday 09-04 (repo probe re-read 14.01); VIX9D **11.38**; VVIX **82.43**; Cboe daily settlements 09-03 VX/U6 **16.1381**, VX/V6 **18.1013**; SPX **7,747.71** (09-03 close) | VRO prints **at or below** the 09-16 VIX cash close → the "settlement is struck pre-crush" placement is wrong as stated, and the ledger's leg 8 (FOMC-day vol exposure cannot live in the expiring September line) loses its supporting observation and reverts to contract mechanics alone. **Void** (not killed) if the 09-16 FOMC decision moves off its 14:00 ET slot, if Cboe reschedules the VX/U6 settlement, or if 09-16 is not a full regular session — the test then measured a calendar change, not the mechanic. Scoring a pass is **one observation**, not a promotion | 2026-09-16 | _open_ |
