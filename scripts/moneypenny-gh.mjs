// THE SHELL WRAPPER — every postmaster module that shells out to `gh`/`git`/`curl` goes through
// this one call, so every caller gets the same encoding/stdio behaviour and there's one place to
// change it. Split out of moneypenny.mjs (formerly postmaster.mjs; 2026-08-26, the noExcessiveLinesPerFile split).
import { execFileSync } from "node:child_process";

export const sh = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, { encoding: "utf8", stdio: "pipe", ...opts }).trim();

/**
 * A GitHub REST read, on the CORE bucket.
 *
 * WHY THIS EXISTS (2026-08-26). `gh <thing> list --json` and `gh <thing> view --json` do not hit
 * REST — they compile to GraphQL, which has a 10,000/hr ceiling against REST's 15,000, and is the
 * bucket the GitHub MCP also spends. The postmaster rides EVERY push to main, and its dependency
 * gather made one GraphQL call per open issue and one per referenced PR on top of two list calls.
 * During a burn-down that is thousands an hour, and on 2026-08-26 it exhausted the bucket outright:
 * `route` began dying on `API rate limit already exceeded for user ID 3472134` before it could
 * reach the research or feedback jobs at all. The tick that drives the whole lane stopped, silently
 * as far as anything except the run list was concerned.
 *
 * REST is the plentiful bucket and `ship.sh` already says so in its own header ("never the scarce
 * GraphQL bucket that the GitHub MCP spends by the thousands"). This is that rule, available to
 * the postmaster.
 *
 * CURL, NOT `fetch`. `gatherDeps` is synchronous, so a `fetch` would push async through its whole
 * call chain for no gain; and Node's global fetch ignores `HTTPS_PROXY`, which breaks local runs
 * behind an agent proxy. `sh("curl", …)` is what `moneypenny-labels.mjs` already uses.
 *
 * `--fail` IS LOAD-BEARING. Without it curl exits 0 on a 404 and hands back an error body that
 * `JSON.parse` turns into an object with none of the fields the caller wanted — a silent empty
 * result, which is the exact failure `gatherDeps` is written to be loud about. Same lesson as
 * `ensureLabel` (docs/LESSONS.md, 2026-08-19).
 */
export function ghRest(path, { token = process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN } = {}) {
  const repo = process.env.GITHUB_REPOSITORY ?? "ejclark/skynet-capital";
  const url = path.startsWith("http")
    ? path
    : `https://api.github.com/repos/${repo}/${path.replace(/^\//, "")}`;
  const out = sh("curl", [
    "-sS",
    "--fail",
    "-H",
    `Authorization: Bearer ${token ?? ""}`,
    "-H",
    "Accept: application/vnd.github+json",
    "-H",
    "User-Agent: skynet-postmaster",
    url,
  ]);
  return JSON.parse(out || "null");
}
