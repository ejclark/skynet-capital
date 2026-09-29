# Frozen research shelf (integration-suite fixture)

A hand-picked copy of `docs/research/` that the integration suite's dashboard server reads instead
of the live folder (`SKYNET_RESEARCH_DIR`, set in `playwright.config.ts`). The research lane merges
into `docs/research/` many times a day; a R&D screenshot rendered from the live folder broke every
open PR within hours of each new baseline (2026-09-29: 16 PRs blocked by a 20px height drift).

The three `events/*-2026-09-1x` ledgers fall in the week the suite's frozen clock lands on, so the
call board and ledger list render populated. Refresh this copy only on purpose, then re-run
`npm run test:e2e:update -- e2e/research.spec.ts`.
