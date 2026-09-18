// THE SHELL WRAPPER — every Moneypenny module that shells out to `gh`/`git`/`curl` goes through
// this one call, so every caller gets the same encoding/stdio behaviour and there's one place to
// change it. Split out of moneypenny.mjs (formerly postmaster.mjs; 2026-08-26, the noExcessiveLinesPerFile split).
import { execFileSync } from "node:child_process";

export const sh = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, { encoding: "utf8", stdio: "pipe", ...opts }).trim();

/**
 * Is this `gh`/network failure the kind a second try fixes? GitHub's own 5xx (2026-09-05: one
 * `HTTP 504: Gateway Timeout` from graphql killed a whole Moneypenny route run and dispatched a
 * repair session for it), a reset or a timeout — never a 4xx, which a retry only repeats.
 */
export const isTransientGhError = (text) =>
  /HTTP 5\d\d|Gateway Timeout|Bad Gateway|Service Unavailable|ECONNRESET|ETIMEDOUT|EAI_AGAIN/i.test(
    String(text ?? ""),
  );

const sleepSync = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

/**
 * Run `fn` up to `attempts` times, sleeping `baseMs * 2^n` between tries, retrying only while
 * `isTransient(err)` says the failure is GitHub's, not ours. Synchronous on purpose — every caller
 * in this router is synchronous `execFileSync` code, and a 504 deserves seconds, not a rewrite.
 */
export function withRetry(
  fn,
  { attempts = 3, baseMs = 2000, isTransient = isTransientGhError, sleep = sleepSync } = {},
) {
  let lastErr;
  for (let n = 0; n < attempts; n++) {
    try {
      return fn();
    } catch (err) {
      lastErr = err;
      const text = `${err?.stderr ?? ""} ${err?.message ?? ""}`;
      if (n === attempts - 1 || !isTransient(text)) throw err;
      sleep(baseMs * 2 ** n);
    }
  }
  throw lastErr;
}

/**
 * A GitHub REST read, on the CORE bucket.
 *
 * WHY THIS EXISTS (2026-08-26). `gh <thing> list --json` and `gh <thing> view --json` do not hit
 * REST — they compile to GraphQL, which has a 10,000/hr ceiling against REST's 15,000, and is the
 * bucket the GitHub MCP also spends. Moneypenny rides EVERY push to main, and its dependency
 * gather made one GraphQL call per open issue and one per referenced PR on top of two list calls.
 * During a burn-down that is thousands an hour, and on 2026-08-26 it exhausted the bucket outright:
 * `route` began dying on `API rate limit already exceeded for user ID 3472134` before it could
 * reach the research or feedback jobs at all. The tick that drives the whole lane stopped, silently
 * as far as anything except the run list was concerned.
 *
 * REST is the plentiful bucket and `ship.sh` already says so in its own header ("never the scarce
 * GraphQL bucket that the GitHub MCP spends by the thousands"). This is that rule, available to
 * Moneypenny.
 *
 * CURL, NOT `fetch`. `gatherDeps` is synchronous, so a `fetch` would push async through its whole
 * call chain for no gain; and Node's global fetch ignores `HTTPS_PROXY`, which breaks local runs
 * behind an agent proxy. `sh("curl", …)` is what `labels.mjs` already uses.
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
    "User-Agent: skynet-moneypenny",
    url,
  ]);
  return JSON.parse(out || "null");
}

/** A page size big enough that the common case is one call, and the pagination cap that keeps a
 *  runaway loop from spending the core bucket. 20 pages = 2,000 items; this repo's largest list
 *  (open issues) sat at 403 on 2026-09-18. */
const PAGE_SIZE = 100;
const MAX_PAGES = 20;

/**
 * A GitHub REST read that returns EVERY page, not the first 100.
 *
 * WHY THIS EXISTS (2026-09-18, issue #2970). `gatherDeps` read `issues?state=open&per_page=100`
 * and treated the result as "every open issue" — the set `routeSweep` dedupes new event receipts
 * against, and the set the shipped sweep checks. This repo had 403 open issues, so ~75% of the
 * dedupe key space was invisible: the sweep re-filed receipts it already had open (7 copies of
 * `[event-research] fomc-blackout-start-2027-07-17`, 6 of `opex-2028-01-21`, 3 of
 * `jobs-2027-11-05`) and never noticed the older ones whose work had shipped (199 of 234 distinct
 * event ids had their ledger on disk with the receipt still open). A truncated list read as a
 * complete one — the same "an unreadable dependency must never look like an empty one" class
 * `gatherDeps` is fail-closed about, one step subtler because the list was not empty, just short.
 *
 * LOUD, NEVER TRUNCATED. Hitting `MAX_PAGES` throws rather than returning what it has: a silent
 * cap is the very bug this replaces. Callers must be list reads whose per-item cost is zero —
 * this is the plentiful core bucket, but a per-item GraphQL follow-up across every page is not
 * (see `prIsMerged`'s note on the 2026-08-26 exhaustion).
 *
 * `fetchPage` is injected so the paging arithmetic — the part that was actually wrong — has specs
 * that need no network, the same shape `resolveShipped` uses for its own impure lookups.
 */
export function ghRestAll(path, { fetchPage, ...opts } = {}) {
  const read = fetchPage ?? ((p) => ghRest(p, opts));
  const [route, query = ""] = String(path).split("?");
  const params = new URLSearchParams(query);
  params.set("per_page", String(PAGE_SIZE));
  const items = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    params.set("page", String(page));
    const batch = read(`${route}?${params}`);
    if (!Array.isArray(batch))
      throw new Error(`ghRestAll: ${route} did not return an array on page ${page}.`);
    items.push(...batch);
    if (batch.length < PAGE_SIZE) return items;
  }
  throw new Error(
    `ghRestAll: ${route} still had pages after ${MAX_PAGES} (${items.length} items). Refusing to ` +
      "return a truncated list — a short list that reads as a complete one is the bug this exists " +
      "to prevent (#2970).",
  );
}
