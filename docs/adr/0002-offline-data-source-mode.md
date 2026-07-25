# ADR-0002: Offline data-source mode for keyless local runs

- **Status:** Accepted
- **Date:** 2026-07-25

## Context

The dashboard and autonomous loop talk to Alpaca (REST + websockets), which needs credentials and
a network. That makes local development, CI, and issue triage slow, flaky, and credential-bound.
We want CI to stay fast and offline, while still being able to run the *real* realtime setup
locally when needed.

## Decision

We will introduce a single live-vs-offline seam, `resolveDataSource(env)`, selected by
`SKYNET_DATA_SOURCE=live|offline`. Offline swaps only the transport and streams
(`FixtureTradingTransport` + `ReplayEventStream`) for committed fixtures under `fixtures/offline/`;
the hub, reducer, renderer, and SSE are unchanged, so the offline view is identical to live. A
`record:session` script captures a real session to JSONL for realistic replay.

## Alternatives considered

- **A global mock/env flag checked throughout the code** — scatters branching and drifts from the
  live path. Rejected in favor of one seam the two CLI entrypoints wire through.
- **Only fix CI (tests already use fakes)** — misses the real goal: running the *server* offline
  for triage. Rejected as insufficient.

## Consequences

- `serve:dashboard:offline` / `run:autonomous:offline` run with zero network and no keys.
- CI stays fast and offline; no test touches the network.
- Fixtures are another artifact to maintain, but they double as reproducible triage scenarios.
