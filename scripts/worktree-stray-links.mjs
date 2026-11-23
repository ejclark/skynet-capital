#!/usr/bin/env node
// Strip the symbolic links inside a worktree's copy of an install that point OUT of the worktree
// (#7339). scripts/worktree-setup.sh clones the primary checkout's node_modules link-for-link, so a
// stray link in the primary's install travels into every worktree. On 2026-11-10 an agent left
// `app/node_modules/node_modules` as an absolute link to its own parent; each new worktree's copy
// then pointed back at the PRIMARY's React, two Reacts loaded, and every app spec failed with
// "Invalid hook call" until three agents each deleted it by hand.
//
//   node scripts/worktree-stray-links.mjs <copied node_modules dir> <worktree root>
//
// Removes each link whose target, resolved against the link's own directory, lands outside the
// worktree root, and prints one line per link removed: `<path inside the copy> -> <target>`. Only
// the link is removed (never its target, never anything in the primary): with a hard-link copy the
// link's name in the worktree is its own, so unlinking it leaves the primary's name alone. Exit 0
// always on success; 2 = bad arguments.
//
// Resolution is lexical (no realpath): a link is judged by where it points, not by whether the
// target exists yet — a relative link into `app/node_modules` is read before the copy is moved into
// place. Walks real directories only; a link to a directory is judged, never followed.

import { lstatSync, readdirSync, readlinkSync, unlinkSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { isMain } from "./is-main.mjs";

/** True when `target` (absolute) is `root` itself or lies beneath it. */
function inside(root, target) {
  const rel = relative(root, target);
  return rel === "" || !(rel.startsWith("..") || isAbsolute(rel));
}

/** Every symbolic link under `dir` (not following links) whose target resolves outside `root`. */
export function strayLinks(dir, root) {
  const out = [];
  const absRoot = resolve(root);
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isSymbolicLink()) {
        const target = readlinkSync(p);
        if (!inside(absRoot, resolve(dirname(p), target))) out.push({ link: p, target });
      } else if (e.isDirectory()) walk(p);
    }
  };
  if (lstatSync(dir).isDirectory()) walk(resolve(dir));
  return out;
}

if (isMain(import.meta.url)) {
  const [dir, root] = process.argv.slice(2);
  if (!(dir && root)) {
    console.error(
      "usage: node scripts/worktree-stray-links.mjs <node_modules dir> <worktree root>",
    );
    process.exit(2);
  }
  for (const { link, target } of strayLinks(dir, root)) {
    unlinkSync(link);
    console.log(`${relative(resolve(dir), link)} -> ${target}`);
  }
}
