#!/usr/bin/env node
// Does an existing install satisfy a lockfile? The guard behind scripts/worktree-setup.sh sharing
// the primary checkout's node_modules with a worktree (#5548): reuse is safe only when the install
// on disk is exactly what this worktree's package-lock.json would produce.
//
//   node scripts/worktree-lock-match.mjs <package-lock.json> <node_modules dir>
//
// Exit 0 = match, 1 = drift (the first differences are printed), 2 = can't tell (a file is missing
// or unreadable). npm writes `node_modules/.package-lock.json` (the "hidden lockfile") after every
// install: it lists what is really on disk, so it is compared with the lock rather than trusting
// that the primary's package-lock.json is the file its install came from — a primary on a stale
// branch has a lock that says nothing about its modules.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The differences between a lockfile and the hidden lockfile of an install, as readable lines.
 * Empty = the install is what the lock describes. Two directions:
 *  - installed but absent from the lock, or at another version / tarball / integrity;
 *  - in the lock but not installed — fine only for an optional entry (npm skips the other
 *    platforms' native binaries), so a missing required package is drift.
 */
export function lockDrift(lock, installed) {
  const want = lock?.packages ?? {};
  const have = installed?.packages ?? {};
  const out = [];
  for (const [key, got] of Object.entries(have)) {
    if (key === "") continue;
    const w = want[key];
    if (!w) out.push(`${key} is installed but not in the lock`);
    else if (w.version !== got.version)
      out.push(`${key} ${got.version} installed, lock wants ${w.version}`);
    else if (w.resolved && got.resolved && w.resolved !== got.resolved)
      out.push(`${key} resolves elsewhere`);
    else if (w.integrity && got.integrity && w.integrity !== got.integrity)
      out.push(`${key} integrity differs`);
  }
  for (const [key, w] of Object.entries(want)) {
    if (key === "" || w.link || have[key] || w.optional || w.devOptional) continue;
    out.push(`${key} ${w.version} is in the lock but not installed`);
  }
  return out;
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [lockPath, modules] = process.argv.slice(2);
  if (!(lockPath && modules)) {
    console.error(
      "usage: node scripts/worktree-lock-match.mjs <package-lock.json> <node_modules dir>",
    );
    process.exit(2);
  }
  const hidden = join(modules, ".package-lock.json");
  const lock = existsSync(lockPath) ? readJson(lockPath) : null;
  const installed = existsSync(hidden) ? readJson(hidden) : null;
  if (!(lock && installed)) {
    console.log(`cannot compare ${lock ? hidden : lockPath} (missing or unreadable)`);
    process.exit(2);
  }
  const drift = lockDrift(lock, installed);
  for (const line of drift.slice(0, 3)) console.log(line);
  if (drift.length > 3) console.log(`…and ${drift.length - 3} more`);
  process.exit(drift.length > 0 ? 1 : 0);
}
