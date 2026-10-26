# Forward tests — bxdc-lockup-expiry-2026-11-09

<!-- One event's pre-registered hypotheses, written ONLY by the lane that owns
     docs/research/events/bxdc-lockup-expiry-2026-11-09.md — never by a sibling lane, which is what lets
     every research PR merge without touching a shared file (issue #1449). The register at
     ../forward-tests.md is composed from these files; never add a row there. Ids are
     FT-bxdc-lockup-expiry-2026-11-09-<n>, <n> counting up within this file. Rows append only; the
     Outcome column is the one cell the close-out fills. -->

| # | Hypothesis | Prediction | Kill switch | Score by | Outcome |
|---|---|---|---|---|---|
| FT-bxdc-lockup-expiry-2026-11-09-1 | **BXDC's lockup expiry is a muted supply event** — registered **2026-10-20 at D-20** of the `confirmed` [bxdc-lockup-expiry-2026-11-09](../events/bxdc-lockup-expiry-2026-11-09.md). Only ≈10.9M of ~100.6M shares (~11%) unlock, held by the sponsor (9.1M) and Blackstone-affiliated directed-share buyers (1.8M), both at a $20.00 cost vs $16.42 on 2026-10-20 (about 18% under water). Claim under test: with a small, sponsor-held, under-water block, the unlock produces no pullback beyond noise | BXDC's close-to-close return from the **2026-11-09 close to the 2026-11-13 close** (four sessions: 11-10, 11-11, 11-12, 11-13), **minus VNQ's return over the same window**, is **above −5.0%**. Scored from daily closes re-pulled after 2026-11-13, never from memory. The −5.0% bar is ~1.2× BXDC's own 4-session noise (34% 20-day realized vol → ~4.3%), so a miss is a move beyond ordinary noise. Anchors at registration: BXDC $16.42 (intraday 10-20), last full close $15.90, IPO $20.00, 20-day avg volume 2.45M, 60-day 1.75M, VIX 17.72, VNQ 92.28 | **Killed** by a relative return of **−5.0% or worse** (the unlock, or something on 11-10 the unlock cannot be separated from, moved the name beyond noise). **Void** if BXDC is acquired, suspended or the lockup is released early by underwriter consent before 2026-11-09. **A pass is one observation, n=1** — never a base rate and never a licence to trade: the stance is stand-aside, zero capital, and CPI (confirmed), the CRWV print and the US–China truce expiry (both estimate) share the 2026-11-10 session, so attribution to the unlock is impossible by construction | 2026-11-14 | _open_ |
