# Architecture Decision Records

An **ADR** captures one significant architectural decision: the context that forced it, the
choice we made, the alternatives we rejected, and the consequences we accept. They give the
project a durable memory — so a decision made months ago can be understood (and revisited)
without reconstructing it from PRs and chat logs.

## When to write one

Write an ADR when a decision is expensive to reverse or shapes how future work is built:
a new external dependency or host, an auth model, a data-flow seam, a security boundary, a
CI/CD pipeline. Skip it for routine changes (a bug fix, a new fixture, a refactor that keeps
the same contract).

## How

1. Copy `0000-template.md` to `NNNN-short-title.md` (next number, kebab-case title).
2. Fill it in. Keep it short — one screen is ideal.
3. Set **Status** to `Proposed` in the PR; flip to `Accepted` when merged. A later decision
   that overturns this one sets this record to `Superseded by ADR-XXXX` (records are
   append-only history — edit status, not the reasoning).
4. Add a row to the log below.

## Log

| ADR | Title | Status |
|-----|-------|--------|
| [0001](0001-host-live-dashboard-on-fly.md) | Host the live dashboard as an always-on Fly.io service | Accepted |
| [0002](0002-offline-data-source-mode.md) | Offline data-source mode for keyless local runs | Accepted |
| [0003](0003-self-service-account-onboarding.md) | Self-service account onboarding via an encrypted store | Accepted |
| [0004](0004-continuous-deployment-on-green-merge.md) | Continuous deployment to Fly on green merge to main | Accepted |
| [0005](0005-in-app-oauth-authentication.md) | In-app Google/GitHub OAuth with an allowlist | Accepted |
