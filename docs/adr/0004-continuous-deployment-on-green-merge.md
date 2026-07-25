# ADR-0004: Continuous deployment to Fly on green merge to main

- **Status:** Accepted
- **Date:** 2026-07-25

## Context

With the dashboard hosted on Fly (ADR-0001), deploying by hand per change is friction and drift.
We want merging a reviewed, green PR to `main` to ship automatically, without a deploy ever running
against unvalidated code.

## Decision

We will add a `Deploy` GitHub Actions workflow triggered by `workflow_run` of the **CI** workflow
completing on `main`. It runs only when `conclusion == 'success'`, checks out the exact validated
`head_sha`, and runs `flyctl deploy --remote-only`. The only GitHub secret required is
`FLY_API_TOKEN` (a Fly deploy-scoped token); all runtime/app secrets stay on Fly and are never
added to GitHub.

## Alternatives considered

- **A `push`-triggered deploy that re-runs the checks itself** — duplicates the CI job and can
  deploy even if the "real" CI is red. Rejected in favor of gating on CI's own conclusion.
- **Manual `fly deploy`** — simple but drifts and is easy to forget. Kept only for the one-time
  bootstrap (app/volume/secrets creation).

## Consequences

- Merge green → ship. Deploys are serialized (`concurrency`) so merges don't race.
- The GitHub↔Fly boundary needs exactly one secret; app secrets never leak into CI.
- The first deploy still requires a one-time manual bootstrap (create app, volume, secrets); CD
  can deploy an app but not create it.
