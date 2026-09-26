# Test suites

**Technology:** Rstest 0.12 (rstest.config.ts, tests/**/*.spec.ts, node env) and app/rstest.config.ts with happy-dom + Testing Library; Playwright 1.62 e2e (playwright.config.ts boots `npm run build --prefix app && npm run serve:dashboard:offline` on :8787), playwright.auth.config.ts for /login, Playwright component tests (app/playwright-ct.config.ts → e2e/ct); fast-check

**Responsibility:** The consumer that proves the runtime: unit/BDD specs import src modules directly (ports & adapters make every network seam fakeable), architecture gates under tests/arch run the scripts/*-scan.mjs coaches (arch, dupe, dead, spec-gap, envelope, volume-persistence, fly-split, workflows), and the e2e suite drives the real server in offline mode on fixtures/offline (participants.json + events.jsonl) so CI never needs Alpaca keys.

**Code roots:** `tests` · `app/tests` · `e2e` · `fixtures/offline` · `rstest.config.ts` · `playwright.config.ts` · `playwright.auth.config.ts` · `app/playwright-ct.config.ts`

**Entrypoints:** `package.json: verify → run-p typecheck lint test typecheck:app test:app` · `package.json: test:e2e, test:e2e:auth, test:e2e:ct`

**Grounding:** rstest.config.ts include tests/**/*.spec.ts; playwright.config.ts webServer command; e2e/playwright.shared.ts; tests/arch/volume-persistence.spec.ts reads src/runtime/volume-guard.ts against fly.toml; src/runtime/data-source.ts is the live/offline seam (ADR docs/adr/0002-offline-data-source-mode.md).

**Refuter's verdict:** grounded — Change the label to say that tests/arch gates either invoke scripts/*-scan.mjs coaches (arch-scan via god-file.spec, dead, dupe, spec-gap, envelope, clone, doc-rot, and others) or assert invariants inline. volume-persist

## Where it sits

| From | To | What | How | Refuter |
|---|---|---|---|---|
| ci | tests | Runs verify on every PR and e2e in the integration-tests job | npm run verify, npm run test:e2e | grounded — Relabel the edge: "verify (commitlint + typecheck/lint/unit tests; heavy steps skipped for docs-only) on every non-draft PR; `integration tests` job (id e2e: builds app/ and runs Playwright against a local offline-fixtur |
| tests | api | e2e boots the offline dashboard; unit specs import server, observatory, autonomous and companion modules with fake transports | child process on :8787, ESM import | grounded — Split the element into two edges. (a) e2e/ (Playwright, playwright.config.ts webServer) → dashboard server started with `serve:dashboard:offline`, which sets SKYNET_DATA_SOURCE=offline. That makes src/runtime/data-source |
| tests | bots | Specs the cycle runner, trader, guards, safety, bridge clients and offline runner | ESM import, in-memory broker | **not grounded** — Relabel as: tests -> bots: "Specs the live cycle runner, AutonomousTrader, safety/equity-watch/breakers, and the bridge clients (insight, decision-replication, bot-controls, credentials, subscriptions); tests/engine spec |
