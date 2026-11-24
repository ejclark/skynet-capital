/**
 * WAS A PLAN'S FIX ACTUALLY BUILT? (#8077) — the "try it" trigger's own reading of a plan issue,
 * deliberately stricter than the Feedback badge's `shipped`.
 *
 * The badge reads any closed issue as shipped unless GitHub says `not_planned` or it still carries
 * `next-slice` (`src/domain/feedback-status.ts`). That is the right word for a member's own filing,
 * which the lane closes only by building it. A PLAN closes other ways too, and two of them left a
 * member reading "Fixed — try it" and Moneypenny saying "its fix has shipped" when nothing had:
 *
 *   - **Closed as a duplicate.** #3527 carries `state_reason: duplicate`; #1211 was closed as a
 *     duplicate of #8008 and then re-closed, so its CURRENT reason reads `completed` and only the
 *     timeline still says duplicate.
 *   - **Closed with a remainder relayed on.** `scripts/moneypenny/relay.mjs` files the unbuilt
 *     remainder as a new issue and takes `next-slice` off the closed plan (#4469 → #6045), so the
 *     label the badge reads is gone and only the relay's receipt comment says the fix is elsewhere.
 *
 * So a plan counts as built only when it is closed `completed`, carries no remainder label, and
 * its timeline since the last reopen shows no duplicate or not-planned close and no relay receipt.
 * The timeline is read only for a plan that passes the cheap check, and everything is cached for
 * the same five minutes as the badges. Anything unreadable leaves the plan unbuilt: a missed
 * "try it" costs a member nothing, a false one tells them something untrue.
 */
import { fetchJson } from "../http/fetch-json.js";
import type { FeedbackStatusConfig } from "./feedback-status.js";
import { labelNamesOf } from "./feedback-status.js";
import { githubHeaders } from "./github-api.js";

type DoFetch = typeof fetchJson;

/** Which of these plans had their fix built. Never rejects for a single plan's failed read. */
export type FetchBuiltPlans = (plans: readonly number[]) => Promise<ReadonlySet<number>>;

/** The labels that mean a remainder is written on the issue and nobody has built it — the same
 *  pair as relay.mjs's `REMAINDER_LABELS`. */
const REMAINDER_LABELS = ["next-slice", "needs-session"];

/** The opening of relay.mjs's `sourceCommentBody`, the receipt it leaves on a closed issue whose
 *  remainder it moved to a new one. tests/server/plan-fix-built.spec.ts pins the two together. */
export const RELAY_RECEIPT = "📨 **Remainder relayed**";

/** Close reasons that say the issue was not built. */
const UNBUILT_REASONS = new Set(["duplicate", "not_planned"]);

const CACHE_TTL_MS = 5 * 60_000;
/** A plan's timeline is read 100 events a page; past this many pages it reads as unknown. */
const MAX_TIMELINE_PAGES = 10;

interface TimelineEvent {
  readonly event?: unknown;
  readonly state_reason?: unknown;
  readonly body?: unknown;
}

/** The cheap half: what the issue itself says, before any timeline is read. */
export function closedAsBuilt(issue: unknown): boolean {
  const { state, state_reason } = (issue ?? {}) as { state?: unknown; state_reason?: unknown };
  if (state !== "closed" || state_reason !== "completed") return false;
  const labels = labelNamesOf(issue);
  return !REMAINDER_LABELS.some((l) => labels.includes(l));
}

/** The timeline half: since the last reopen, nothing says the plan closed unbuilt or that its
 *  remainder moved elsewhere. A reopen starts over, so a plan reopened and then built counts.
 *  `marked_as_duplicate` is deliberately NOT read (#8216): GitHub writes it on the issue another
 *  was closed as a duplicate OF, so it says nothing about this plan's own close. The duplicate
 *  itself carries a `closed` event with `state_reason: duplicate`, which the check below catches. */
export function timelineSaysBuilt(timeline: readonly TimelineEvent[]): boolean {
  const lastReopen = timeline.findLastIndex((e) => e?.event === "reopened");
  return !timeline.slice(lastReopen + 1).some((e) => {
    if (e?.event === "closed") return UNBUILT_REASONS.has(String(e.state_reason));
    return e?.event === "commented" && String(e.body ?? "").startsWith(RELAY_RECEIPT);
  });
}

/** Build the bound reader, with its own private cache. `doFetch` is injectable so specs never hit
 *  the network, the same discipline as `createStatusFetcher`. */
export function createBuiltPlanReader(
  config: FeedbackStatusConfig,
  doFetch: DoFetch = fetchJson,
): FetchBuiltPlans {
  const cache = new Map<number, { readonly built: boolean; readonly at: number }>();
  const get = async (path: string): Promise<unknown> => {
    const res = await doFetch(
      "GET",
      `https://api.github.com/repos/${config.repo}/${path}`,
      githubHeaders(config.token),
    );
    if (res.status !== 200 || !res.body || typeof res.body !== "object") {
      throw new Error(`GitHub answered ${res.status} for ${path}`);
    }
    return res.body;
  };
  const readTimeline = async (plan: number): Promise<TimelineEvent[]> => {
    const events: TimelineEvent[] = [];
    for (let page = 1; page <= MAX_TIMELINE_PAGES; page++) {
      const rows = await get(`issues/${plan}/timeline?per_page=100&page=${page}`);
      if (!Array.isArray(rows)) throw new Error(`timeline for #${plan} is not a list`);
      events.push(...rows);
      if (rows.length < 100) return events;
    }
    throw new Error(`timeline for #${plan} runs past ${MAX_TIMELINE_PAGES} pages`);
  };
  return async (plans) => {
    const now = Date.now();
    await Promise.all(
      [...new Set(plans)].map(async (plan) => {
        const hit = cache.get(plan);
        if (hit && now - hit.at <= CACHE_TTL_MS) return;
        try {
          const built =
            closedAsBuilt(await get(`issues/${plan}`)) &&
            timelineSaysBuilt(await readTimeline(plan));
          cache.set(plan, { built, at: now });
        } catch {
          // Left unread and uncached: the plan is not built as far as any member is told.
        }
      }),
    );
    return new Set(plans.filter((plan) => cache.get(plan)?.built === true));
  };
}

/** Env factory — `undefined` (inert) until `SKYNET_FEEDBACK_GITHUB_TOKEN` is set, the same token
 *  and repo default as `resolveFeedbackStatus`. */
export function resolveBuiltPlanReader(
  env: Readonly<Record<string, string | undefined>>,
): FetchBuiltPlans | undefined {
  const token = env.SKYNET_FEEDBACK_GITHUB_TOKEN;
  if (!token) return undefined;
  return createBuiltPlanReader({
    token,
    repo: env.SKYNET_FEEDBACK_REPO ?? "ejclark/skynet-capital",
  });
}
