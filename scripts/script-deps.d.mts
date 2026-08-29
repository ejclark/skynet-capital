// Type surface for script-deps.mjs — the scripts/ tree is plain ESM with `allowJs` off, so a spec
// that imports from it needs this rather than a repo-wide loosening (same arrangement as
// envelope-scan.d.mts, postmaster.d.mts, ci-medic-logs.d.mts).
/** Every bare (non-relative, non-`node:`) import specifier reachable from `entryPath` by following
 *  its own relative imports. `read`/`resolvePath` are injectable so specs can stub a fixture
 *  filesystem instead of touching real disk. */
export function bareImportsOf(
  entryPath: string,
  read: (path: string) => string,
  resolvePath: (from: string, spec: string) => string,
  depth?: number,
  seen?: Set<string>,
): Set<string>;
/** True when `entryPath`'s import graph reaches any package needing `node_modules`. */
export function needsInstalledDeps(
  entryPath: string,
  read: (path: string) => string,
  resolvePath: (from: string, spec: string) => string,
): boolean;
