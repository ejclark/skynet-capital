# Backlog

**The backlog lives in GitHub issues, not here** (#433 — *"plans belong in github issues, not source
code"*). This file is a pointer; it is kept rather than deleted because several docs and source
headers cite it by path.

Where its contents went:

| what this file used to hold | where it lives now |
|---|---|
| the gamify spec — trophies, measurements, derived state | **built**: [`src/observatory/history-metrics.ts`](../src/observatory/history-metrics.ts) — `firstAccountToDouble`, `aggregateDoubling`, `seedBaseline`, `doubledAt`, `changeOver` |
| the seed baseline recorded at onboarding | **built**: `ParticipantService.recordSeedSample` ([`src/server/participant-service.ts`](../src/server/participant-service.ts)) |
| the "room to grow" trophies — first to +50%, biggest single-day gain, longest green streak | **open**: issue [#503](https://github.com/ejclark/skynet-capital/issues/503) |
| anything new | file an issue — `/issue` shapes the capsule ([`ISSUES.md`](ISSUES.md)) |

The spec this file carried is not lost: it is the header commentary on the functions that implement
it, which is where intent stops being able to drift from the code (`CLAUDE.md` — *co-locate intent*).
