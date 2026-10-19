---
name: fix-doc-rot
description: fix one doc's dead references flagged by scripts/doc-rot-scan.mjs
model: opus
effort: high
isolation: worktree
outcomeCheck: 'git ls-remote --exit-code --heads origin {prev.branch}'
---

# Fix one doc's doc-rot findings

**Calling convention:** the front matter above is the calling convention — generate the call with
`node scripts/grind-manifest.mjs --args --items '<json>' --item-source '<where the list came from>' docs/grind/fix-doc-rot.instructions.md`
rather than transcribing these values by hand. `model: opus` and `effort: high` because a doc-rot fix is a judgment call three ways — renamed, deleted, or an idea the scanner misread as a citation — and `docs/COMPUTE.md`'s floor table puts judgment at `opus`/`high` (`grind.js` would otherwise run it at `sonnet`). `isolation: worktree` because step 1 below checks out its own branch (`wt-start.sh` refuses the primary checkout), and without a
fresh worktree per item concurrent items share one working directory and stomp on each other's
checkout; `outcomeCheck` so a `done` is verified against origin rather than trusted.

What the front matter **cannot** carry, because `grind.js` cannot enforce it — group items **per
doc**, not per finding. One item carries every flagged reference in that file
(`{doc: "docs/IA.md", refs: ["decision-pager.tsx", "learn.tsx:30", ...]}`), so overlapping fixes to the
same file never need reconciling across PRs. Items never touch `doc-rot-budget.json`: parallel PRs
would race it, so the calling session runs `node scripts/doc-rot-scan.mjs --update` once, after the
wave lands, to ratchet the budget down to what is left.
Fan as wide as the doc list goes, within the width the work spigot allows (`grindWidth` in
`work-mode.json`; `grind.js` refuses a wider run with the number to re-batch in): doc-rot has no
Coach and touches no `src/**` seam, so the one-open-structural-PR-per-Coach WIP limit
(`docs/COACHES.md`) does not apply — the per-doc grouping above is the only fence of this chore's own.

## Goal

Take every finding `scripts/doc-rot-scan.mjs` reports for one instruction file — a repo path or
`npm run <script>` it cites that no longer exists (`dead-ref`, `dead-script`), a `path:N` line cite
past the end of its file (`dead-line`), or a model ID no code runs (`stale-model`) — and fix the
file so it matches reality, without guessing at intent beyond what the surrounding prose already
says. The scan reads every tracked instruction file (`CLAUDE.md`, `README.md`, `.claude/**/*.md`,
the `.github` prompts and templates, `docs/**/*.md`) except the records the `LEDGERS` constant in
`scripts/instructions/scope.mjs` names — the one scope the scan shares with the instruction-drift
chore. That constant is the one definition of "a record of its moment"; this chore keeps no second
list.

## Steps

1. `bash scripts/wt-start.sh docs/fix-doc-rot-<slug>` (`<slug>` from the doc's basename) — fetch,
   branch off `origin/main`, `node_modules` and one status line, in one call. After it, one plain
   command per call — never a `&&` chain around git; `/usr/bin/git` where plain `git` is refused
   (`docs/DELEGATION.md` rail 2).
2. `node scripts/doc-rot-scan.mjs` — it lists every finding. Confirm each reference listed in your
   item is still flagged for your doc. Fix only those; don't hunt for others.
3. For each reference, open the doc at the flagged citation and decide which case applies:
   - **Renamed/moved** — grep the repo for the file's likely new name or location (a distinctive
     substring of its old path), or check `git log --diff-filter=R --summary -- '<old-path>'`, and
     repoint the reference to its new path.
   - **Deleted / never existed / a dead `npm run` script** — remove the reference (the whole
     sentence or list item if the reference was its entire content; just the dead link/command if
     the surrounding prose stands without it).
   - **A line cite past the end of its file** (`dead-line`) — the code the cite meant has moved,
     often into another file (a route thinned to a redirect, its body moved to `app/src/shell/`).
     Take the symbol the surrounding prose names and find its definition across the whole repo
     (`git grep -nE '(function|const|class|type|interface) <Symbol>\b'`), then repoint both the path
     and the line. Drop the cite only when the symbol is gone everywhere. When the prose names no
     symbol, or the definition matches in more than one place, report `blocked` — never keep the
     old path with the `:N` dropped, which turns a cite the scanner can see into a wrong one it
     can't.
   - **A model ID nothing runs** (`stale-model`) — grep `src/`, `scripts/` and
     `.github/workflows/` for the role the prose describes and name the ID that code runs, or name
     the role instead of an ID.
   - **A former name, on purpose** — "(formerly `foo.mjs`)", "deleted in #3627": history in
     a live doc, not a pointer to follow. Keep the history; drop the code span (or turn it into a
     runnable `git show <sha>^:<path>`) so the scanner no longer reads it as a citation.
   - **An idea, not a citation** — a doc proposing that something be built ("promote it to
     `scripts/foo.mjs`") is describing a future artifact, not citing a present one. Don't delete the
     idea. Rephrase so the scanner no longer reads it as a path reference (say what the script would
     be called in prose, without the literal path/command form), and say in the summary that you
     did so.
4. If you cannot tell which case applies with real confidence (the rename target isn't obvious, or
   multiple candidates are equally plausible), don't guess — report `status: "blocked"` with what
   you found and why it's ambiguous.
5. `node scripts/doc-rot-scan.mjs` — must show none of your doc's references still flagged, and no
   new finding introduced.
6. Commit (`docs: fix stale references in <file>`), push with retries. Report the before/after for
   each reference, and the pushed branch name in `branch` — the calling chain verifies it with
   `git ls-remote`.

## Guardrails

- Docs-only change. Never edit the file a doc references, only the doc's citation of it.
- Fix every reference listed for your doc, and only those.
- A misclassified rename-vs-deletion is reversible (git revert) and low-stakes, but "I'm not sure"
  is still worth a `blocked` report over a wrong guess.
- If a finding names a doc outside the scan's normal surface (check `isInstructionFile` in
  `scripts/instructions/scope.mjs` if unsure), report `blocked` and say so — the surface may have
  changed since this file was written.
