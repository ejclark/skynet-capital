#!/usr/bin/env node
// Catch a stacked child PR up to `main` after its parent squash-merged, in one command.
//
//   node scripts/stack-sync.mjs <parent-pr> [--push] [--dry-run]     # run on the child branch
//
// WHAT HAPPENED (2026-11-12). Stacked PRs are the speed-up Eric asked for ("the only changes in that
// PR should be merge conflicts and minor resolutions which should be easy to settle"). This repo
// squash-merges and deletes head branches on merge, so when a parent lands GitHub retargets its
// child to `main`. The child still carries the parent's ORIGINAL commits while `main` holds ONE
// squash commit of the same change, so `git merge origin/main` conflicts on every file both touched:
// 12 files on #7492, 4 on #7491. Each fix was mechanical. Prove that main's copy of every
// conflicting path is exactly the parent's FINAL head copy, then keep the child's side. This script
// is that proof plus that resolution.
//
// THE RULE. A conflicting path resolves to the child's side only when `main:<path>` and
// `<parent head>:<path>` are the same blob (absent from both counts as equal). Then main's side
// carries nothing the child has not already built on. Where the child deleted or renamed the path
// and main's copy equals the parent's, the child's deletion stands (`git rm`). Any other path means
// `main` changed it after the parent's head (another PR landed on it), which is a real merge for a
// person to read. The script aborts the merge and names those paths. The merge runs with
// `-X no-renames` so every conflict is path-for-path and the blob comparison is exact.
//
//   --push     after a successful sync, `git push --no-verify`. The pre-push hook runs the full
//              local verify; CI runs the same suite on the PR, so the flag skips it and says so.
//   --dry-run  run the merge, report what would happen, then abort it. Nothing is committed.
//
// The parent is read over REST (`gh api repos/<repo>/pulls/<n>`). Its branch is usually deleted;
// GitHub keeps `refs/pull/<n>/head`, which is fetched for the tree (the same ref
// `scripts/ship.sh platter revert` fetches). `GH_BIN` overrides the `gh` binary; `STACK_SYNC_REPO`
// overrides the repo (default ejclark/skynet-capital).
//
// Exit 0 = synced, or nothing to do. Exit 1 = refused: a conflict that is not mechanical, a dirty
// tree, on main, or the parent not merged. Exit 2 = could not answer: GitHub unreadable, or git failed.
import { spawnSync } from "node:child_process";
import { isMain } from "./is-main.mjs";

const REPO = process.env.STACK_SYNC_REPO ?? "ejclark/skynet-capital";
const GH = process.env.GH_BIN ?? "gh";

/** Pure: parse argv into options, or an error string. */
export function parseArgs(argv) {
  const opts = { parent: null, push: false, dryRun: false };
  for (const a of argv) {
    if (a === "--push") opts.push = true;
    else if (a === "--dry-run") opts.dryRun = true;
    else if (/^#?\d+$/.test(a) && opts.parent === null) opts.parent = Number(a.replace("#", ""));
    else return { error: `unknown argument: ${a}` };
  }
  if (opts.parent === null) return { error: "missing the parent PR number" };
  if (opts.push && opts.dryRun) return { error: "--push and --dry-run do not mix" };
  return opts;
}

/**
 * Pure: decide each unmerged path. `mainBlob(path)` and `parentBlob(path)` return a blob id, or null
 * when the path is absent there. `oursPresent(path)` says whether the child's side still has the path.
 * Returns `{ resolve: [{path, how: "ours"|"rm"}], differ: [{path, main, parent}] }`.
 */
export function classifyConflicts(paths, mainBlob, parentBlob, oursPresent = () => true) {
  const resolve = [];
  const differ = [];
  for (const path of paths) {
    const main = mainBlob(path);
    const parent = parentBlob(path);
    if (main === parent) resolve.push({ path, how: oursPresent(path) ? "ours" : "rm" });
    else differ.push({ path, main, parent });
  }
  return { resolve, differ };
}

/** Pure: why a differing path is not mechanical, in words. */
export function explainDiffer({ path, main, parent }) {
  if (main === null) return `${path}: main deleted it, but the parent's head still has it`;
  if (parent === null) return `${path}: main has it, but the parent's head never did`;
  return `${path}: main's copy (${main.slice(0, 7)}) is not the parent's final copy (${parent.slice(0, 7)})`;
}

function git(args, opts = {}) {
  return spawnSync("git", args, { encoding: "utf8", ...opts });
}

/** Blob id of `<rev>:<path>`, or null when the path is absent at that rev. */
function blobAt(rev, path) {
  const r = git(["rev-parse", "--verify", "--quiet", `${rev}:${path}`]);
  return r.status === 0 ? r.stdout.trim() : null;
}

class Stop extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

function must(args, what) {
  const r = git(args);
  if (r.status !== 0)
    throw new Stop(2, `${what} failed: git ${args.join(" ")}\n${(r.stderr || r.stdout).trim()}`);
  return r.stdout.trim();
}

function readParent(n) {
  const r = spawnSync(GH, ["api", `repos/${REPO}/pulls/${n}`], { encoding: "utf8" });
  if (r.status !== 0)
    throw new Stop(2, `could not read #${n} from GitHub: ${(r.stderr || "").trim()}`);
  let pr;
  try {
    pr = JSON.parse(r.stdout);
  } catch {
    throw new Stop(2, `GitHub's answer for #${n} was not JSON`);
  }
  if (!pr?.merged) throw new Stop(1, `#${n} is not merged yet; sync after it lands`);
  if (!(pr.merge_commit_sha && pr.head?.sha)) throw new Stop(2, `#${n} has no merge or head sha`);
  return { squash: pr.merge_commit_sha, head: pr.head.sha };
}

function preflight() {
  const branch = git(["symbolic-ref", "--quiet", "--short", "HEAD"]);
  if (branch.status !== 0) throw new Stop(1, "HEAD is detached; check out the child branch first");
  const name = branch.stdout.trim();
  if (name === "main") throw new Stop(1, "on main; run this on the child branch");
  if (git(["rev-parse", "--verify", "--quiet", "MERGE_HEAD"]).status === 0)
    throw new Stop(1, "a merge is already in progress; finish or abort it first");
  const dirty = must(["status", "--porcelain", "--untracked-files=no"], "reading the tree");
  if (dirty) throw new Stop(1, `the working tree has uncommitted changes:\n${dirty}`);
  return name;
}

function unmergedPaths() {
  const out = must(["ls-files", "-u", "-z"], "listing conflicts");
  const stages = new Map();
  for (const entry of out.split("\0").filter(Boolean)) {
    const [meta, path] = entry.split("\t");
    const stage = meta.split(" ")[2];
    if (!stages.has(path)) stages.set(path, new Set());
    stages.get(path).add(stage);
  }
  return stages;
}

export function sync(opts, log = console.log) {
  const branch = preflight();
  const parent = readParent(opts.parent);
  must(
    ["fetch", "--quiet", "origin", `refs/pull/${opts.parent}/head`],
    "fetching the parent's head",
  );
  if (git(["cat-file", "-e", `${parent.head}^{commit}`]).status !== 0)
    throw new Stop(
      2,
      `the parent's head ${parent.head} is not here even after fetching refs/pull/${opts.parent}/head`,
    );
  must(["fetch", "--quiet", "origin", "main"], "fetching main");
  const main = must(["rev-parse", "FETCH_HEAD"], "reading main");
  if (git(["merge-base", "--is-ancestor", parent.squash, main]).status !== 0)
    throw new Stop(
      1,
      `main (${main.slice(0, 7)}) does not contain #${opts.parent}'s squash ${parent.squash.slice(0, 7)}`,
    );
  if (git(["merge-base", "--is-ancestor", main, "HEAD"]).status === 0) {
    log(`stack-sync: ${branch} already contains main (${main.slice(0, 7)}); nothing to do`);
    return 0;
  }

  const merge = git(["merge", "--no-commit", "--no-ff", "-X", "no-renames", main]);
  const conflicts = unmergedPaths();
  if (merge.status !== 0 && conflicts.size === 0) {
    git(["merge", "--abort"]);
    throw new Stop(2, `git merge failed: ${(merge.stderr || merge.stdout).trim()}`);
  }

  const { resolve, differ } = classifyConflicts(
    [...conflicts.keys()],
    (p) => blobAt(main, p),
    (p) => blobAt(parent.head, p),
    (p) => conflicts.get(p).has("2"),
  );

  if (differ.length > 0) {
    git(["merge", "--abort"]);
    log(
      `stack-sync: NOT mechanical. main changed ${differ.length} path(s) after #${opts.parent}'s head:`,
    );
    for (const d of differ) log(`  ${explainDiffer(d)}`);
    log("The merge is aborted. Merge origin/main by hand and read these paths.");
    return 1;
  }

  const summary =
    conflicts.size === 0
      ? `merges main (${main.slice(0, 7)}) cleanly`
      : `merges main (${main.slice(0, 7)}) with ${conflicts.size} conflict(s), each main's copy equal to #${opts.parent}'s final head, resolved to ${branch}'s side`;
  for (const r of resolve) log(`  ${r.how === "rm" ? "keep deletion" : "keep ours"}: ${r.path}`);

  if (opts.dryRun) {
    git(["merge", "--abort"]);
    log(`stack-sync (dry run): ${summary}. Aborted; nothing committed.`);
    return 0;
  }

  for (const r of resolve) {
    if (r.how === "ours") {
      must(["checkout", "--ours", "--", r.path], `keeping ours for ${r.path}`);
      must(["add", "--", r.path], `staging ${r.path}`);
    } else must(["rm", "--quiet", "--", r.path], `keeping the deletion of ${r.path}`);
  }
  must(["commit", "--no-edit", "--quiet"], "committing the merge");
  log(
    `stack-sync: ${summary}. Committed ${must(["rev-parse", "--short", "HEAD"], "reading HEAD")}.`,
  );

  if (opts.push) {
    log(
      "stack-sync: pushing with --no-verify (skips the pre-push local verify; CI runs the suite)",
    );
    must(["push", "--no-verify", "origin", `HEAD:refs/heads/${branch}`], "pushing");
    log(`stack-sync: pushed ${branch}`);
  }
  return 0;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.error) {
    console.error(
      `stack-sync: ${opts.error}\nusage: node scripts/stack-sync.mjs <parent-pr> [--push] [--dry-run]`,
    );
    process.exit(1);
  }
  try {
    process.exit(sync(opts));
  } catch (e) {
    if (e instanceof Stop) {
      console.error(`stack-sync: ${e.message}`);
      process.exit(e.code);
    }
    console.error(`stack-sync: ${e?.stack ?? e}`);
    process.exit(2);
  }
}

if (isMain(import.meta.url)) main();
