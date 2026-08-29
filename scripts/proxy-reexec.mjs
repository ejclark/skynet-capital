/**
 * MAKE `fetch` HONOUR `HTTPS_PROXY` — one line at the top of every script that talks to a network.
 *
 * WHY THIS EXISTS (2026-08-29). Node's global `fetch` ignores `HTTPS_PROXY`. Behind an agent proxy
 * — which is where these sessions run — every `fetch` therefore fails, and each caller's own
 * degrade path turns that into something reassuring:
 *
 *   $ node scripts/incident-scan.mjs
 *   incident-scan: could not reach GitHub (GitHub API 401) — skipping (offline no-op). ✓ exit 0
 *
 * That is the Learning Coach's own gate reporting success because it could not see its subject.
 * With the proxy honoured, the same command reads 46 runs and answers the question it was built
 * to answer. A scan that cannot reach its subject and exits 0 is worse than one that errors: the
 * error gets fixed, the green gets trusted.
 *
 * `issue-lint-audit.mjs` had already found and solved this, inline, twice. Promoting it here means
 * the next script that fetches gets the fix by importing rather than by rediscovering the outage.
 *
 * WHY A RE-EXEC and not an agent: `NODE_USE_ENV_PROXY` is read once at startup, before user code
 * runs, so it cannot be set from inside the process that needs it. Re-running ourselves with the
 * flag set is the supported way. The child inherits stdio, so output and exit status pass through
 * unchanged and callers cannot tell the difference.
 */
import { spawnSync } from "node:child_process";

/**
 * Re-run this script with proxy-aware `fetch` when there is a proxy and we are not already the
 * re-executed child. Call it as the FIRST statement of `main()`, before any network call.
 *
 * A no-op when `HTTPS_PROXY` is unset (CI, a developer's laptop), so the common path costs one
 * environment read and spawns nothing.
 */
export function reexecWithProxy() {
  if (!process.env.HTTPS_PROXY || process.env.NODE_USE_ENV_PROXY) return;
  const result = spawnSync(process.execPath, process.argv.slice(1), {
    env: { ...process.env, NODE_USE_ENV_PROXY: "1", NODE_NO_WARNINGS: "1" },
    stdio: "inherit",
  });
  process.exit(result.status ?? 1);
}
