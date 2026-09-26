// Static import-graph walker for repo scripts — the piece that lets workflow-lint answer "does
// this script need `npm ci` before it can run?" without executing anything. Split out of
// workflow-lint.mjs so it can be unit-tested against a stub filesystem (fixtures), same doctrine as
// the rest of this file: a decision that used to live only in a workflow `run:` block (or in a
// human's head) becomes a pure, specced function instead.
//
// Provenance: #890, same-day follow-up to #889. `arm-auto-merge` ran `node scripts/envelope-scan.mjs
// --check`, which imports `envelope-widening.mjs`, which imports the `typescript` package — a
// devDependency that only exists after `npm ci`. The job had no install step, so the script died
// with ERR_MODULE_NOT_FOUND before printing anything, and the JSON parse downstream failed the job
// outright instead of correctly reporting "this diff touches a protected path, skip." This module
// answers the general question ("does script X reach a package that needs installing?") so the next
// script wired into a workflow job gets the same check for free, not a one-off fix for this file.

const IMPORT_RE = /^\s*import\s+(?:[\s\S]*?\bfrom\s+)?["']([^"']+)["']/gm;

/**
 * Every import specifier reachable from `entryPath` by following its own relative (`./`, `../`)
 * imports, that is neither relative nor a `node:` builtin — i.e. anything that needs `node_modules`
 * to resolve. `read(path) => text` is injectable so specs can hand this a fixture filesystem instead
 * of touching real disk; defaults to `node:fs`'s `readFileSync`. Depth-bounded (these are small repo
 * scripts, not application code) and cycle-safe via `seen`.
 *
 * `onUnreadable(path, error)` is how a caller learns the answer is incomplete: an unreadable file
 * contributes no imports (never a false "needs deps" alarm), but it is named, never swallowed.
 */
export function bareImportsOf(
  entryPath,
  read,
  resolvePath,
  depth = 8,
  seen = new Set(),
  onUnreadable = undefined,
) {
  if (depth < 0 || seen.has(entryPath)) return new Set();
  seen.add(entryPath);

  let text;
  try {
    text = read(entryPath);
  } catch (error) {
    // Unreadable (e.g. a path resolved wrong): the graph below it is UNKNOWN, not empty. The set
    // stays free of false alarms; the caller is told, and workflow-lint reports it as UNKNOWN.
    onUnreadable?.(entryPath, error);
    return new Set();
  }

  const bare = new Set();
  for (const m of text.matchAll(IMPORT_RE)) {
    const spec = m[1];
    if (spec.startsWith("node:")) continue;
    if (spec.startsWith(".")) {
      const next = resolvePath(entryPath, spec);
      for (const b of bareImportsOf(next, read, resolvePath, depth - 1, seen, onUnreadable)) {
        bare.add(b);
      }
    } else {
      bare.add(spec);
    }
  }
  return bare;
}

/** True when `entryPath`'s import graph reaches any package outside `node_modules`-free builtins —
 *  i.e. `npm ci` must have run before this script can be required to work. */
export function needsInstalledDeps(entryPath, read, resolvePath, onUnreadable) {
  return bareImportsOf(entryPath, read, resolvePath, 8, new Set(), onUnreadable).size > 0;
}
