/**
 * Live status for a member's own filed feedback — the follow-up feedback-log.ts flagged and
 * deferred: "no GitHub state fetch, no received/being-worked/shipped detection... real remaining
 * work for a later slice, not attempted here." This is that slice (Eric, 2026-08-25): fold each
 * issue's current state + triage label into the same four-outcome vocabulary docs/FEEDBACK.md
 * already defines, so "Your recent feedback" can show more than a bare link.
 *
 * GitHub is the source of truth and stays external to this app, so there is nothing here to lose
 * on a redeploy — the feedback log itself (which issue numbers a member filed) already lives on
 * the mounted volume (`SKYNET_FEEDBACK_LOG_DIR`, pinned in #560). The in-memory cache below is a
 * request-latency optimization only: a cold cache after a restart just means the next `/feedback`
 * load re-fetches from GitHub, never a loss of the underlying record.
 */
import { fetchJson } from "../http/fetch-json.js";

type DoFetch = typeof fetchJson;

export type FeedbackStatus = "open" | "needs-info" | "needs-eric" | "next-slice" | "shipped";

export const FEEDBACK_STATUS_LABEL: Record<FeedbackStatus, string> = {
  open: "In the queue",
  "needs-info": "Needs your input",
  "needs-eric": "Needs Eric's call",
  "next-slice": "First slice shipped",
  shipped: "Shipped",
};

export interface FeedbackStatusConfig {
  readonly token: string;
  readonly repo: string;
}

export type FetchFeedbackStatuses = (
  issueNumbers: readonly number[],
) => Promise<ReadonlyMap<number, FeedbackStatus>>;

const CACHE_TTL_MS = 5 * 60_000;

/** Folds a GitHub issue's `state` + labels into the app's own status vocabulary — same mapping
 *  docs/FEEDBACK.md's "four ways a build session ends" table already defines. A closed issue reads
 *  as shipped: the lane never closes one any other way (docs/FEEDBACK.md, "the four ways"). */
function statusFromIssue(state: string, labelNames: readonly string[]): FeedbackStatus {
  if (state === "closed") return "shipped";
  if (labelNames.includes("needs-eric")) return "needs-eric";
  if (labelNames.includes("needs-info")) return "needs-info";
  if (labelNames.includes("next-slice")) return "next-slice";
  return "open";
}

function labelNamesOf(body: unknown): readonly string[] {
  const raw = (body as { labels?: unknown } | null)?.labels;
  if (!Array.isArray(raw)) return [];
  return raw.map((l) => (typeof l === "string" ? l : ((l as { name?: string })?.name ?? "")));
}

/** Build the bound status fetcher, with its own private cache. Live path (uses global fetch);
 *  `doFetch` is injectable so tests never hit the network, same discipline as
 *  `uploadFeedbackImages` in feedback-images.ts. */
export function createStatusFetcher(
  config: FeedbackStatusConfig,
  doFetch: DoFetch = fetchJson,
): FetchFeedbackStatuses {
  const cache = new Map<number, { readonly status: FeedbackStatus; readonly at: number }>();
  return async (issueNumbers) => {
    const now = Date.now();
    const stale = [...new Set(issueNumbers)].filter((n) => {
      const hit = cache.get(n);
      return !hit || now - hit.at > CACHE_TTL_MS;
    });
    await Promise.all(
      stale.map(async (n) => {
        try {
          const res = await doFetch(
            "GET",
            `https://api.github.com/repos/${config.repo}/issues/${n}`,
            {
              Authorization: `Bearer ${config.token}`,
              "User-Agent": "skynet-capital",
              Accept: "application/vnd.github+json",
            },
          );
          if (res.status !== 200 || !res.body || typeof res.body !== "object") return;
          const state = (res.body as { state?: string }).state ?? "open";
          cache.set(n, { status: statusFromIssue(state, labelNamesOf(res.body)), at: now });
        } catch {
          // Leave this issue uncached — the member sees no badge for it, never an error page.
        }
      }),
    );
    const out = new Map<number, FeedbackStatus>();
    for (const n of issueNumbers) {
      const hit = cache.get(n);
      if (hit) out.set(n, hit.status);
    }
    return out;
  };
}

/** Env factory — `undefined` (inert) until `SKYNET_FEEDBACK_GITHUB_TOKEN` is set, mirroring
 *  `resolveFeedback` in feedback-service.ts (same token, same repo default). */
export function resolveFeedbackStatus(
  env: Readonly<Record<string, string | undefined>>,
): FetchFeedbackStatuses | undefined {
  const token = env.SKYNET_FEEDBACK_GITHUB_TOKEN;
  if (!token) return undefined;
  const repo = env.SKYNET_FEEDBACK_REPO ?? "ejclark/skynet-capital";
  return createStatusFetcher({ token, repo });
}
