import type { IncomingMessage, ServerResponse } from "node:http";
import type { Session } from "./auth/session.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { toSpec } from "./feedback-coach.js";
import { kindFromForm } from "./feedback-form-input.js";
import { parseImages } from "./feedback-images.js";
import { opaqueMemberId } from "./feedback-issue.js";
import { recordFilingSafely } from "./feedback-log.js";
import { feedbackThrottled } from "./feedback-routes.js";
import type { FeedbackInput } from "./feedback-service.js";
import { boundedString, parseJsonRecord, readJsonPost, sendJson } from "./page-shell.js";

/** Community-track milestone celebration ids, mirroring `/api/learn/claim`'s bounded shape. */
function parseCommunityAckIds(raw: string): readonly string[] | undefined {
  const body = parseJsonRecord(raw);
  if (!body || !Array.isArray(body.ack)) return undefined;
  const ids = body.ack;
  const bounded = (v: unknown): v is string =>
    typeof v === "string" && v.length > 0 && v.length <= 100;
  return ids.length > 0 && ids.length <= 20 && ids.every(bounded) ? ids : undefined;
}

/**
 * THE FEEDBACK API (#738 phase 9d) — `/feedback`'s JSON twin, three endpoints:
 *
 *   GET  /api/feedback          → what's wired (submit/coach/followup) and the member's own
 *                                 filing history with live status badges — resolved through
 *                                 `opaqueMemberId(session.email)`, never a client-named member.
 *   POST /api/feedback          → submitFeedback, through the form route's exact authorities:
 *                                 `kindFromForm` (a missing kind is refused, never guessed —
 *                                 #645), `toSpec` re-normalizing a coach draft, `parseImages`
 *                                 bounding the screenshots, and the SHARED per-member throttle.
 *   POST /api/feedback/followup → a comment on an issue the member already filed — ownership
 *                                 checked against their own logged filings, never the posted
 *                                 number.
 *
 * The coach and the markdown preview stay on their existing endpoints (`/feedback/coach`,
 * `/feedback/preview`) — they were JSON from birth and both doors share them. Neither the coach
 * nor the preview ever posts anything anywhere; only the member's explicit Send does.
 */

/** Screenshots ride the same POST as base64 — the legacy form's exact allowance. */
const SUBMIT_CAP_BYTES = 8_000_000;
const FOLLOWUP_CAP_BYTES = 8_000;

async function serveIndex(
  res: ServerResponse,
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<void> {
  const recent =
    config.readFeedback && session?.email
      ? await config.readFeedback(opaqueMemberId(session.email))
      : [];
  const statuses =
    config.fetchFeedbackStatus && recent.length
      ? await config.fetchFeedbackStatus(recent.map((e) => e.issueNumber))
      : undefined;
  // The community milestone track (#567) — same identity, same "never trust the client" posture
  // as everything else on this route: the view is derived server-side from the same log.
  const community =
    config.communityProgression && session?.email
      ? await config.communityProgression.view(opaqueMemberId(session.email))
      : undefined;
  sendJson(res, 200, {
    enabled: Boolean(config.submitFeedback),
    coachEnabled: Boolean(config.coachFeedback),
    followupEnabled: Boolean(config.submitFollowup && config.readFeedback),
    // Already-durable — `feedback-log.ts` (#429) records every filing; this is just its length,
    // never a separate counter that could drift from that record (#567).
    feedbackCount: community?.feedbackCount ?? recent.length,
    celebrating: (community?.celebrating ?? []).map((m) => ({
      milestoneId: m.milestoneId,
      issueNumber: m.issueNumber,
    })),
    recent: recent.map((e) => ({
      issueNumber: e.issueNumber,
      title: e.title,
      kind: e.kind,
      filedAt: e.filedAt,
      url: e.url,
      ...(statuses?.get(e.issueNumber) ? { status: statuses.get(e.issueNumber) } : {}),
    })),
  });
}

/** The JSON body → FeedbackInput, through the form's exact authorities: bounded fields, the
 *  session's identity (never the body's), `toSpec` re-normalizing a coach draft, `parseImages`
 *  bounding the screenshots. */
function assembleInput(
  body: Record<string, unknown>,
  kind: FeedbackInput["kind"],
  session: Session | undefined,
): FeedbackInput {
  const area = boundedString(body.area, 60);
  const images = typeof body.images === "string" ? parseImages(body.images) : [];
  return {
    kind,
    title: boundedString(body.title, 200) ?? "",
    details: boundedString(body.details, 20_000) ?? "",
    ...(area ? { area } : {}),
    ...(session?.email ? { submitterEmail: session.email } : {}),
    ...(session?.name ? { submitterName: session.name } : {}),
    ...(body.spec !== undefined ? { spec: toSpec(body.spec) } : {}),
    ...(images.length ? { images } : {}),
  };
}

/** The submission, from JSON — same fields, same authorities, same refusals as the form POST. */
async function serveSubmit(
  req: IncomingMessage,
  res: ServerResponse,
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<void> {
  const raw = await readJsonPost(req, res, SUBMIT_CAP_BYTES);
  if (raw === undefined) return;
  if (!config.submitFeedback) {
    sendJson(res, 200, {
      ok: false,
      error:
        "Feedback isn't switched on yet — ask Eric to set the feedback token. Your note wasn't sent.",
    });
    return;
  }
  if (session && feedbackThrottled(session.email)) {
    sendJson(res, 429, {
      ok: false,
      error: "You've sent a bunch just now — give it a few minutes and try again.",
    });
    return;
  }
  const body = parseJsonRecord(raw);
  const kind = body ? kindFromForm(typeof body.kind === "string" ? body.kind : null) : undefined;
  if (!(body && kind)) {
    sendJson(res, 400, {
      ok: false,
      error:
        "Pick what kind of feedback this is — bug, feature, or side quest — and send it again.",
    });
    return;
  }
  const input = assembleInput(body, kind, session);
  const result = await config.submitFeedback(input);
  if (result.ok) {
    await recordFilingSafely(
      config.recordFeedback,
      input,
      session?.email ? opaqueMemberId(session.email) : undefined,
      result,
    );
  }
  sendJson(res, result.ok ? 200 : 502, result);
}

/** A follow-up on the member's OWN filing — the legacy route's ownership rule verbatim. */
async function serveFollowup(
  req: IncomingMessage,
  res: ServerResponse,
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<void> {
  const raw = await readJsonPost(req, res, FOLLOWUP_CAP_BYTES);
  if (raw === undefined) return;
  if (!(config.submitFollowup && config.readFeedback && session)) {
    sendJson(res, 200, { ok: false, error: "Following up isn't switched on yet." });
    return;
  }
  if (feedbackThrottled(session.email)) {
    sendJson(res, 429, {
      ok: false,
      error: "You've sent a bunch just now — give it a few minutes and try again.",
    });
    return;
  }
  const body = parseJsonRecord(raw);
  const issueNumber = body && typeof body.issueNumber === "number" ? body.issueNumber : Number.NaN;
  const details = body ? (boundedString(body.details, 8_000) ?? "") : "";
  const owned = await config.readFeedback(opaqueMemberId(session.email));
  if (!(Number.isInteger(issueNumber) && owned.some((e) => e.issueNumber === issueNumber))) {
    sendJson(res, 200, { ok: false, error: "That doesn't look like one of your own filings." });
    return;
  }
  const result = await config.submitFollowup({
    issueNumber,
    body: details,
    submitterEmail: session.email,
    ...(session.name ? { submitterName: session.name } : {}),
  });
  sendJson(res, result.ok ? 200 : 502, result);
}

/** Handle `/api/feedback*`. Returns true when the request was answered. */
export async function serveFeedbackApi(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<boolean> {
  if (path === "/api/feedback" && (req.method ?? "GET") === "GET") {
    await serveIndex(res, config, session);
    return true;
  }
  if (path === "/api/feedback") {
    await serveSubmit(req, res, config, session);
    return true;
  }
  if (path === "/api/feedback/followup") {
    await serveFollowup(req, res, config, session);
    return true;
  }
  return false;
}
