# Fix one doc's doc-rot findings

**Calling convention:** group items **per doc**, not per finding — one item carries every flagged
reference in that file (`{doc: "docs/LESSONS.md", refs: ["scripts/moneypenny.mjs", ...]}`), so
overlapping fixes to the same file never need reconciling across PRs. Run with `isolation: true` —
step 1 below does its own `git checkout -B`, and without a fresh worktree per item, concurrent items
would share one working directory and stomp on each other's checkout. Chain the outcome check after
this step — `{kind: "script", command: "git ls-remote --exit-code --heads origin {prev.branch}"}` —
so a `done` is verified against origin, not trusted. The doc-rot budget already sits at 0, so the
gate goes green on its own once every finding is fixed; there is no trailing `--update` to run.

## Goal

Take every dead-reference finding `scripts/doc-rot-scan.mjs` reports for one doc (a repo-relative
path or `npm run <script>` the doc cites that no longer exists) and fix the doc so it matches
reality — without guessing at intent beyond what the surrounding prose already says.

## Steps

1. `git fetch origin main && git checkout -B docs/fix-doc-rot-<slug> origin/main` (`<slug>` from
   the doc's basename), then `bash scripts/worktree-setup.sh`.
2. `node scripts/doc-rot-scan.mjs` — confirm each reference listed in your item is still flagged
   for your doc. Fix only those; don't hunt for others.
3. For each reference, open the doc at the flagged citation and decide which case applies:
   - **Renamed/moved** — grep the repo for the file's likely new name or location (a distinctive
     substring of its old path), or check `git log --diff-filter=R --summary -- '<old-path>'`, and
     repoint the reference to its new path.
   - **Deleted / never existed / a dead `npm run` script** — remove the reference (the whole
     sentence or list item if the reference was its entire content; just the dead link/command if
     the surrounding prose stands without it).
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
- If a finding names a doc outside the scan's normal surface (check `scripts/doc-rot-scan.mjs`'s
  own scope if unsure), report `blocked` and say so — the surface may have changed since this file
  was written.
