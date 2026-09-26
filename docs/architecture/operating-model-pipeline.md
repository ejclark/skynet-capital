# Pipeline (CI + CD)

**Technology:** GitHub Actions, actions/setup-node@v7 (Node 24 via .nvmrc), actions/cache@v6, rstest, Biome, Playwright 1.62 Chromium, commitlint, semantic-release 25, superfly/flyctl-actions (flyctl 0.4.99)

**Responsibility:** verify (PR title commitlint, typecheck, lint, test in parallel; docs-only PRs skip heavy steps), integration tests (Playwright on PR and on push main), arm-auto-merge (App token, live hold-merge re-read, envelope check), release · deploy (semantic-release, flyctl deploy, smoke.sh, rollback), release · deploy bots (bot-relevant preflight, image reuse, smoke-bots.sh, rollback)

**Code roots:** `.github/workflows/pipeline.yml` · `scripts/smoke.sh` · `scripts/smoke-bots.sh` · `scripts/bot-relevant.mjs` · `scripts/bots-deploy-preflight.mjs` · `scripts/fly-image-ref.mjs` · `.releaserc.json` · `playwright.config.ts` · `e2e/`

**Entrypoints:** `.github/workflows/pipeline.yml`

**Grounding:** pipeline.yml jobs verify, e2e (display name 'integration tests'), arm-auto-merge, deploy, deploy-bots; .releaserc.json plugins; docs/DEPLOY.md 'Continuous deployment'

**Refuter's verdict:** grounded — Optional precision: "verify runs typecheck, lint and test (root and app/) as parallel processes on one runner". Also note the pin is superfly/flyctl-actions/setup-flyctl@master with flyctl version 0.4.99. Otherwise the e

## Where it sits

| From | To | What | How | Refuter |
|---|---|---|---|---|
| github | pipeline | pull_request and push main events | Actions | grounded — Label the edge "pull_request→main (opened/synchronize/reopened/ready_for_review/edited), push main, workflow_dispatch (force_bots_deploy)". It could also say that verify skips draft PRs. |
| pipeline | gates | verify job runs the suite | npm test, npm run lint, npm run typecheck | grounded — Label the edge "verify (PR only, code changes only) runs typecheck + biome lint + rstest (root and app); the rstest suite includes the tests/arch gate specs, some of them advisory/non-blocking". Do not draw a separate ed |
| pipeline | envelope | Arms auto-merge only when the diff is unprotected | envelope-scan --check --base | grounded — Optional sharpening. Point the target at scripts/envelope-scan.mjs --check (the envelope.json rules), not a vague 'envelope'. Also note in the label that the live hold-merge label check and green verify/e2e gate arming t |
| pipeline | github | Arms auto-merge with the App token; semantic-release cuts tag and Release | gh pr merge --auto --squash, npx semantic-release | grounded — For clarity, write the label as: "arm-auto-merge (PR events): gh pr merge --auto --squash with the GitHub App token; deploy (push to main): semantic-release with GITHUB_TOKEN cuts the tag and GitHub Release". Consider sp |
| pipeline | dashboard | Deploys every push, smokes, rolls back | flyctl deploy --remote-only; scripts/smoke.sh | grounded — Relabel as: "Releases and deploys on every push to main (flyctl), smoke-tests https://skynet-capital.fly.dev, and rolls back to the previous image if the smoke test fails." Keep this separate from the pipeline → bots edg |
| pipeline | bots | Deploys only when bot-relevant, reusing the dashboard image; smokes; rolls back | flyctl deploy --config fly.bots.toml --image; scripts/smoke-bots.sh | grounded — Optional refinement: "Deploys (after deploy succeeds) when the preflight says so — bot-relevant diff vs the machine's stamped GIT_SHA, debounced, deploys when unsure — reusing the dashboard image; smoke-bots.sh; rolls ba |
