#!/usr/bin/env node
// Keeps the main checkout current, so a new local session loads today's rules.
//
//   .claude/hooks/session-start.sh → node scripts/hooks/fresh-checkout.mjs (laptop sessions only)
//
// WHY (#6470's study, 2026-11-01): the app starts local sessions in the main checkout. A session left
// it on a merged branch on 2026-10-10, and nothing moved it again. It fell 1,077 commits behind, so
// all 7 local sessions in the following weeks, and the 604 workflow agents they launched, loaded an
// old CLAUDE.md, no memory-history hook and none of the newer skills. Anything shipped to main
// reached none of them.
//
// A session reads CLAUDE.md before this runs, so the first session after new merges still carries the
// older copy, and its line says so. The gap is then what merged since the last session started here.
//
// It moves the checkout only where no work can be lost: no tracked changes, and every local commit
// already on main or in a merged PR whose head is exactly this commit. Otherwise it says so in one
// line. Untracked files stay. A hook must never break the session that fired it, so every failure
// here exits 0.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { isMain } from "../is-main.mjs";

/** Pure: what to do with this checkout. `branch` is null on a detached head. */
export function decide({
  isPrimary,
  behind,
  ahead,
  hasTrackedChanges,
  branch,
  head,
  mergedPrHead,
}) {
  if (!isPrimary || behind === 0) return { act: "none" };
  if (hasTrackedChanges) return { act: "warn", why: "it has uncommitted changes" };
  if (branch === null)
    return ahead === 0
      ? { act: "move" }
      : { act: "warn", why: "it sits on a detached commit that is not on main" };
  if (branch === "main")
    return ahead === 0
      ? { act: "move" }
      : { act: "warn", why: "its main has commits origin lacks" };
  return mergedPrHead === head
    ? { act: "move" }
    : { act: "warn", why: `it sits on ${branch}, which has no merged PR at this commit` };
}

const FETCH_LIMIT_MS = 15_000;

function git(...args) {
  const r = spawnSync("git", args, { encoding: "utf8", timeout: FETCH_LIMIT_MS });
  return r.status === 0 ? r.stdout.trim() : null;
}

/** The hook's event, read from stdin. Only a new session moves anything: a compaction or a resume
 *  is mid-task, and files changing underneath it would be a surprise. */
function sessionSource() {
  try {
    return JSON.parse(readFileSync(0, "utf8")).source ?? "startup";
  } catch {
    return "startup";
  }
}

function mergedPrHeadOf(branch) {
  if (branch === null || branch === "main") return null;
  const r = spawnSync(
    "gh",
    [
      "pr",
      "list",
      "--head",
      branch,
      "--state",
      "merged",
      "--limit",
      "1",
      "--json",
      "headRefOid",
      "--jq",
      ".[0].headRefOid // empty",
    ],
    { encoding: "utf8", timeout: FETCH_LIMIT_MS },
  );
  return r.status === 0 ? r.stdout.trim() || null : null;
}

function main() {
  if (sessionSource() !== "startup") return;
  const gitDir = git("rev-parse", "--absolute-git-dir");
  const commonDir = git("rev-parse", "--path-format=absolute", "--git-common-dir");
  if (gitDir === null || commonDir === null || gitDir !== commonDir) return;

  git("fetch", "--quiet", "origin", "main");
  const behind = Number(git("rev-list", "--count", "HEAD..origin/main"));
  const ahead = Number(git("rev-list", "--count", "origin/main..HEAD"));
  if (!Number.isInteger(behind) || behind === 0) return;

  const branchName = git("symbolic-ref", "--quiet", "--short", "HEAD");
  const state = {
    isPrimary: true,
    behind,
    ahead,
    hasTrackedChanges: Boolean(git("status", "--porcelain", "--untracked-files=no")),
    branch: branchName,
    head: git("rev-parse", "HEAD"),
    mergedPrHead: mergedPrHeadOf(branchName),
  };
  const verdict = decide(state);
  if (verdict.act === "warn") return warn(behind, verdict.why);
  if (verdict.act !== "move") return;
  const moved =
    branchName === "main"
      ? git("merge", "--quiet", "--ff-only", "origin/main")
      : git("checkout", "--quiet", "--detach", "origin/main");
  if (moved === null) return warn(behind, "git refused to move it");
  console.log(
    `session-start: moved this checkout to main, ${behind} commits newer. The CLAUDE.md and skills this session loaded can predate that, so re-read what this task depends on.`,
  );
}

function warn(behind, why) {
  console.log(
    `session-start: this checkout is ${behind} commits behind main, and ${why}. Its CLAUDE.md, skills and hooks are old, so do this session's work in a fresh worktree from origin/main.`,
  );
}

if (isMain(import.meta.url)) {
  try {
    main();
  } catch (err) {
    console.error(`fresh-checkout: ${err?.message ?? err}`);
  }
}
