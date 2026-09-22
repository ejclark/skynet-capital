import type { IncomingMessage, ServerResponse } from "node:http";
import type { Session } from "./auth/session.js";
import { type CouncilDeps, councilWeekView, submitThesis } from "./council-form.js";
import { opaqueMemberId } from "./feedback-issue.js";
import { feedbackThrottled } from "./feedback-routes.js";
import { boundedString, parseJsonRecord, readJsonPost, sendJson } from "./page-shell.js";

/**
 * `/api/council` — the Sunday Council's write surface (`docs/THE-GAME.md:117`, issue #2224 shape
 * 1): one line per member per week, visible inside the gate. Same shape as `/api/feedback`: GET
 * answers "what's wired" plus the current week's lines (pseudonymous — `opaqueMemberId`, matching
 * the Feedback pulse's own posture) and the viewer's own line when signed in; POST replaces it.
 *
 * Owner or member, same door — unlike Mission Control, the Council has no admin half. A
 * signed-out or password-mode request still SEES the week (the gate already let it through this
 * far — `dashboard-auth-gate.ts` runs first), it just can't post one.
 */
const SUBMIT_CAP_BYTES = 1_024;

function serveIndex(res: ServerResponse, deps: CouncilDeps, session: Session | undefined): void {
  const view = councilWeekView(deps, session ? opaqueMemberId(session.email) : undefined);
  sendJson(res, 200, { enabled: true, ...view });
}

async function serveSubmit(
  req: IncomingMessage,
  res: ServerResponse,
  deps: CouncilDeps,
  session: Session | undefined,
): Promise<void> {
  const raw = await readJsonPost(req, res, SUBMIT_CAP_BYTES);
  if (raw === undefined) return;
  if (!session) {
    sendJson(res, 403, { ok: false, error: "Sign in to speak at the Council." });
    return;
  }
  if (feedbackThrottled(`council:${session.email}`)) {
    sendJson(res, 429, { ok: false, error: "Give it a moment before changing your line again." });
    return;
  }
  const body = parseJsonRecord(raw);
  const text = body ? boundedString(body.text, 2_000) : undefined; // form-bounds first; submitThesis owns the real 280-char rule
  if (text === undefined) {
    sendJson(res, 400, { ok: false, error: "malformed council body" });
    return;
  }
  const result = submitThesis(text, opaqueMemberId(session.email), deps);
  sendJson(res, 200, result);
}

/** Handle `/api/council`. Returns true when the request was answered. Omit `deps` (no store
 *  wired) and every request answers `{enabled:false}` — the honest empty state, same posture as
 *  `/api/feedback` when `submitFeedback` is unwired. */
export async function serveCouncilApi(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  deps: CouncilDeps | undefined,
  session: Session | undefined,
): Promise<boolean> {
  if (path !== "/api/council") return false;
  if (!deps) {
    sendJson(res, 200, { enabled: false });
    return true;
  }
  if ((req.method ?? "GET") === "GET") {
    serveIndex(res, deps, session);
    return true;
  }
  await serveSubmit(req, res, deps, session);
  return true;
}
