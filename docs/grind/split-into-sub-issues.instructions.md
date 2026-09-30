---
name: split-into-sub-issues
description: split one open plan's slices into native sub-issues so the board draws its progress bar
model: sonnet
effort: high
isolation: none
outcomeCheck: 'test "$(curl -sSf -H "Authorization: Bearer $GITHUB_TOKEN" -H "Accept: application/vnd.github+json" "https://api.github.com/repos/ejclark/skynet-capital/issues/{item}" | grep -o "\"total\": *[0-9]*" | grep -o "[0-9]*$")" -gt 0 || curl -sSf -H "Authorization: Bearer $GITHUB_TOKEN" "https://api.github.com/repos/ejclark/skynet-capital/issues/{item}/comments?per_page=100" | grep -q -- "!-- split-skipped --"'
---

# Split one plan into sub-issues — the backfill behind docs/ISSUES.md → *Slices as sub-issues*

First run: #4056 by hand (children #4206–#4212, 3 filed closed).

**Calling convention:** items are open issue numbers (`"3977"`). `isolation: none` — no checkout,
no file edits; the deliverable is GitHub state (child issues, links, a state-block edit). Items are
independent; run several at once, but **pace filings** (GitHub's secondary limit is ~80 creations a
minute, so one agent files serially and never loops faster than it can read its own output).

## Goal

The parent's progress bar (`4/7 ▰▰▰▰▱▱▱`) must tell the truth about the whole story: **every
slice becomes a child, including the ones that already shipped** (filed closed, so they count as
done). A bar that starts at 0/3 on a plan that is four slices in lies by omission.

## Steps

1. **Read the parent, all of it**: `node scripts/issues.mjs show {item} --json` (body), then its
   comments (`curl` REST `issues/{item}/comments?per_page=100`). The state block (first comment
   headed `## State block`) is the truth about what shipped; the body's *Slicing sketch* is the
   list. Where they disagree, the state block wins. Also check for existing children:
   `issues/{item}/sub_issues` — never file a duplicate of a child that exists.
2. **Decide whether to split.** Skip (and say why, step 6) when any of these holds:
   - no enumerable slices (a decision or investigation with no slicing sketch);
   - one slice or fewer remains *and* nothing shipped yet (one PR, no children — the rule's
     *Not for* line);
   - the plan is actually finished or superseded (then say so in the comment; don't close it —
     closing is the owner's call).
   Otherwise split. Remaining-count doesn't have to be large: a 7-slice plan with 1 left still
   splits, because the bar's job is the whole story.
3. **For each slice, in plan order, file one child** with the reference shape (#4059):

   ```markdown
   **<one-line ask, plain words, what it builds>.**

   | | |
   |---|---|
   | **Status** | <shipped in #PR · or: ready — inherits #{item}'s authorization · or: backlog — parent not ready> |
   | **Parent** | #{item}, slice <k> of <n> |
   | **Size** | ~<N> PR |
   | **As of** | `<main sha, git rev-parse --short origin/main>` |

   - <one bullet: what's in it, from the sketch>

   Picture: waived — a one-PR slice; the parent #{item} carries the picture and the brief.

   Done when: WHEN <trigger>, the <system> SHALL <response>.

   Builder detail: #{item}'s brief (slice <k>) and its state block.
   ```

   Title = the ask, plain words, no `slice 3:` prefix. The bullet stays under 120 characters (the
   lint refuses longer). Labels: `enhancement,plan`, plus `ready` only for an open slice of a
   parent that carries `ready`. A `Done when` for a shipped slice states what shipped.
   Command, per slice:

   ```
   node scripts/issues.mjs create --title "…" --body-file /tmp/…/k.md --labels enhancement,plan[,ready] \
     --parent {item} [--blocked-by <earlier child numbers>] [--closed] --force
   ```

   `--closed` for a slice the state block marks shipped/merged. `--blocked-by` only where the
   sketch says a slice waits on another (never a blanket chain), and only with a number your own
   `create` printed — never the guessed next number: parallel filers interleave, and the first
   backfill linked a stranger's issue that way (#4218 → #4216). `--force` because siblings share
   words and the duplicate check reads them as dupes; you checked for real duplicates in step 1.
   If a slice already has its own issue (the sketch names one), `node scripts/issues.mjs link
   {item} <n>` instead of filing.
4. **Never write the parent's number next to a closing keyword** (closes/fixes/resolves) in any
   child body — that closes the parent (#4179).
5. **Edit the state block in place** (`PATCH issues/comments/<id>` over REST, or the MCP
   `update_issue_comment`): one dated Log line — `<date> · slices filed as sub-issues #a–#b (k
   shipped, filed closed); pick up the next open, unblocked sub-issue`. Change nothing else. No
   state block → skip this step.
6. **Report** one line: `#{item} — split: n children (#a–#b), k closed` or `#{item} — skipped:
   <why>`. On a skip, also leave one short comment on the parent whose first line is
   `<!-- split-skipped -->` and whose text says why, so the next backfill doesn't re-read it.

## Never

- Edit the parent's body, labels or state (beyond the state-block Log line).
- Invent slices the plan doesn't list, or merge two of its slices into one child.
- Mark a slice shipped without a PR number or state-block line that says so.
