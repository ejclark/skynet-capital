#!/usr/bin/env node
// Sweep finished agent worktrees out of `.claude/worktrees/` (#5548).
//
//   npm run worktree:sweep                 dry run: what would go, what stays, and why
//   npm run worktree:sweep -- --apply      remove the ones that are safe to remove
//   flags: --gh          also ask GitHub whether a branch's PR merged with this exact head (a
//                        squash merge leaves no ancestor of main behind and usually deletes the
//                        remote branch, so without this a squash-merged worktree is "unpushed")
//          --min-age N   minutes a worktree must have sat untouched (default 60)
//          --only X      (repeatable) sweep just the worktree whose directory name or branch is X,
//                        and treat its lock as released: the caller is saying that agent is
//                        finished. Every agent worktree is locked to the harness process that
//                        spawned it, which outlives the agent, so without this a live session could
//                        never sweep its own agents' worktrees. Clean + pushed is still required.
//          --json        the verdicts as JSON
//
// WHY. An isolated agent's worktree cost ~1.2GB before node_modules were shared and ~130MB after;
// ten of them filled a cloud session's disk, and finished ones were only ever removed by hand. A
// session runs this after an agent's PR merges (docs/DELEGATION.md).
//
// WHAT IS SAFE. Removing a worktree deletes its directory and nothing else: the branch and every
// commit on it stay in the repository. So the only things that can be lost are uncommitted work and
// the commits of a detached HEAD. A worktree is removed only when none of these hold:
//   - it is the primary checkout, or the worktree this command runs in
//   - its lock names a live process (a lock with no readable pid is treated as live)
//   - it has uncommitted changes, untracked files included (a new file is work too)
//   - it is younger than --min-age (a workflow worktree is unlocked and starts out clean at main)
//   - its HEAD is in neither origin/main, nor any remote branch, nor merged as a PR (--gh)
// Read the verdict out of `decide`; the rest of this file only gathers its inputs.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, realpathSync, statSync } from "node:fs";
import { basename, join, resolve } from "node:path";

/** `git worktree list --porcelain` -> one record per worktree. */
export function parseWorktrees(porcelain) {
  const out = [];
  for (const block of porcelain.split(/\n\s*\n/)) {
    const lines = block.split("\n").filter(Boolean);
    if (!lines.some((l) => l.startsWith("worktree "))) continue;
    const w = { path: "", head: "", branch: null, detached: false, locked: null, prunable: false };
    const set = {
      worktree: (v) => (w.path = v),
      HEAD: (v) => (w.head = v),
      branch: (v) => (w.branch = v.replace(/^refs\/heads\//, "")),
      detached: () => (w.detached = true),
      locked: (v) => (w.locked = v), // "" = locked without a reason
      prunable: () => (w.prunable = true),
    };
    for (const line of lines) {
      const [key, ...rest] = line.split(" ");
      set[key]?.(rest.join(" "));
    }
    out.push(w);
  }
  return out;
}

/** The pid a lock reason names — `claude agent agent-ab12 (pid 96 start 278)` — or null. */
export function lockPid(reason) {
  const m = /\bpid[ =:]+(\d+)/i.exec(reason ?? "");
  return m ? Number(m[1]) : null;
}

/**
 * Remove this worktree or keep it? One verdict from facts already gathered; no I/O.
 *
 * w: { primary, current, lock: null | { pid: number|null, alive: boolean }, released, dirty: number,
 *      ageMinutes: number|null, inMain, onRemote, patchApplied, mergedPr }
 * returns { remove, unlock, reason, via? } — `unlock` when the lock must come off first.
 * `released` is the caller's word that this agent is finished (--only): it waives the live-lock
 * check for that one worktree and nothing else — dirty, unpushed and fresh still keep it.
 */
export function decide(w, { minAgeMinutes = 60 } = {}) {
  if (w.primary) return { remove: false, unlock: false, reason: "primary checkout" };
  if (w.current) return { remove: false, unlock: false, reason: "the worktree this runs in" };
  const live = w.lock && (w.lock.pid === null || w.lock.alive) && !w.released;
  if (live) {
    const reason =
      w.lock.pid === null ? "locked (no pid to check)" : `live lock (pid ${w.lock.pid})`;
    return { remove: false, unlock: false, reason };
  }
  if (w.dirty > 0) {
    return {
      remove: false,
      unlock: false,
      reason: `dirty (${w.dirty} uncommitted path${w.dirty === 1 ? "" : "s"})`,
    };
  }
  if (w.ageMinutes === null) return { remove: false, unlock: false, reason: "age unknown" };
  if (w.ageMinutes < minAgeMinutes) {
    return { remove: false, unlock: false, reason: "fresh (touched within the grace period)" };
  }
  const unlock = Boolean(w.lock); // only a dead or released lock reaches here
  const via = w.inMain
    ? "in origin/main"
    : w.patchApplied
      ? "applied to origin/main"
      : w.mergedPr
        ? "PR merged at this head"
        : null;
  if (via) return { remove: true, unlock, reason: "merged", via };
  if (w.onRemote) return { remove: true, unlock, reason: "pushed", via: "on a remote branch" };
  return { remove: false, unlock: false, reason: "unpushed (HEAD is in no remote branch)" };
}

// ---- gathering the facts (everything below touches git, the disk or the process table) ----

const git = (cwd, ...args) =>
  execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const gitOk = (cwd, ...args) => {
  try {
    execFileSync("git", args, { cwd, stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
};

function alive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return e.code === "EPERM"; // exists, not ours to signal
  }
}

/** Minutes since the worktree's HEAD, HEAD log or `.git` file last changed; null if unreadable. */
function ageMinutes(path) {
  try {
    const dotGit = join(path, ".git");
    const gitdir = readFileSync(dotGit, "utf8")
      .replace(/^gitdir:\s*/, "")
      .trim();
    const times = [dotGit, join(gitdir, "HEAD"), join(gitdir, "logs", "HEAD")]
      .filter(existsSync)
      .map((p) => statSync(p).mtimeMs);
    return (Date.now() - Math.max(...times)) / 60000;
  } catch {
    return null;
  }
}

/**
 * Disk each worktree adds, in KB. One `du` over the primary's installs first, then every worktree:
 * du counts a hard-linked inode once per run, so a worktree whose node_modules share files with the
 * primary (scripts/worktree-setup.sh) shows only what it adds — what removing it would really free.
 */
function sizesKb(primary, paths) {
  const seeds = [join(primary, "node_modules"), join(primary, "app", "node_modules")].filter(
    existsSync,
  );
  const sizes = new Map();
  try {
    const out = execFileSync("du", ["-sk", ...seeds, ...paths], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    for (const line of out.split("\n")) {
      const [kb, ...p] = line.split("\t");
      if (p.length) sizes.set(p.join("\t"), Number(kb));
    }
  } catch {
    // an unreadable file makes du exit non-zero; the sizes it could read are lost with it
  }
  return sizes;
}

const human = (kb) =>
  kb >= 1048576 ? `${(kb / 1048576).toFixed(1)}G` : `${Math.round(kb / 1024)}M`;

function mergedPrAtHead(branch, head) {
  if (!branch) return false;
  try {
    const out = execFileSync(
      "gh",
      [
        "pr",
        "list",
        "--state",
        "merged",
        "--head",
        branch,
        "--json",
        "headRefOid",
        "--jq",
        ".[].headRefOid",
      ],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    );
    return out.split("\n").includes(head);
  } catch {
    return false; // no gh, no network, no PR: the other signals still stand
  }
}

function facts(primary, here, w, { useGh, hasMain, released }) {
  const path = w.path;
  const lock = w.locked === null ? null : { pid: lockPid(w.locked), alive: false };
  if (lock?.pid != null) lock.alive = alive(lock.pid);
  let dirty;
  try {
    dirty = git(path, "status", "--porcelain").split("\n").filter(Boolean).length;
  } catch {
    dirty = 1; // cannot tell -> do not touch
  }
  const inMain = hasMain && gitOk(primary, "merge-base", "--is-ancestor", w.head, "origin/main");
  let onRemote = false;
  try {
    const refs = git(
      primary,
      "for-each-ref",
      "--contains",
      w.head,
      "--format=%(refname)",
      "refs/remotes",
    );
    onRemote = refs.split("\n").some((r) => r && !r.endsWith("/HEAD"));
  } catch {
    onRemote = false;
  }
  let patchApplied = false;
  if (hasMain && !inMain) {
    try {
      const cherry = git(primary, "cherry", "origin/main", w.head).split("\n").filter(Boolean);
      patchApplied = cherry.length > 0 && cherry.every((l) => l.startsWith("-"));
    } catch {
      patchApplied = false;
    }
  }
  const mergedPr =
    useGh && !inMain && !onRemote && !patchApplied ? mergedPrAtHead(w.branch, w.head) : false;
  return {
    primary: false,
    current: here === path,
    lock,
    released,
    dirty,
    ageMinutes: ageMinutes(path),
    inMain,
    onRemote,
    patchApplied,
    mergedPr,
  };
}

function parseArgs(argv) {
  const value = (flag) => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  return {
    apply: argv.includes("--apply"),
    useGh: argv.includes("--gh"),
    json: argv.includes("--json"),
    only: new Set(argv.flatMap((a, i) => (a === "--only" && argv[i + 1] ? [argv[i + 1]] : []))),
    minAgeMinutes: value("--min-age") === undefined ? 60 : Number(value("--min-age")),
  };
}

/** The checkout this runs in, and the primary checkout that owns `.claude/worktrees/`. */
function locate() {
  const here = realpathSync(git(process.cwd(), "rev-parse", "--show-toplevel").trim());
  const common = git(
    process.cwd(),
    "rev-parse",
    "--path-format=absolute",
    "--git-common-dir",
  ).trim();
  return { here, primary: realpathSync(resolve(common, "..")) };
}

/** Every worktree under `.claude/worktrees/` with its verdict and the disk it holds. */
function judge(primary, here, opts) {
  const hasMain = gitOk(primary, "rev-parse", "--verify", "-q", "refs/remotes/origin/main");
  if (!hasMain) {
    console.error(
      "worktree-sweep: no origin/main here; only remote-branch containment can clear a worktree.",
    );
  }
  const root = join(primary, ".claude", "worktrees");
  const rows = [];
  for (const w of parseWorktrees(git(primary, "worktree", "list", "--porcelain"))) {
    if (w.prunable || !existsSync(w.path)) continue; // the prune after a sweep clears dangling entries
    w.path = realpathSync(w.path);
    if (!w.path.startsWith(`${root}/`)) continue;
    const named = opts.only.has(basename(w.path)) || (w.branch !== null && opts.only.has(w.branch));
    if (opts.only.size > 0 && !named) continue;
    const f = facts(primary, here, w, { useGh: opts.useGh, hasMain, released: named });
    rows.push({ ...w, ...decide(f, { minAgeMinutes: opts.minAgeMinutes }) });
  }
  const sizes = sizesKb(
    primary,
    rows.map((r) => r.path),
  );
  for (const r of rows) r.kb = sizes.get(r.path) ?? 0;
  return rows;
}

/** Remove what `judge` cleared. Returns how many git refused (each row records why). */
function removeAll(primary, rows) {
  let failed = 0;
  for (const r of rows.filter((x) => x.remove)) {
    try {
      if (r.unlock) git(primary, "worktree", "unlock", r.path);
      git(primary, "worktree", "remove", r.path);
      r.removed = true;
    } catch (e) {
      failed++;
      r.removed = false;
      r.error = String(e.stderr || e.message)
        .trim()
        .split("\n")[0];
    }
  }
  git(primary, "worktree", "prune");
  return failed;
}

function report(rows, { apply, failed }) {
  console.log(
    `worktree-sweep (${apply ? "applied" : "dry run"}) — ${rows.length} under .claude/worktrees/`,
  );
  for (const r of rows) {
    const done = r.removed ? "removed" : "FAILED ";
    const verb = r.remove ? (apply ? done : "remove ") : "keep   ";
    const why = r.remove ? `${r.reason} (${r.via})` : r.reason;
    const tail = r.error ? ` — git refused: ${r.error}` : "";
    const name = basename(r.path).padEnd(28);
    const branch = (r.branch ?? "(detached)").padEnd(34);
    console.log(`  ${verb} ${name} ${branch} ${human(r.kb).padStart(6)}  ${why}${tail}`);
  }
  const removable = rows.filter((r) => r.remove);
  const kb = removable.reduce((n, r) => n + r.kb, 0);
  if (apply) console.log(`freed ${human(kb)} across ${removable.length - failed} worktrees`);
  else if (removable.length)
    console.log(
      `would free ${human(kb)} across ${removable.length} worktrees — re-run with --apply`,
    );
  else console.log("nothing to remove.");
}

function main(argv) {
  const opts = parseArgs(argv);
  if (!Number.isFinite(opts.minAgeMinutes) || opts.minAgeMinutes < 0) {
    console.error("worktree-sweep: --min-age takes a number of minutes");
    return 2;
  }
  const { here, primary } = locate();
  if (opts.apply) {
    try {
      git(primary, "fetch", "-q", "--prune", "origin");
    } catch {
      console.error("worktree-sweep: fetch failed — judging by the remote refs already here.");
    }
  }
  const rows = judge(primary, here, opts);
  const failed = opts.apply ? removeAll(primary, rows) : 0;
  if (opts.json) console.log(JSON.stringify(rows, null, 2));
  else report(rows, { apply: opts.apply, failed });
  return failed ? 1 : 0;
}

if (import.meta.url === `file://${process.argv[1]}`) process.exit(main(process.argv.slice(2)));
