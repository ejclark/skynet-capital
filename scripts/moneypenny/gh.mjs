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

/** Hard stop on the page walk. 100 pages × 100 items is far past anything this repo will hold, so
 *  hitting it means a caller is paginating something unbounded — which should be loud, not a
 *  silent infinite loop inside a workflow job. */
const MAX_PAGES = 100;

/**
 * THE SAME REST READ, BUT ALL OF IT.
 *
 * `ghRest` returns one page. Every list caller wrote `per_page=100` and treated the result as the
 * whole set, which was true right up until it wasn't: by 2026-09-18 this repo had 403 open issues,
 * so `gatherDeps`'s receipt-dedupe set covered a quarter of them and the sweep reopened receipts it
 * already had — which grew the open count, which shrank the visible fraction, which produced more
 * duplicates. 108 of the 343 open `[event-research]` receipts were that loop's output.
 *
 * Paginating is cheap here and only here: REST is the plentiful core bucket (5,000/hr), so five
 * pages costs five of it. Do NOT reach for this on a GraphQL path — `gh issue list --json` is
 * scored by COST, and walking pages of nested closing-PR references is exactly the draw that
 * exhausted the GraphQL ceiling on 2026-08-26 and stopped the whole lane.
 *
 * A truncation-safe walk, not a `Link`-header parse: stop on a short page, which is what "no next
 * page" means for every list endpoint this calls.
 */
export function ghRestPaged(path, opts = {}) {
  const perPage = 100;
  const sep = path.includes("?") ? "&" : "?";
  const all = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const batch = ghRest(`${path}${sep}per_page=${perPage}&page=${page}`, opts);
    if (!Array.isArray(batch))
      throw new Error(`ghRestPaged: ${path} page ${page} returned a non-array — refusing to guess`);
    all.push(...batch);
    if (batch.length < perPage) return all;
  }
  throw new Error(`ghRestPaged: ${path} exceeded ${MAX_PAGES} pages — refusing an unbounded walk`);
}
