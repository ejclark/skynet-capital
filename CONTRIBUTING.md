# Contributing

## Conventional Commits (required)

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/). This is
what lets **semantic-release** decide the next version and generate the changelog automatically
on every merge to `main`. PRs are checked by the `Commit Lint` workflow.

Format:

```
<type>(optional scope): <summary>

optional body

optional footer
```

**Types and their release effect:**

| Type | Use for | Release |
|---|---|---|
| `feat` | a new capability | **minor** (1.2.0 → 1.3.0) |
| `fix` | a bug fix | **patch** (1.2.0 → 1.2.1) |
| `perf` | a performance improvement | patch |
| `docs` | docs only | none |
| `test` | tests only | none |
| `refactor` | internal change, no behavior change | none |
| `chore` / `build` / `ci` | tooling, deps, pipelines | none |

**Breaking changes** → **major** (1.2.0 → 2.0.0): add a `!` after the type (`feat!: …`) or a
`BREAKING CHANGE:` footer describing the break.

Examples:

```
feat(personas): add news-sentiment signal for the Rumor Trader
fix(autonomous): clamp order size when equity is unknown
docs(deploy): add Render instructions
feat!: rename SKYNET_BOT_* env vars

BREAKING CHANGE: bot credentials now use SKYNET_AGENT_* instead of SKYNET_BOT_*.
```

## Releases

- Merge to `main` → the **Release** workflow runs `semantic-release`.
- It analyzes commits since the last release, bumps the version, writes `CHANGELOG.md`, commits
  it back, and publishes a **GitHub Release** with the notes.
- The first `feat`/`fix` merged after this is adopted cuts the first version.
- The package is private — releases are versioned GitHub artifacts, not npm publishes.

## Before opening a PR

```sh
npm run typecheck
npm run lint
npm test
```
