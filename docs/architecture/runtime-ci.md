# CI and agent lanes

**Technology:** GitHub Actions (ubuntu-latest), actions/setup-node from mise.toml, superfly/flyctl-actions, semantic-release (.releaserc.json), anthropics/claude-code-action (pinned v1), scripts/moneypenny/*.mjs, scripts/ship.sh, scripts/smoke.sh + smoke-bots.sh

**Responsibility:** pipeline.yml: verify (typecheck/lint/test/commitlint) → integration tests (Playwright e2e over the offline dashboard) → arm-auto-merge (envelope + hold checks); on push to main: semantic-release → flyctl deploy skynet-capital → smoke.sh → rollback on failure → deploy-bots reusing the same image when scripts/bot-relevant.mjs says so, stamping GIT_SHA. claude.yml: human-directed Claude sessions from issue/PR comments. moneypenny-events.yml: event-driven orchestration on every push/label (receipts, feedback builds, plan builds, event research, dep-warden). moneypenny-repair.yml: CI self-healing on failed workflow_run. autonomy-ops.yml / fly-logs.yml / companion-eval.yml: owner-triggered flyctl operations (secrets, mode flip, logs, eval).

**Code roots:** `.github/workflows` · `.github/actions` · `scripts/moneypenny` · `scripts/ship.sh` · `scripts/smoke.sh` · `scripts/smoke-bots.sh` · `scripts/bot-relevant.mjs` · `scripts/bots-deploy-preflight.mjs` · `scripts/deploy-lag.mjs`

**Entrypoints:** `.github/workflows/pipeline.yml` · `.github/workflows/claude.yml` · `.github/workflows/moneypenny-events.yml` · `.github/workflows/moneypenny-repair.yml` · `.github/workflows/autonomy-ops.yml` · `.github/workflows/fly-logs.yml` · `.github/workflows/companion-eval.yml`

**Grounding:** pipeline.yml jobs verify/e2e/arm-auto-merge/deploy/deploy-bots with `npx semantic-release`, `flyctl deploy --remote-only`, `bash scripts/smoke.sh https://skynet-capital.fly.dev`, `flyctl deploy --config /tmp/fly.bots.deploy.toml --image …`; docs/ROUTINES.md says the only clock is the claude.ai Secretary digest Routine (trig_01KaMC2uR3cFW5XTUL6rzPuS) — no cron in any workflow.

**Refuter's verdict:** grounded — Change the node source to 'actions/setup-node@v7 (node-version-file: .nvmrc; mise.toml is local-dev only)'. Mark verify/e2e/arm-auto-merge as pull_request lanes (e2e also runs on push to main), with arm-auto-merge gated 

## Where it sits

| From | To | What | How | Refuter |
|---|---|---|---|---|
| eric | ci | Runs autonomy-ops, fly-logs, companion-eval buttons | GitHub workflow_dispatch | grounded — Optional clarification: autonomy-ops acts on the Fly app picked by target_app (default skynet-capital-bots) and needs the autonomy-ops environment reviewer to approve before it runs. It never sets bot Alpaca credentials. |
| ci | fly | Builds one image, deploys skynet-capital on every push to main, deploys skynet-capital-bots only when bot-relevant, sets secrets, pulls logs | flyctl deploy --remote-only / --image, flyctl secrets, flyctl logs | grounded — Relabel the edge as: "pipeline.yml (push to main): flyctl deploy --remote-only builds on the Fly remote builder and deploys skynet-capital, with smoke test and rollback. deploy-bots reuses that image for skynet-capital-b |
| ci | github | Triggered by PRs, pushes, issue/comment events and workflow_run; opens PRs, issues, receipts, comments, releases | GitHub Actions, App token (.github/actions/app-token), REST | grounded — Optional additions to the edge label: add "workflow_dispatch (manual)" and "PR review comments" to the triggers. It could also note that autonomy-ops, fly-logs and companion-eval are manual-dispatch only, and that moneyp |
| ci | anthropic | Runs Claude Code sessions for the human-directed lane, Moneypenny builds and CI repair | anthropics/claude-code-action | grounded — Optional refinement: label the edge "Claude Code sessions via claude-code-action (CLAUDE_CODE_OAUTH_TOKEN): human-directed lane (claude.yml), Moneypenny build-events/build-feedback/build-plan + dep-warden, CI repair (mon |
| ci | tests | Runs verify on every PR and e2e in the integration-tests job | npm run verify, npm run test:e2e | grounded — Relabel the edge: "verify (commitlint + typecheck/lint/unit tests; heavy steps skipped for docs-only) on every non-draft PR; `integration tests` job (id e2e: builds app/ and runs Playwright against a local offline-fixtur |
