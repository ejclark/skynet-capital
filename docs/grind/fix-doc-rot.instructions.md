# Fix one doc-rot finding

**Calling convention:** run items sequentially (`isolation: false`) — doc-rot findings frequently
collapse onto the same handful of files, and parallel worktree agents editing the same doc race
each other. Run `node scripts/doc-rot-scan.mjs --update` once, as a single trailing step after
every item lands, not inside each item's own chain (it rewrites one shared budget file).

## Goal

Take one dead-reference finding from `scripts/doc-rot-scan.mjs` (a repo-relative path or
`npm run <script>` cited in a doc that no longer exists) and fix the doc so it matches reality —
without guessing at intent beyond what the surrounding prose already says.

## Steps

1. `git fetch origin main && git checkout -B docs/fix-doc-rot-<slug> origin/main`, then
   `bash scripts/worktree-setup.sh`.
2. `node scripts/doc-rot-scan.mjs --candidate` only to confirm the finding is still live — the
   target below is already picked, don't re-derive it.
3. Open the flagged doc at the flagged reference and decide which case applies:
   - **Renamed/moved** — grep the repo for the file's likely new name or location (a distinctive
     substring of its old path), or check `git log --diff-filter=R --summary -- '<old-path>'`, and
     repoint the reference to its new path.
   - **Deleted / never existed / a dead `npm run` script** — remove the reference (the whole
     sentence or list item if the reference was its entire content; just the dead link/command if
     the surrounding prose stands without it).
4. If you cannot tell which case applies with real confidence (the rename target isn't obvious, or
   multiple candidates are equally plausible), don't guess — report `status: "blocked"` with what
   you found and why it's ambiguous.
5. `node scripts/doc-rot-scan.mjs` — must exit 0 (debt not increased) before moving on.
6. Commit (`docs: fix stale reference in <file>`), push with retries. Report the before/after
   reference. Do NOT run `--update` yourself — that happens once, after every item in this batch
   lands (see calling convention above).

## Guardrails

- Docs-only change. Never edit the file a doc references, only the doc's citation of it.
- When several findings land in the same doc, fixing just the one line you were given is correct
  even though other items in this same grind run may land more edits in that file.
- A misclassified rename-vs-deletion is reversible (git revert) and low-stakes, but "I'm not sure"
  is still worth a `blocked` report over a wrong guess.
- If a finding names a doc outside the scan's normal surface (check `scripts/doc-rot-scan.mjs`'s
  own scope if unsure), report `blocked` and say so — the surface may have changed since this file
  was written.
