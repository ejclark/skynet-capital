---
name: instruction-drift
description: read one changed instruction file (or one skill's files) for the drift a scanner cannot see — two files ruling differently, a stale fact, a rule written as history — and land only the rewrites a refuter could not kill
model: fable
effort: high
isolation: worktree
outcomeCheck: 'git ls-remote --exit-code --heads origin {prev.branch}'
---

# Read one instruction file for drift, refute each finding, apply what survives

**Calling convention:** the item list and the due check come from
`scripts/instruction-drift-scan.mjs`. The chain is three roles of this one file, so write `steps`
from the block below rather than from `grind-manifest.mjs --args`, which emits a single step; each
role's tier still resolves from this front matter at dispatch unless the step overrides it.

```bash
git fetch origin main
node scripts/instruction-drift-scan.mjs --due    # exit 1: a run is owed · 0: not yet · 3: UNKNOWN, read its line
node scripts/instruction-drift-scan.mjs --json   # `items` → grind · `protectedItems` → step 3 below · `at` → the stamp
```

`readOnly` lists the changed files no one hand-edits (generated pages, Eric's verbatim rounds, ADRs:
`doNotEditReason` in `scripts/instructions/scope.mjs`); they are never items.

At a model release, add `--release` to both, and `Release run.` to each role's `extra`: every
instruction file becomes an item.

```json
{
  "items": "<the scan's items>",
  "itemSource": "node scripts/instruction-drift-scan.mjs --json: instruction files changed since the stamp",
  "chore": "instruction-drift",
  "steps": [
    { "kind": "instructions", "path": "docs/grind/instruction-drift.instructions.md", "label": "check", "extra": "Role: check." },
    { "kind": "instructions", "path": "docs/grind/instruction-drift.instructions.md", "label": "refute", "extra": "Role: refute.", "effort": "xhigh" },
    { "kind": "instructions", "path": "docs/grind/instruction-drift.instructions.md", "label": "apply", "extra": "Role: apply.", "model": "sonnet" },
    { "kind": "script", "command": "git ls-remote --exit-code --heads origin {prev.branch}" }
  ]
}
```

Tiers, per `docs/COMPUTE.md`: **check** is judgment across files (floor `opus`/`high`, rounded up
to `fable` like this directory's other judgment chores); **refute** is adversarial (floor
`xhigh`); **apply** reverts what died and runs the gates, the mechanical-with-verification row
(`sonnet`/`high`). `isolation: worktree` because every role commits to the item's branch.

Items are `{label, files, branch}` objects; a skill chunk without its `SKILL.md` adds `context`. A role that ends `skipped` ends the chain for its item:
check with nothing found, apply with nothing left to land. Both are good results.

**After the run, the caller, once:**

1. Land every `done` branch as one wave PR (`docs: retire instruction drift — <date>`, via
   `/ship`) — merge them one at a time onto `docs/instruction-drift-<at7>-wave` off `origin/main`;
   a conflict there is two items fixing one passage, so keep the first. The body names the issue
   the run serves (`Part of #5318` until a trigger files one per run), or
   `scripts/pr-provenance-scan.mjs` counts the wave as a PR with no issue.
2. Board a branch that touches `CLAUDE.md` on the platter (`scripts/ship.sh platter board
   <branch>`) instead — its how-we-work text is Eric's to edit (its own closing line).
3. Run each `protectedItems` entry outside grind, whose step 0 blocks it: the three roles as three
   separate subagents from the calling session, the refuter never in the context that proposed,
   each role's guidance adding `Protected item.` (so apply reports `done` · `platter` rather than
   `blocked`), and the surviving branch boarded on the platter.
4. List every flag that held in the wave PR body under **Flags — a person decides**;
   `git log origin/main..origin/<branch> --format=%B` prints them.
5. Stamp it, once every item (grind's and the protected ones) ended `done` or `skipped`:
   `node scripts/instruction-drift-scan.mjs --record --at <the scan's at>` in the wave PR
   (`--release` too after a full run). A run that landed nothing still records its stamp, in a PR
   of its own: the stamp is what keeps the next `--due` honest. An item that ended `blocked` or
   errored (a `.claude/` edit nobody approved, a red verify) is re-run first with `-r2` appended
   to its `branch`, because wt-start resumes an existing branch and the old commits would stack under the
   new ones. One that still cannot finish holds the stamp back: recording past it would drop its
   file from every later run until it changed again.

The next run re-reads what this wave changed; a run that finds nothing ends the loop. The work
spigot refuses a run wider than its position allows (`work-mode.json`), and a `--release` run
(~135 items) needs `normal`. Edits under `.claude/` are never auto-approved outside
`bypassPermissions` (`README.md` → *Known limitations*), so check and apply on those items wait
for an approval: run them attended.

## Goal

For one item (one changed instruction file, or one skill's files): a pushed branch holding only the
rewrites a refuter could not kill, plus any flags for a person, or `skipped` when nothing survives.

## Why this chore exists

The 2026-10-04 prompt audit confirmed 237 findings in the instruction files: 4% were prompting
written for older models, 96% were drift. Its three largest raw classes were two files disagreeing
(67), a stale fact (63) and a rule written as history (52), and none of them is a pattern a scanner
can match; dead paths and `npm run` names are `scripts/doc-rot-scan.mjs`'s. This chore is the
model's read. It takes only the files changed since the last run, so its cost tracks the change
rate rather than the size of the corpus.

## The keep list — binding on every role

Items 1–10 are Anthropic's prompt-audit guide (the `claude-api` skill → `shared/prompt-audit.md`,
"What not to flag"); 11–12 are this repo's. What they cover is not a finding. The refuter cites
them by number.

1. **Context is never cruft:** audience, product, environment facts, the quality bar,
   constraints, and the reasons for them. Eric's quoted words with their date are a reason.
2. **Length is never a finding.** Nothing is cut for size alone.
3. **Fragile operations keep their exact commands** (destructive commands, auth, compliance).
4. **Tool-contract detail stays**, and often needs more, not less.
5. **A prohibition against a current, demonstrated failure stays.**
6. **Routing and trigger text may carry calibrated urgency.**
7. **A format-pinning example on a format-sensitive output stays.**
8. **Redundancy that agrees is not drift**; consolidation is proposed only where copies disagree.
9. **A one-line role statement stays, and so does one deliberate closing recap.**
10. **Text added for a newer model's failure modes stays.**
11. **A pointer to where something lives now stays:** the plan issue that owns a mechanism, the
    citation behind a number. Narrative about what happened goes; the link to its home does not.
12. **An empty result is a good result.** A run that finds nothing changes nothing.

## The three checks

**A. Two files ruling differently on one point.** For each rule the item states (a must, a never,
a default, a number, a name, an owner), grep the scope for its topic with the distinctive nouns it
governs: `grep -n -i -e '<term>' $(node scripts/instruction-drift-scan.mjs --scope)`. Read both
passages whole. Date each with `git blame -L <line>,+1 --date=short origin/main -- <file>`; the
later date is the newer rule, never a file's mtime and never a passage's claim about itself.
Rewrite the older passage to agree, or replace it with a link to the newer one's home: one rule,
one home. Not a conflict: a narrower file whose different rule its own scope explains, or one that
names the rule it overrides. **Flag, never edit,** when the older passage is a prohibition or a
safety rule, or when the newer one adds a command, adds a network fetch, or loosens a prohibition.

**B. A stale fact the repo contradicts.** A script, flag, label, file, count, threshold, owner or
date the item states as current: check it against the code, never against another doc — the
constant in the script, `package.json`, `git ls-files`, `envelope.json`, `work-mode.json`,
`scripts/moneypenny/labels.mjs`. Contradicted → rewrite it to the current fact, or remove the
sentence when the fact was all it said. A generated, git-ignored, placeholder or out-of-repo path
is not contradicted by being absent. Whatever `node scripts/doc-rot-scan.mjs` reports belongs to
`fix-doc-rot`; leave it.

**C. A rule written as history.** Past-tense narrative, PR or issue numbers telling what happened,
"used to", "no longer", "now", "previously", "until", "since <date>": state the rule as if it were
the only rule there ever was, keeping any quoted reason (keep 1) and any pointer to a current home
(keep 11).

> Before: "Since #4074 the check is advisory; it used to turn unrelated PRs red almost daily."
>
> After: "The check is advisory: it measures an ambient property of `main`, not the diff, so
> blocking on it would turn unrelated PRs red."

## Steps

Your role is named under *Additional guidance* (`Role: check`, `Role: refute` or `Role: apply`), and
only that role's steps are yours. No role named → report `status: "blocked"`: this chore is a
chain, and a refuter in the proposer's own context is no refuter. `Protected item.` there means the
caller is running a lane prompt outside grind for the platter. In every role: one plain command per
call, never a `&&` chain around git; `/usr/bin/git` where plain `git` is refused
(`docs/DELEGATION.md` rail 2).

### Role: check

1. `bash scripts/wt-start.sh <item.branch>` — fetch, branch off `origin/main`, `node_modules`
   and one status line, in one call.
2. Read every file in `item.files` whole, then run checks A, B and C over them. A skill chunk
   without its `SKILL.md` carries it in `item.context`: read it too, so the cards are judged
   against the skill they serve. It is not one of this item's files, so step 4's rule for another
   file applies to it.
3. Put each candidate through the keep list and drop it when one item covers it. Confidence is
   high when the repo contradicts the text (code that disproves a fact, two files with opposite
   rules); a candidate resting on idiom or a hunch is a flag at most.
4. Write the minimal rewrite for each survivor into the file: the smallest change that makes the
   passage true and current, with no new rule, no lost constraint and no taste edit. When a
   conflict's older passage is in another file, edit that file too, unless it is another item of
   this run, whose own check owns it (in a release run every instruction file is; otherwise
   `node scripts/instruction-drift-scan.mjs --json` lists them), or
   `node scripts/envelope-scan.mjs --check <file>` protects it, which makes it a flag. A flag
   edits nothing.
5. Nothing survived → report `status: "skipped"`, summary `no drift found — a good result`, and
   stop: no commit, no branch.
6. Commit as `docs(drift): propose rewrites in <item.label>`, one body paragraph per finding,
   `F<n> <conflict|stale|history> — <file>:<line>: <what is wrong, and the evidence>`, and one per
   flag, `FLAG<n> — <file>:<line> vs <file>:<line>: <why a person decides>`. A flags-only commit is
   `--allow-empty`. `git push -u origin <item.branch>`, and report `done` with `item.branch` in
   `branch` and `<f> findings · <g> flags` as the summary.

### Role: refute

You are the adversary: your job is to kill findings, not to improve them.

1. `bash scripts/wt-start.sh <item.branch>-refute` for the fetch and `node_modules`, then
   `git fetch origin +refs/heads/<item.branch>:refs/remotes/origin/<item.branch>`, then
   `git checkout --detach origin/<item.branch>`. You work detached on the check's commit because
   the check's worktree still holds the local `<item.branch>`, and wt-start only branches from
   `origin/main`.
2. `git show HEAD`: the findings are in the body, the rewrites in the diff.
3. Try to kill each finding with these tests, in order; the first that holds kills it:
   - **keep:** a keep-list item covers it (name the number);
   - **true:** re-verified from scratch against `origin/main`, without reusing the check's
     evidence, the "stale" fact is true, or the "conflict" is an override;
   - **older:** by `git blame` at `origin/main`, the passage rewritten is the newer of the two;
   - **dependent:** something reads the exact text — `git grep -n -F '<the removed words>'` finds a
     spec, lint or parser outside the doc that matches it;
   - **lossy:** the rewrite drops a constraint, a quoted reason or a pointer, or adds a rule the
     repo does not hold.

   An objection cites a line, a number or a command's output; one that cannot is withdrawn. No
   test holds → the finding **stands**. A finding that stands on idiom alone, or touches a
   prohibition or a safety rule, becomes a **flag**. A check flag that does not hold — the two
   passages do not in fact disagree — is refuted like a finding.
4. Record the verdicts in an empty commit, `docs(drift): verdicts for <item.label>`, one body line
   each: `F<n> stands`, `F<n> refuted (<test>) — <evidence>`, `F<n> flag — <why>`,
   `FLAG<n> holds` or `FLAG<n> refuted — <evidence>`. Edit no file.
5. `git diff --quiet HEAD~1 HEAD` must exit 0, proving the commit changes no file; then
   `git push --no-verify origin HEAD:<item.branch>`. The tree is the one the check's push already
   ran `npm run verify` on.
6. Report `done` with `item.branch` in `branch` and `<s> stand · <r> refuted · <f> flagged`.

### Role: apply

1. As the refuter did: `bash scripts/wt-start.sh <item.branch>-apply`, then
   `git fetch origin +refs/heads/<item.branch>:refs/remotes/origin/<item.branch>`, then
   `git checkout --detach origin/<item.branch>`.
2. Read the verdicts (`git log -1 --format=%B`) against the proposal (`git log -1 --format=%B
   HEAD~1` and `git diff origin/main...HEAD`).
3. Revert every finding that did not stand, restoring its passage to the `origin/main` text —
   `git checkout origin/main -- <file>` when nothing in that file stands, by hand otherwise —
   until `git diff origin/main...HEAD` shows only standing rewrites. Flags stay unedited.
4. `node scripts/doc-rot-scan.mjs` must report nothing in a line this branch changed.
5. Nothing stands and no flag holds → report `status: "skipped"`, summary `every finding refuted
   — nothing to land`, and stop.
6. If you reverted anything, commit as `docs(drift): apply verdicts for <item.label>` with one body
   line per finding (`F<n> applied`, `F<n> refuted — <test>`, `FLAG<n> — <why a person decides>`)
   and `git push origin HEAD:<item.branch>`, whose hook runs `npm run verify` on the final tree.
7. Report `done` with `item.branch` in `branch` and `<a> applied · <f> flagged`, adding `platter`
   when the branch touches `CLAUDE.md`, or when the guidance says `Protected item.` A branch of
   any other item that touches a path `node scripts/envelope-scan.mjs --check` protects is
   `blocked` instead: grind never edits one.

## Guardrails

- Three classes only: files that disagree, stale facts, rules written as history. Taste, tone,
  length and structure are out.
- Never edit a prohibition or a safety rule and never loosen a constraint: flag it.
- Never add a rule. A rewrite restates what the repo already holds.
- Edit instruction files only (`node scripts/instruction-drift-scan.mjs --scope`), never the code a
  fact describes. When the code is wrong and the doc right, say so in the summary: that is a bug
  for `/issue`, not this chore.
- Ledgers (`docs/research/**`, `docs/LESSONS.md`, `docs/IDEAS.md` and the rest of the scope's
  exclusions) stay untouched even when a conflict points there: they describe their own moment.
- So do the do-not-edit files `--scope` leaves out: the generated pages (`docs/architecture/*.md`,
  `docs/STRUCTURE-graph.md`, the crawl and study outputs under `docs/members/`), Eric's verbatim
  rounds under `docs/design/eric-feedback/`, and the ADRs. A conflict that points at one is a
  flag naming where its text really comes from (`doNotEditReason` in
  `scripts/instructions/scope.mjs`).
- No PR, no merge, no stamp: the caller lands the wave and records the stamp once, because one
  shared stamp file would race across parallel items.
- Unsure which case applies → `status: "blocked"` with what you found. A wrong guess on an
  instruction file costs every session that reads it.
