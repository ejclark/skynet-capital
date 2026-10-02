import {
  type ActivityEvent,
  activityEventFromMergedPullRequest,
  forVisibility,
  type MergedPullRequestInfo,
} from "./activity-event.js";

/**
 * DEVELOPMENT EVENTS → FEED ROWS — `trade-event-feed.ts` and `feedback-event-feed.ts`'s third
 * sibling, for #784's third kind (slice 4). Same split as both: `activity-event.ts` owns the write
 * direction (a merged pull request becomes an envelope) and this file owns the inverse — given
 * events, what has the league actually shipped?
 *
 * That the third kind is a decoder plus a chip and NOT a fourth widget is the whole payoff of slices
 * 1–3. Nothing about the page's shape changes here: `buildActivityFeed` gains a branch, `KIND_CHIPS`
 * gains a row, and this file is the envelope half.
 *
 * TWO WAYS THIS KIND IS SIMPLER THAN THE OTHER TWO, both worth knowing before extending it:
 *
 * - **No bridge.** Slices 1 and 2 each had to union a durable ledger into the bus
 *   (`mergeLedgerIntoEvents`, `mergeFeedbackLogIntoEvents`) because the bus is younger than the
 *   ledger it mirrors and reading it alone would drop real history. There is no development ledger
 *   in this app at all, so there is nothing to bridge — and GitHub, which does hold the history,
 *   is read live by `development-activity.ts`, whose result folds in through
 *   `mergeMergesIntoEvents` below.
 * - **A merge does not mutate.** A fill progresses (new → partially_filled → filled) and a filing's
 *   status changes after it is written; a merged PR is merged, once, forever. So the fold is a
 *   deduplication by identity rather than a most-progressed-wins contest.
 */

/** Only the public tier reaches the cross-member feed — the same gate the other two decoders apply,
 *  belt-and-braces beside the event-type check. */
const PUBLIC_ONLY = forVisibility(["public"]);

/** One merge as the feed needs it. `author` is OPTIONAL and stays absent when the payload carried
 *  none: an unattributed merge is honest, and a row that names the wrong person is not. */
export interface DevelopmentFeedItem {
  readonly pullRequest: number;
  readonly title: string;
  readonly author?: string;
  readonly url: string;
  readonly mergedAt: string;
}

function pullNumberOf(event: ActivityEvent): number | undefined {
  if (event.target.kind !== "development") return undefined;
  const parsed = Number(event.target.id);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

/**
 * One event → one merge, or null when the event is not a public merge or its payload cannot honestly
 * yield one. Null is the common, expected answer on a mixed bus — a trade fill, a filing, an
 * owner-only submission line — never an error.
 */
export function developmentFromEvent(event: ActivityEvent): DevelopmentFeedItem | null {
  if (!(event.eventType === "development.pr-merged" && PUBLIC_ONLY(event))) return null;
  const pullRequest = pullNumberOf(event);
  if (pullRequest === undefined) return null;
  const { title, url, author } = event.payload;
  if (typeof title !== "string" || !title) return null;
  if (typeof url !== "string" || !url) return null;
  return {
    pullRequest,
    title,
    ...(typeof author === "string" && author ? { author } : {}),
    url,
    mergedAt: event.at,
  };
}

/**
 * Fold a mixed event list into one row per merged pull request, newest merge first. A PR appears
 * once by construction (`activityEventFromMergedPullRequest` keys its id on the number alone), so a
 * duplicate here means the same merge reached the bus twice — a replayed poll, a re-publish — and the
 * later line wins, matching both sibling folds.
 *
 * Non-development and unparseable events are dropped by the decoder above, so a caller can hand this
 * the whole bus.
 */
export function collapseDevelopmentEvents(events: readonly ActivityEvent[]): DevelopmentFeedItem[] {
  const byPull = new Map<number, DevelopmentFeedItem>();
  for (const event of events) {
    const merge = developmentFromEvent(event);
    if (!merge) continue;
    byPull.set(merge.pullRequest, merge);
  }
  return [...byPull.values()].sort((a, b) => b.mergedAt.localeCompare(a.mergedAt));
}

/**
 * Fold a just-polled set of merges in on the same schema, so a render is never one request behind
 * its own emitter — `mergeFeedbackStatusesIntoEvents`'s twin, for exactly the reason stated in its
 * header: `publishingMergedPullRequests` writes to the bus DURING this request, after the `list()`
 * that produced `events` already returned, so without this a merge would first appear on the next
 * page load.
 *
 * Deliberately not deduplicated against the bus: a merge the bus already holds folds to the same row
 * either way, because the event id is derived from the PR number alone.
 */
export function mergeMergesIntoEvents(
  events: readonly ActivityEvent[],
  merges: readonly MergedPullRequestInfo[],
): ActivityEvent[] {
  return [...events, ...merges.map(activityEventFromMergedPullRequest)];
}
