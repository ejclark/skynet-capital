---
name: honest-degradation
description: make one eye degrade honestly — a missing or unreadable input is a named state it prints, never a silent pass
effort: high
isolation: worktree
outcomeCheck: 'git ls-remote --exit-code --heads origin {prev.branch}'
---

# Make one eye degrade honestly

**Calling convention:** the front matter above is the calling convention — generate the call with
`node scripts/grind-manifest.mjs --args --items '<json>' --item-source '<where the list came from>' docs/grind/honest-degradation.instructions.md`.
`effort: high` because every site is a judgment (is this input optional, required, or
fixture-only?) and a wrong call either manufactures a red or preserves a silent pass.
`isolation: worktree` because the chore edits code and a spec and commits.

Items are eye scripts (`"scripts/journey-scan.mjs"`), one per item, grouped so a script and its
spec are never touched by two items. The list comes from
`grep -nE 'catch \{|if \(!existsSync\([^)]*\)\) return' scripts/*.mjs`, which is the measurement,
not the verdict: every hit still gets read.

## Why this chore exists

The lesson is zpratt/lousy-agents' "degrade honestly: a missing input is a named state, never a
quiet pass" (#3769, call sheet row 1). Its first instance here was `scripts/doc-rot-scan.mjs`
(#3771): an unreachable graph commit returned no finding, so a shallow clone always passed the one
blocking doc check, and a map 1,862+ commits behind read "fresh". Eric, 2026-09-26: "a prime
opportunity to broadly apply the lessons we learned given we have exhaustive context". A grep over
the 26 eyes found about forty sites of the same shape. Each is one of three things, and only the
reader can tell which.

## Steps

1. `git fetch origin main && git checkout -B eyes/honest-<basename> origin/main`, then
   `bash scripts/worktree-setup.sh`.
2. Read the whole script, then every `catch {` and every `if (!existsSync(...)) return` in it.
   For each site write down which case it is:
   - **(a) Optional input.** The check still means what it says without this input (a digest dir
     that does not exist yet; a config file a repo may legitimately lack). Keep the behaviour, add
     a one-line comment saying why the input is optional, and make the script print one line
     naming the skipped state when it runs as a CLI (`·` prefix, the house style for a note) so a
     reader can see what was not checked. Never a bare silent branch.
   - **(b) Required input.** Without it the check cannot mean "pass" (a git command the whole
     verdict rests on; the file the eye exists to read; a budget file whose absence is treated as
     infinite). Replace the silent return with a named finding or an explicit state: a distinct
     message that says UNKNOWN or the missing thing by name, and a non-zero exit or a non-passing
     status. Choose the exit code the script already reserves for "the eye could not do its job"
     if it has one; otherwise add one and document it in the header comment.
   - **(c) Fixture-only path.** The branch exists so seeded-fixture specs can run outside a git
     repo or without a file. Leave it, but cite the spec case that exercises it in a comment. If
     no spec exercises it, it is not (c); reclassify.
3. For every (b) add a fixture case to the eye's spec under `tests/arch/` (create
   `tests/arch/<name>.spec.ts` in the house shape if none exists: run the real script in a
   seeded temp dir via `execFileSync`, assert the exit code and the message). For every (a) add
   one case asserting the note line prints. Use `tests/support/hermetic-git.ts` when the fixture
   needs a repo.
4. Run the eye against the real repo (`node scripts/<name>.mjs` with its usual args) and confirm
   the verdict on a full checkout is unchanged. A new red on the real repo is a finding to report,
   not something to fix in this chore: report `status: "blocked"` with the exact output.
5. `npx biome check scripts/<name>.mjs tests/arch/<name>.spec.ts` and
   `npx rstest run tests/arch/<name>.spec.ts` green.
6. Commit as `fix(<name>): degrade honestly — <what the missing state now says>`, one commit per
   eye, and report: the sites as a table (line · case · what changed), the pushed branch name in
   `branch`, and any site you could not classify with real confidence as `blocked` with why.

## Guardrails

- Never widen the eye's job. The chore changes what a missing input *says*, not what the eye
  checks.
- Never turn an advisory eye into a blocking one. If the eye's verdict is advisory today
  (`tests/support/advisory-scan.ts`), the named state stays advisory; it is still printed.
- No new dependency. No edits outside the eye, its spec and, when a new exit code is added, its
  header comment and the `docs/COACHES.md` roster row that documents the exit codes.
- `catch` blocks that rethrow, log, or fall through to a non-passing path are not hits. Read
  before editing.
