# Ops buttons

**Technology:** GitHub Actions workflow_dispatch, flyctl 0.4.99, the autonomy-ops GitHub Environment (required reviewers)

**Responsibility:** Phone-operable, reviewer-gated operations: autonomy-ops (status, machine-status, logs, bootstrap-bots-app, flip-mode, set-playbooks, set-beta-forcing, set-hardcore), fly-logs (filtered log pull), companion-eval (replay eval on a ref with the key fetched live from Fly)

**Code roots:** `.github/workflows/autonomy-ops.yml` · `.github/workflows/fly-logs.yml` · `.github/workflows/companion-eval.yml`

**Entrypoints:** `.github/workflows/autonomy-ops.yml` · `.github/workflows/fly-logs.yml` · `.github/workflows/companion-eval.yml`

**Grounding:** autonomy-ops.yml 'environment: autonomy-ops' and input choices; docs/AUTONOMY-DEPLOY.md provisioning procedure

**Refuter's verdict:** grounded — Relabel the container as "Phone-operable ops buttons (workflow_dispatch). autonomy-ops.yml and companion-eval.yml are gated by the autonomy-ops Environment (required reviewers). fly-logs.yml is NOT gated: it is self-serv

## Where it sits

| From | To | What | How | Refuter |
|---|---|---|---|---|
| eric | ops_buttons | Approves and runs workflow_dispatch buttons | autonomy-ops Environment required reviewers | grounded — Relabel it as: eric → ops_buttons "Approves (required reviewer on the autonomy-ops Environment) and can dispatch autonomy-ops.yml / companion-eval.yml". Sessions may trigger the dispatch, but a run waits until Eric appro |
| ops_buttons | bots | flip-mode, set-playbooks, set-hardcore, logs | flyctl secrets set -a skynet-capital-bots | grounded — Label the edge "GitHub Actions workflow_dispatch -> Fly API (flyctl secrets set / logs), gated by the autonomy-ops environment reviewers" rather than implying a direct call to bots. Optionally add set-beta-forcing, statu |
