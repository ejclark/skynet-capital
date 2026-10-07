#!/usr/bin/env bash
set -euo pipefail

# Land the one hunk a session is structurally unable to push: #3959 slice 1's trigger in
# `.github/workflows/moneypenny-events.yml`. One command, run from anywhere.
#
# WHY A HUMAN RUNS THIS (2026-10-05, #3959 slice 1). GitHub refuses a GitHub App's push that
# creates or updates any file under `.github/workflows/` unless the App holds the `workflows`
# permission — which this repo's envelope withholds on purpose ("a lane that can edit its own
# trigger has no envelope at all", envelope.json). That refusal is the envelope working, not a gap:
# granting the permission to remove this step would hand every lane the ability to rewrite its own
# wake-up. So the lane shipped everything the trigger calls — specced and green — and left the
# trigger itself to be pushed by an identity the rule allows.
#
#   bash <(git show origin/main:scripts/land-3959-trigger.sh)        # the paste-able form
#   scripts/land-3959-trigger.sh [--dry-run]                        # from a checkout
#
# Checkout-state independent: it clones a throwaway copy of `origin/main` into a temp directory and
# never touches your working tree, so a stale or dirty local branch does not matter. Idempotent: if
# `main` already carries the trigger it says so and exits 0 without opening anything.
#
# What it does, in order: clone main (blobless) → fetch the patch's base blob → apply the hunk below
# (3-way, so an unrelated edit to the same file still merges) → run `node scripts/workflow-lint.mjs`
# as its own proof → commit → push a branch → open a PR labelled `hold-merge` so nothing arms it →
# print the URL to merge.
#
# WHY THE BASE BLOB IS FETCHED BY HAND (2026-10-07). The first version cloned `--depth 50`, and a
# 3-way apply needs the blob the patch was cut from — two days of platters later that blob was
# outside the window, `git apply -3` fell back to a plain apply, and the paste-able line failed on
# its first real run. A blobless clone has the whole history but no file contents, and `git apply`
# does not lazy-fetch on its own, so the script asks for the one base blob (the patch carries full
# ids — cut it with `git diff --full-index`) before applying. If someone edits the very lines the
# hunk touches, 3-way still conflicts: then a session regenerates the patch, Eric re-pastes.

DRY=0
[ "${1:-}" = "--dry-run" ] && DRY=1

REPO="${REPO:-ejclark/skynet-capital}"
BRANCH="plan/3959-trigger"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

say() { printf '%s\n' "$*"; }

say "· cloning $REPO main into $TMP"
git clone --quiet --filter=blob:none --branch main "https://github.com/$REPO.git" "$TMP/repo"
cd "$TMP/repo"

if grep -q 'claim-feedback-reply' .github/workflows/moneypenny-events.yml; then
  say "✓ main already carries the #3959 trigger — nothing to do."
  exit 0
fi

cat > "$TMP/trigger.patch" <<'SKYNET_PATCH_EOF'
diff --git a/.github/workflows/moneypenny-events.yml b/.github/workflows/moneypenny-events.yml
index c7e438a9b4716178e1127c2bf06d74a78483b4fd..2fb7d8c05cc1487de4f387716b40c3475e5383f6 100644
--- a/.github/workflows/moneypenny-events.yml
+++ b/.github/workflows/moneypenny-events.yml
@@ -177,8 +177,15 @@ jobs:
     outputs:
       due_events: ${{ steps.screen.outputs.due }}
       # #3960 slice 3: the retry sweep (`next`) fills a lane when no event-driven claim did.
-      feedback_issue: ${{ steps.feedback.outputs.number || (steps.next.outputs.lane == 'feedback' && steps.next.outputs.number) || '' }}
-      feedback_model: ${{ steps.feedback.outputs.model || (steps.next.outputs.lane == 'feedback' && steps.next.outputs.model) || '' }}
+      feedback_issue: ${{ steps.feedback.outputs.number || steps.reply.outputs.number || (steps.next.outputs.lane == 'feedback' && steps.next.outputs.number) || '' }}
+      feedback_model: ${{ steps.feedback.outputs.model || steps.reply.outputs.model || (steps.next.outputs.lane == 'feedback' && steps.next.outputs.model) || '' }}
+      # #3959 slice 1: set ONLY on the reply-resume path — the comment id of the reply that woke the
+      # lane, so the build can read the answer it is resuming from. Empty on every other path.
+      feedback_reply: ${{ steps.reply.outputs.reply || '' }}
+      # That reply's timestamp, which the #1028 stall guard needs as its baseline on this path: its
+      # "a comment beyond the receipt" signal is trivially true on an issue that already holds a
+      # receipt, a question and an answer, so a resumed run measures silence from the reply instead.
+      feedback_reply_at: ${{ steps.reply.outputs.reply_at || '' }}
       plan_issue: ${{ steps.plan.outputs.number || (steps.next.outputs.lane == 'plan' && steps.next.outputs.number) || '' }}
       plan_model: ${{ steps.plan.outputs.model || (steps.next.outputs.lane == 'plan' && steps.next.outputs.model) || '' }}
     steps:
@@ -455,6 +462,35 @@ jobs:
           GH_TOKEN: ${{ steps.app-token.outputs.token }}
         run: node scripts/moneypenny/index.mjs --claim-feedback
 
+      # THE REPLY-RESUME GATE (#3959 slice 1, sub-issue #4299) — the feedback lane's SECOND door.
+      # The step above wakes on a label; this one wakes on an answer. Until it existed, `needs-info`
+      # was a one-way door: the lane asked the member something, labelled the issue, and the reply —
+      # the one moment the answer is known — triggered nothing. Getting back in meant somebody
+      # hand-removing the label (the unpark path above) or a later session finding the thread cold.
+      #
+      # Same authorization boundary as the plan gate below, and deliberately the same expression:
+      # `comment.author_association` ∈ [OWNER, MEMBER, COLLABORATOR], which is what `claude.yml`'s
+      # own gate uses. Read `claude.yml`'s header before touching it — 2026-08-30 banked a real
+      # incident where `sender.login` and `comment.author_association` disagreed after an
+      # org-membership change. A GitHub App's own comment reads `NONE` here, so the lane cannot wake
+      # itself through this gate; `replyResumeIntent`'s footer check is the second, independent guard
+      # on the same loop (criterion 3 makes the lane comment on the very issue it listens to).
+      #
+      # The `needs-info` + `feedback` checks and the parking guards live inside
+      # `claimFeedbackReply` (scripts/moneypenny/reply-resume.mjs — pure, fixture-specced), so this
+      # `if:` carries only the cheap github-context filters, same division as both gates around it.
+      - name: Resume a feedback build when an authorized member replies on needs-info
+        id: reply
+        if: >-
+          github.event_name == 'issue_comment' && github.event.action == 'created' &&
+          contains(fromJSON('["OWNER","MEMBER","COLLABORATOR"]'), github.event.comment.author_association)
+        # App token, not GITHUB_TOKEN: this step CLEARS `needs-info` and applies `in-progress`, and
+        # those label events are what move the board's Blocked → In Progress live (a GITHUB_TOKEN
+        # label write starts no workflow run, so `sync-project` would never hear them).
+        env:
+          GH_TOKEN: ${{ steps.app-token.outputs.token }}
+        run: node scripts/moneypenny/index.mjs --claim-feedback-reply
+
       # THE PLAN LANE'S GATE (#823) — mirrors the feedback gate immediately above, one authorization
       # boundary down. A plan issue's `ready` is a COMMENT, not a label, so the boundary is WHO
       # commented rather than who applied a label: `author_association` must be OWNER, MEMBER, or
@@ -721,12 +757,19 @@ jobs:
           # The triage rules and the build envelope live in .github/prompts/feedback-build.md,
           # not here. `.github/prompts/**` is envelope-protected (blocking), so the prompt merges
           # through Eric like this file, but no lane can rewrite its own orders.
+          # `Resume reply comment id` (#3959 slice 1) is the ONE run-shaped input beyond the issue
+          # number: the id of the authorized reply that woke this lane, or `none` on every other
+          # path. feedback-build.md owns what to do with it (read that comment first; acknowledge it
+          # in the receipt before any other act). The ID travels, never the BODY — a comment body
+          # interpolated into YAML is an injection seam, and the session has a token and can read it.
           prompt: |
             Read `.github/prompts/feedback-build.md` in this repo and follow it exactly. It is your
             complete instruction set for this run.
 
             The feedback issue is #${{ needs.route.outputs.feedback_issue }} in this repo.
 
+            Resume reply comment id: ${{ needs.route.outputs.feedback_reply || 'none' }}
+
       # THE MECHANICAL "DID ANYTHING VISIBLE HAPPEN?" GUARD (#1028). The session's own contract
       # (feedback-build.md: "exactly one of four visible endings, always, never silence") is a
       # prompt's promise — #1020's run 172 broke it silently (9 turns, $0.37, `is_error: false`,
@@ -749,6 +792,10 @@ jobs:
       - if: needs.route.outputs.feedback_issue != ''
         env:
           GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
+          # Empty except on a reply-resumed run — see the `feedback_reply_at` output's own note. In
+          # the environment rather than on the command line so there is no conditional argument to
+          # build, and no payload-derived string interpolated into a `run:` block.
+          RESUME_SINCE: ${{ needs.route.outputs.feedback_reply_at }}
         run: node scripts/moneypenny/index.mjs --guard-feedback-outcome ${{ needs.route.outputs.feedback_issue }}
 
       # THE LEASE IS PART OF THE TERMINAL-STATE PROMISE. A build that dies leaves the issue claimed
SKYNET_PATCH_EOF

say "· applying the trigger hunk"
BASE="$(sed -n 's/^index \([0-9a-f]\{40\}\)\.\..*/\1/p' "$TMP/trigger.patch" | head -1)"
git cat-file blob "$BASE" >/dev/null
git apply -3 --verbose "$TMP/trigger.patch" 2>&1 | sed 's/^/  /' || {
  say ""
  say "✗ the hunk no longer applies to main — someone edited the lines it touches."
  say "  Nothing was pushed. Ask a session to regenerate the patch in this script (#3959), then re-paste."
  exit 1
}

say "· proving it parses as a workflow"
node scripts/workflow-lint.mjs

if [ "$DRY" = 1 ]; then
  say ""
  say "DRY RUN — the hunk applied and the workflow lint passed. Nothing was pushed."
  # `git apply -3` stages its result, so the unstaged diff is empty — ask HEAD, not the index.
  git --no-pager diff --stat HEAD
  exit 0
fi

git checkout -q -B "$BRANCH"
git -c user.name="$(git config user.name || echo ejclark)" \
    -c user.email="$(git config user.email || echo ejclark@users.noreply.github.com)" \
    commit -q -am "feat(moneypenny): wire the reply-resume trigger into the events router

Slice 1 of #3959 — the one hunk the App identity cannot push (GitHub withholds
\`workflows\` from it by this repo's own envelope). Everything it calls merged
with the slice; this is the wake-up.

Part of #3959
Closes #4852"

say "· pushing $BRANCH"
git push -q -u origin "$BRANCH"

URL="$(gh pr create --repo "$REPO" --base main --head "$BRANCH" \
  --title "feat(moneypenny): wire the reply-resume trigger into the events router" \
  --body "## The picture

Picture: waived — the picture is on the slice's own PR; this is the one hunk that could not travel with it.

## Summary

- Adds the \`reply\` step and its two outputs to the events router. Part of #3959.
- Closes #4852 — which unblocks slice 2 (#4301) for the continuation sweep.
- Workflow file: never auto-merges. Labelled \`hold-merge\`; merge it when you are ready.
- Everything it calls is already on main, specced and green.
")"

gh pr edit "$URL" --add-label hold-merge >/dev/null

say ""
say "✓ done — the trigger is in a PR, held for your click:"
say "   $URL"
say "   Merge it and the feedback lane starts resuming on a reply."
