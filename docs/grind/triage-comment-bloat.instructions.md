# Triage one comment-bloat finding

**Calling convention:** fan items **per file**, not per flagged comment — a file with 3 flagged
comments is one item, not three. Run with `isolation: true` — step 1 below does its own
`git checkout -B`, and without a fresh worktree per item, concurrent items share one working
directory and stomp on each other's checkout; worktree isolation, plus the per-file (not
per-comment) grouping, keeps items from colliding. Run `node scripts/comment-bloat-scan.mjs
--update` once, as a single trailing step after every item lands, not inside each item's own
chain. Fan as wide as the file list goes: comment-bloat has no Coach and changes no code, so the
one-open-structural-PR-per-Coach WIP limit (`docs/COACHES.md`) does not apply — the per-file fence
plus the once-per-batch `--update` are the whole discipline here.

## Goal

Take one file flagged by `scripts/comment-bloat-scan.mjs` (comments whose only content is
historical narration — a bare issue/PR number, "added for X", "handles the case from #N") and
either delete the narration or leave it, one comment at a time, without changing any code.

## Steps

1. `git fetch origin main && git checkout -B docs/triage-comment-bloat-<slug> origin/main`, then
   `bash scripts/worktree-setup.sh`.
2. `node scripts/comment-bloat-scan.mjs --candidate` only to confirm the target file is still
   flagged — don't re-pick a different file.
3. Open the flagged file and read every comment the scan matched (a bare `(#123)` citation, "PR
   #N", "issue #N", or "added/removed/used by/handles the case from"). For each one, read the
   surrounding code and decide:
   - **Pure narration** — the comment's only content is "this happened" / "this is here because of
     ticket N", and the code is otherwise self-explanatory or already has a separate WHY comment
     → **delete** the narration comment.
   - **Carries a real, non-obvious invariant** alongside the citation (e.g. "lifecycle statuses
     that must never enter the matcher") → **keep it as-is**. When unsure, keep — this scan flags
     candidates, it doesn't render final judgment.
4. Touch comments only. Zero lines of executable code change.
5. `npm run verify` — must exit 0 (comment deletion can't break behavior, but confirm nothing else
   drifted).
6. Commit (`chore: trim narration comments in <file>`), push with retries. Report how many
   comments were deleted vs. kept, why for anything borderline, and the pushed branch name in
   `branch` — chain `{kind: "script", command: "git ls-remote --exit-code --heads origin
   {prev.branch}"}` after this step so the push is verified, not trusted
   (`docs/grind/README.md`). Do NOT run `--update` yourself — that happens once, after every item
   in this batch lands (see calling convention above).

## Guardrails

- Code behavior must not change — this is a comment-only pass. If deleting a comment tempts you to
  "clean up" the code near it, don't; that's a different chore.
- If the file is inside an `envelope.json`-protected path (e.g. `src/server/auth/**`), report
  `status: "blocked"` with "target is envelope-protected" instead of editing it.
- Default to keep when a comment's status is genuinely ambiguous — a false negative here (a stale
  comment left alone) is free; a false positive (a real invariant deleted) is the expensive
  direction.
