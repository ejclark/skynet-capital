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
 * THE WINDOW IS THE ONE THING TO GET RIGHT. This poll fires on an `/api/wire` request, so "since the
 * last poll" means "since a member last looked" — which could be a week. Anything that falls out of
 * the window before it reaches the bus is gone from the league's record for good, which is exactly
 * what this kind exists to prevent. Hence `BACKFILL_PAGES`: the first read of each boot walks back
 * three pages and later reads take one, so a permanent hole needs both no deploy and no page load
 * across ~300 closed pull requests.
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

/** A FAILED read is cached too, for a shorter minute. Without this the TTL above would never
 *  short-circuit during an outage — a revoked token or a secondary rate limit would make every
 *  single `/api/wire` render re-ask GitHub, so the app would hammer hardest exactly when GitHub is
 *  least able to answer. A minute is short enough that a blip costs at most one stale render. */
const FAILURE_TTL_MS = 60_000;

/** GitHub's own maximum page size. Closed-unmerged pull requests share these slots with merged ones,
 *  so the window is narrower than it looks. */
const PULLS_PER_PAGE = 100;

/**
 * How many pages the FIRST read of a process walks, and why it is more than one. A steady-state poll
 * only has to be wide enough to catch what merged since the last one — but this poll fires on an
 * `/api/wire` request, so "since the last one" is "since a member last looked", which could be a week.
 * Anything that falls out of the window before it reaches the bus is lost from the league's record
 * for good, which is the one thing this kind exists to prevent.
 *
 * So the first read of each boot walks back three pages, and every later read takes one. That makes a
 * permanent hole require BOTH no deploy and no page load for ~300 closed pull requests — where one
 * page alone would lose history after a quiet week. The cost is two extra GETs once per process.
 */
const BACKFILL_PAGES = 3;

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
  const pageUrl = (page: number): string =>
    `https://api.github.com/repos/${config.repo}/pulls` +
    `?state=closed&sort=updated&direction=desc&per_page=${PULLS_PER_PAGE}&page=${page}`;
  let cached:
    | {
        readonly merges: readonly MergedPullRequestInfo[];
        readonly at: number;
        /** False when this entry is a remembered FAILURE — it expires sooner (see `FAILURE_TTL_MS`). */
        readonly ok: boolean;
      }
    | undefined;

  /** One page, or undefined when GitHub did not answer with a list — which is what stops the walk
   *  below rather than letting a 403 on page 2 read as "no older merges exist". `size` is the RAW
   *  entry count, not the merged one: a page can be all closed-unmerged pull requests and still have
   *  older pages behind it, so only a short page proves the end. */
  const readPage = async (
    page: number,
  ): Promise<{ merges: MergedPullRequestInfo[]; size: number } | undefined> => {
    const res = await doFetch("GET", pageUrl(page), githubHeaders(config.token));
    if (res.status !== 200 || !Array.isArray(res.body)) return undefined;
    return {
      merges: res.body
        .map(mergeFromPull)
        .filter((merge): merge is MergedPullRequestInfo => merge !== null),
      size: res.body.length,
    };
  };

  return async () => {
    const now = Date.now();
    const ttl = cached?.ok === false ? FAILURE_TTL_MS : CACHE_TTL_MS;
    if (cached && now - cached.at <= ttl) return cached.merges;
    // Only the first successful read of a process walks back; after that the window only has to
    // cover what merged since the last poll.
    const pages = cached?.ok ? 1 : BACKFILL_PAGES;
    try {
      const merges: MergedPullRequestInfo[] = [];
      for (let page = 1; page <= pages; page++) {
        const read = await readPage(page);
        // A failed FIRST page is a failed read; a failed or short later page just ends the walk with
        // what it has, which is strictly more than one page would have given.
        if (!read) {
          if (page === 1) {
            cached = { merges: cached?.merges ?? [], at: now, ok: false };
            return cached.merges;
          }
          break;
        }
        merges.push(...read.merges);
        if (read.size < PULLS_PER_PAGE) break;
      }
      cached = { merges, at: now, ok: true };
      return merges;
    } catch {
      // A GitHub blip keeps the last good answer (or none) and is remembered briefly, so an outage
      // cannot turn every render into another call — never an error page, and never an empty list
      // that would read as "nothing has shipped".
      cached = { merges: cached?.merges ?? [], at: now, ok: false };
      return cached.merges;
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
