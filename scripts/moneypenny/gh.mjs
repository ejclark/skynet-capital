// THE SHELL WRAPPER — every Moneypenny module that shells out to `gh`/`git`/`curl` goes through
// this one call, so every caller gets the same encoding/stdio behaviour and there's one place to
// change it. Split out of moneypenny.mjs (formerly postmaster.mjs; 2026-08-26, the noExcessiveLinesPerFile split).
import { execFileSync } from "node:child_process";

// maxBuffer: execFileSync's 1 MB default is smaller than one page of 100 PRs with bodies, so any
// full-page read died with ENOBUFS — latency-scan crashed on it (#4056's L9 study) and the delivery
// scorer hit it on its first page. 64 MB is ~60 such pages; a caller can still pass its own.
export const sh = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, { encoding: "utf8", stdio: "pipe", maxBuffer: 64 << 20, ...opts }).trim();

/**
 * Is this `gh`/network failure the kind a second try fixes? GitHub's own 5xx (2026-09-05: one
 * `HTTP 504: Gateway Timeout` from graphql killed a whole Moneypenny route run and dispatched a
 * repair session for it), a reset or a timeout — never a 4xx, which a retry only repeats.
 *
 * #4675: GraphQL's own internal error carries NO status text. `gh project item-edit` died on
 * `GraphQL: Something went wrong while executing your query on <ts>. Please include `<id>` when
 * reporting this issue.` — GitHub's server-side fault, one red among ~40 green runs of the same
 * job that evening — and got exactly one attempt because nothing here said "5xx". Matched on
 * GitHub's fixed wording, which no 4xx or validation error uses.
 */
const TRANSIENT_GH_ERROR =
  /HTTP 5\d\d|Gateway Timeout|Bad Gateway|Service Unavailable|ECONNRESET|ETIMEDOUT|EAI_AGAIN|Something went wrong while executing your query/i;

export const isTransientGhError = (text) => TRANSIENT_GH_ERROR.test(String(text ?? ""));

/**
 * Block this thread for `ms`. Exported because `withRetry` is not the only thing in this router
 * that has to wait out GitHub: `resolveBoardItem` re-reads a Projects board that is briefly stale
 * (#3979), and a second sleep implementation next door would be one more thing to keep in step.
 */
export const sleepSync = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

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

/**
 * The GraphQL budget GitHub will actually enforce — asked of GraphQL itself, not of REST's mirror.
 *
 * #4213: `GET /rate_limit`'s `resources.graphql` node LAGS the real budget, silently and by a lot.
 * Measured against one token seconds apart on 2026-09-30:
 *
 *   gh api graphql -f query='{rateLimit{used remaining resetAt}}'  →  used 8, remaining 4992
 *   gh api rate_limit --jq .resources.graphql                      →  used 1, remaining 4999
 *
 * The stale half is the number `sync project status` printed while GitHub was refusing its every
 * call: "this token's hourly GraphQL budget is spent … GitHub reports 4998 point(s) left" — a
 * sentence that contradicts itself because its two halves came from two different sources. Reading
 * a budget that cannot move is worse than reading none: it makes an unfalsifiable diagnosis.
 *
 * STILL FREE. GitHub documents the `rateLimit` field as not counting against the limit, and three
 * consecutive reads left `used` pinned at 8 — so the pre-flight #4183 built on "the budget read
 * costs nothing" keeps that property, it just reads a number that is true.
 *
 * Returns `{limit, remaining, reset}` with `reset` in epoch SECONDS, matching REST's shape so
 * callers need no second branch — or `{}` when the read failed or came back a shape we do not
 * recognise. A budget probe must never become a second way to fail.
 */
export function ghGraphqlBudget({ run = sh } = {}) {
  try {
    const node = JSON.parse(
      run("gh", [
        "api",
        "graphql",
        "-f",
        "query=query{rateLimit{limit remaining resetAt}}",
        "--jq",
        ".data.rateLimit",
      ]) || "null",
    );
    if (typeof node?.remaining !== "number") return {};
    const reset = Date.parse(node.resetAt ?? "");
    return {
      limit: node.limit,
      remaining: node.remaining,
      ...(Number.isFinite(reset) ? { reset: Math.floor(reset / 1000) } : {}),
    };
  } catch {
    return {};
  }
}

/**
 * What is left in each API bucket — and the one GitHub read that is FREE.
 *
 * `GET /rate_limit` is documented as not counting against any limit, and that is exactly what makes
 * a pre-flight check worth doing: asking "does this sweep fit in the hour?" costs nothing, where
 * failing into the answer costs the whole hour for every other consumer of the same token (#4183 —
 * see projects.mjs's `RATE_LIMIT_EXHAUSTED` block for the incident). docs/LESSONS.md's 2026-08-26
 * entry banked this exact question as a side quest ("does GitHub expose remaining GraphQL quota
 * cheaply enough to skip the sweep pre-emptively rather than fail into it?"); it does.
 *
 * Returns GitHub's own `resources` map — `{core, graphql, …}`, each `{limit, remaining, reset}` with
 * `reset` an epoch-SECONDS stamp. `{}` when the payload is not that shape, so the caller's own
 * guard decides what to do about a read that failed rather than crashing on `undefined.remaining`.
 *
 * #4213: the `graphql` entry is OVERLAID from `ghGraphqlBudget`, because REST's own is stale — see
 * that function. REST still answers for `core` and the rest, which it reports correctly. And the
 * REST read is allowed to fail softly here: every caller runs this INSIDE an error handler, where a
 * throwing probe would replace the failure being diagnosed with its own.
 */
export function ghRateLimit({ readRest = ghRest, readGraphql = ghGraphqlBudget, ...opts } = {}) {
  let resources = {};
  try {
    resources = readRest("https://api.github.com/rate_limit", opts)?.resources ?? {};
  } catch {
    resources = {};
  }
  const graphql = readGraphql();
  return typeof graphql.remaining === "number" ? { ...resources, graphql } : resources;
}

/**
 * Every page of a REST list, not just the first — the truncation half of #2968.
 *
 * `ghRest("issues?state=open&per_page=100")` is a FIRST PAGE, and nothing said so. The open-issue
 * read it fed is what `routeSweep` dedupes receipt issues against, so once the open-issue count
 * passed 100 the dedupe went partially blind: it stopped seeing the older half of the queue and
 * re-opened receipts that were already open. `[event-research] fomc-blackout-start-2027-07-17` has
 * six open copies (#2604/#2648/#2700/#2751/#2818) and
 * `[event-research] opex-2028-01-21` five — every one of them filed on 2026-09-09, the day the
 * calendar self-feed pushed the open queue past that page boundary. The dedupe was never wrong; it
 * was answering about a list it could not see the end of.
 *
 * LOUD ON THE CEILING, never a silent stop. Running out of pages mid-list is the same class of bug
 * as the one this fixes, so `maxPages` throws rather than returning what it happened to collect —
 * `gatherDeps`'s fail-closed doctrine, applied to pagination.
 */
export function ghRestAll(path, { perPage = 100, maxPages = 20, ...opts } = {}) {
  const sep = path.includes("?") ? "&" : "?";
  const all = [];
  for (let page = 1; page <= maxPages; page++) {
    const batch = ghRest(`${path}${sep}per_page=${perPage}&page=${page}`, opts);
    if (!Array.isArray(batch)) throw new Error(`ghRestAll: ${path} did not return a list.`);
    all.push(...batch);
    if (batch.length < perPage) return all;
  }
  throw new Error(
    `ghRestAll: ${path} still had more after ${maxPages} pages (${all.length} rows). Refusing to ` +
      "return a truncated list — that silent half-answer is the bug this function exists to kill.",
  );
}
