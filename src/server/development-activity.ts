/**
 * WHAT THE LEAGUE BUILT (#784 slice 4) — the merged-pull-request read behind Activity's third kind.
 * Trades and filed ideas reached the feed in slices 1 and 2; this is the third thing #784's original
 * notes asked for and nothing ever emitted (Eric, 2026-08-28: "all activity for skynet capital —
 * transactions, feedback, development").
 *
 * A POLL, NOT A WEBHOOK, AND THAT WAS A FINDING. The plan assumed this would ride "the same GitHub
 * webhook infra already wired for Moneypenny's PR-activity subscriptions" and left a build session to
 * confirm it. Nothing in this app receives an inbound GitHub webhook — Moneypenny's PR subscriptions
 * are workflow triggers inside GitHub Actions, which never reach this process. What this app already
 * does three times over is READ GitHub on the token it holds for feedback (`feedback-status.ts`,
 * `work-status.ts`, `ops-status-deploy-lag.ts`), so this is a fourth read in that shape: no new
 * credential, no new inbound surface to secure, and nothing to receive if a delivery is missed.
 *
 * NO AUTHOR FILTER, DELIBERATELY. `work-status.ts` drops thread text from anyone without a stake in
 * this public repo, because that text reaches a MODEL where it could read as instructions. A merged
 * PR's title reaches a browser as an escaped string, and merging is itself the gate: only write
 * access can merge, so every title here is text this project accepted. Filtering further would drop
 * a real merge off the league's record to answer a risk the merge already answered.
 *
 * Read-only forever, and degrades to "nothing new" rather than an error: a failed poll leaves the
 * feed showing whatever the bus already holds, which is the durable record either way.
 */
import { fetchJson } from "../http/fetch-json.js";
import type { MergedPullRequestInfo } from "../observatory/activity-event.js";
import { githubHeaders } from "./github-api.js";

type DoFetch = typeof fetchJson;

export type FetchMergedPullRequests = () => Promise<readonly MergedPullRequestInfo[]>;

export interface DevelopmentActivityConfig {
  readonly token: string;
  /** `owner/repo`, e.g. `ejclark/skynet-capital`. */
  readonly repo: string;
}

/** The same five minutes `feedback-status.ts` caches an issue's state for. A merge is not news that
 *  decays in seconds, and `/api/wire` is a `no-store` page that can render on every focus. */
const CACHE_TTL_MS = 5 * 60_000;

/** How many recently-updated closed PRs one poll reads. Bounded on purpose: the BUS is what
 *  accumulates the record, so the window only has to be wide enough that nothing merged between two
 *  polls slips past it — not wide enough to hold history. */
const PULLS_SCANNED = 50;

/** One GitHub list entry → one merge, or null. Null is the expected answer for a closed-unmerged PR
 *  and for anything whose payload can't honestly yield a row: no title or URL means a feed row that
 *  cannot say what it is about, which is worse than one fewer row (`trade-event-feed.ts`'s rule). */
function mergeFromPull(entry: unknown): MergedPullRequestInfo | null {
  if (!entry || typeof entry !== "object") return null;
  const pull = entry as {
    number?: unknown;
    title?: unknown;
    html_url?: unknown;
    merged_at?: unknown;
    user?: { login?: unknown } | null;
  };
  // `merged_at` is null for a PR closed without merging — the one field that separates "we shipped
  // this" from "we decided against it", and the feed may never conflate them.
  if (typeof pull.merged_at !== "string" || !pull.merged_at) return null;
  if (typeof pull.number !== "number" || !Number.isInteger(pull.number) || pull.number <= 0) {
    return null;
  }
  if (typeof pull.title !== "string" || !pull.title) return null;
  if (typeof pull.html_url !== "string" || !pull.html_url) return null;
  const author = typeof pull.user?.login === "string" ? pull.user.login : undefined;
  return {
    number: pull.number,
    title: pull.title,
    ...(author ? { author } : {}),
    url: pull.html_url,
    mergedAt: pull.merged_at,
  };
}

/** Build the bound reader, with its own private cache. `doFetch` is injectable so specs never touch
 *  the network — the same discipline as `createStatusFetcher` and `createWorkStatusReader`. */
export function createMergedPullRequestFetcher(
  config: DevelopmentActivityConfig,
  doFetch: DoFetch = fetchJson,
): FetchMergedPullRequests {
  const url =
    `https://api.github.com/repos/${config.repo}/pulls` +
    `?state=closed&sort=updated&direction=desc&per_page=${PULLS_SCANNED}`;
  let cached:
    | { readonly merges: readonly MergedPullRequestInfo[]; readonly at: number }
    | undefined;
  return async () => {
    const now = Date.now();
    if (cached && now - cached.at <= CACHE_TTL_MS) return cached.merges;
    try {
      const res = await doFetch("GET", url, githubHeaders(config.token));
      if (res.status !== 200 || !Array.isArray(res.body)) return cached?.merges ?? [];
      const merges = res.body
        .map(mergeFromPull)
        .filter((merge): merge is MergedPullRequestInfo => merge !== null);
      cached = { merges, at: now };
      return merges;
    } catch {
      // A GitHub blip keeps the last good answer (or none) and retries next request — never an
      // error page, and never an empty list that would read as "nothing has shipped".
      return cached?.merges ?? [];
    }
  };
}

/** Env factory — `undefined` (inert) until `SKYNET_FEEDBACK_GITHUB_TOKEN` is set, the same token and
 *  repo default `resolveFeedbackStatus`/`resolveWorkStatus`/`resolveDeployLagFetcher` already
 *  resolve. Absent, the feed says the development read is off rather than implying nothing merged. */
export function resolveDevelopmentActivity(
  env: Readonly<Record<string, string | undefined>>,
): FetchMergedPullRequests | undefined {
  const token = env.SKYNET_FEEDBACK_GITHUB_TOKEN;
  if (!token) return undefined;
  const repo = env.SKYNET_FEEDBACK_REPO ?? "ejclark/skynet-capital";
  return createMergedPullRequestFetcher({ token, repo });
}
