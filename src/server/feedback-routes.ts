/**
 * `/feedback/coach` and `/feedback/preview` — the two feedback endpoints that stay bare paths
 * rather than `/api/*`: the shell's own coach box (`app/src/live/feedback.ts`) posts to them
 * directly, so they're load-bearing for BOTH the retired classic form and the current shell, not
 * classic-only residue. `/feedback` and `/feedback/followup` themselves are superseded by the
 * shell's own `/api/feedback` and `/api/feedback/followup` (`feedback-api-routes.ts`).
 *
 * Neither the coach nor the preview ever posts anything anywhere — only the member's explicit
 * Send does.
 */
import type { IncomingMessage, ServerResponse } from "node:http";

import type { Session } from "./auth/session.js";
import { type CoachTurn, handleFeedbackCoach } from "./feedback-coach.js";
import type { SubmitFollowup } from "./feedback-followup.js";
import type { FeedbackLogEntry } from "./feedback-log.js";
import { handleFeedbackPreview } from "./feedback-preview.js";
import type { FeedbackInput, FeedbackResult } from "./feedback-service.js";
import type { FetchFeedbackStatuses } from "./feedback-status.js";

/** What the feedback surface needs from the server config — never the whole config object. */
export interface FeedbackRouteDeps {
  readonly submitFeedback?: (input: FeedbackInput) => Promise<FeedbackResult>;
  readonly coachFeedback?: CoachTurn;
  /** Records a successful filing (#429 slice: the feedback log). Failure never fails the submit —
   *  it's recorded in a try/catch so a store hiccup can't cost the member their filed issue. */
  readonly recordFeedback?: (entry: FeedbackLogEntry) => Promise<void>;
  /** Reads a member's own filing history, for the "Your recent feedback" list under the form. */
  readonly readFeedback?: (opaqueMemberId: string) => Promise<readonly FeedbackLogEntry[]>;
  /** Live status (open/needs-info/needs-eric/next-slice/shipped) for that same list — omitted
   *  (undefined) means unwired, same as the other feedback deps; the list still renders, just
   *  without status badges. */
  readonly fetchFeedbackStatus?: FetchFeedbackStatuses;
  /** Posts a follow-up comment on an issue the signed-in member already filed, and re-triggers a
   *  build (feedback-followup.ts). Requires `readFeedback` too — ownership is checked against the
   *  member's own logged filings, never trusted from the form. */
  readonly submitFollowup?: SubmitFollowup;
}

/** Handle `/feedback/coach` and `/feedback/preview`. */
export async function serveFeedbackRoute(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  session: Session | undefined,
  config: FeedbackRouteDeps,
): Promise<void> {
  const method = req.method ?? "GET";
  if (path === "/feedback/coach") {
    await handleFeedbackCoach(req, res, method, session?.email, config.coachFeedback);
    return;
  }
  await handleFeedbackPreview(req, res, method);
}

// Light per-submitter throttle — the codebase has no rate-limiting, and feedback submission
// writes to the repo, so cap bursts (5 / 10 min) keyed by the signed-in email. In-memory is fine
// (single process). Shared with the shell's /api/feedback (#738 phase 9d) — one budget, one door.
const feedbackHits = new Map<string, number[]>();
export function feedbackThrottled(
  key: string,
  now = Date.now(),
  windowMs = 600_000,
  max = 5,
): boolean {
  const recent = (feedbackHits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    feedbackHits.set(key, recent);
    return true;
  }
  recent.push(now);
  feedbackHits.set(key, recent);
  return false;
}
