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

## Merging — auto-merge on green, no babysitting

Every PR to `main` runs two required checks: **`CI`** (`node 24 · typecheck · lint · test`) and
**`Commit Lint`**. A PR merges when — and only when — both are green. The point is that nobody
(human or agent) has to sit and watch a PR: flag it and move on, and GitHub merges it the moment
CI passes.

**How to merge:**

1. Open the PR (checks start automatically).
2. **Enable auto-merge immediately, while CI is still running** — squash method. GitHub holds the
   merge until both checks pass, then merges on its own. Nothing merges while a check is pending
   or red, because the branch ruleset enforces it server-side.
3. That's it. Don't poll, don't re-run status by hand, don't hold the session open waiting — the
   merge is GitHub's job now.

**Squash + a Conventional Commit PR title.** We squash-merge so `main` stays one logical commit
per PR. The **PR title becomes that commit's message**, and it's what `semantic-release` reads to
version and changelog — so the **PR title must itself be a valid Conventional Commit** (e.g.
`feat(login): zoom-framed plays`), not a prose sentence. `Commit Lint` validates the commits *on*
the PR; it does not lint the squash title, so getting the title right is on you.

## Keeping agent sessions moving (no PR churn)

The workflow is built so a Claude session never blocks on a PR and never reworks finished history:

- **Branch from the latest `main`.** `git fetch origin main && git checkout -B <branch> origin/main`.
  Don't branch off a stale local `main` or off another feature branch.
- **Enable auto-merge, then keep working forward.** Once a PR is up with auto-merge armed, the
  session is free to start the next unit of work — it should not idle waiting for the merge.
- **A merged PR is done — do not reuse it.** Follow-up work is a *fresh* branch cut from the new
  `main`, and a *new* PR. Never stack new commits on an already-merged branch or try to reopen a
  merged PR; that's what causes churn and tangled history. (This mirrors the release model: each
  merge to `main` is a discrete, versioned event.)
- **One PR = one logical change.** Small, self-contained PRs merge fast and keep the squashed
  history readable. Land work in batches rather than growing one long-lived branch.

### One-time repository setup (admin)

Auto-merge only works if the repo is configured for it. These are set once, in the GitHub UI, by
a repo admin — they can't be changed from a Claude session:

1. **Settings → General → Pull Requests →** enable **Allow auto-merge**.
2. **Settings → Rules → Rulesets →** new branch ruleset targeting the default branch (`main`):
   - **Require a pull request before merging.**
   - **Require status checks to pass** → add `node 24 · typecheck · lint · test` and `commitlint`
     (pick them from the dropdown after they've run once, so the names match exactly).
   - Recommended: **Require branches to be up to date before merging.**

Without step 1, enabling auto-merge fails. Without step 2, a PR could merge before CI finishes —
the ruleset is the actual safety gate.
