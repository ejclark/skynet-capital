import type { IncomingMessage, ServerResponse } from "node:http";
import type { Session } from "./auth/session.js";
import {
  type CouncilRepliesDeps,
  councilRepliesView,
  removeCouncilReply,
  submitCouncilReply,
} from "./council-replies-form.js";
import { opaqueMemberId } from "./feedback-issue.js";
import { feedbackThrottled } from "./feedback-routes.js";
import { boundedString, parseJsonRecord, readJsonPost, sendJson } from "./page-shell.js";

/**
 * `/api/council/replies` — replies under each weekly Council line (#5097, #2224 option A), beside
 * the Council's own `/api/council`. GET is this week's threads, pseudonymous (`mine` and the line
 * writer's mark are the only authorship they carry); POST `{lineId, lineAt, text}` adds one, or
 * `{lineId, remove}` takes back the member's own. Behind the auth gate like every `/api/*` route,
 * so only members inside the invite gate read or write it — the shared-universe boundary, and no
 * second one (#2224's constraints).
 *
 * The author is always the session's own `opaqueMemberId`, never a body field. Writes share the
 * Feedback lane's throttle shape on their own key: 5 per 10 minutes per member.
 */
const REPLY_CAP_BYTES = 2_048;

async function serveReplyPost(
  req: IncomingMessage,
  res: ServerResponse,
  deps: CouncilRepliesDeps,
  session: Session | undefined,
): Promise<void> {
  const raw = await readJsonPost(req, res, REPLY_CAP_BYTES);
  if (raw === undefined) return;
  if (!session) {
    sendJson(res, 403, { ok: false, error: "Sign in to reply." });
    return;
  }
  if (feedbackThrottled(`council-reply:${session.email}`)) {
    sendJson(res, 429, { ok: false, error: "Give it a moment before replying again." });
    return;
  }
  const body = parseJsonRecord(raw);
  const lineId = boundedString(body?.lineId, 100);
  if (lineId === undefined) {
    sendJson(res, 400, { ok: false, error: "malformed reply body" });
    return;
  }
  const authorId = opaqueMemberId(session.email);
  const removeId = boundedString(body?.remove, 100);
  if (removeId !== undefined) {
    sendJson(res, 200, removeCouncilReply(lineId, removeId, authorId, deps));
    return;
  }
  // Form-bounds only — submitCouncilReply owns the real length rule and the line's version check.
  const lineAt = boundedString(body?.lineAt, 40);
  const text = boundedString(body?.text, 1_500);
  if (lineAt === undefined || text === undefined) {
    sendJson(res, 400, { ok: false, error: "malformed reply body" });
    return;
  }
  sendJson(res, 200, submitCouncilReply(lineId, lineAt, text, authorId, deps));
}

/** Handle `/api/council/replies`. Returns true when answered. Omit `deps` and every request
 *  answers `{enabled:false}` — the Council then renders its lines with no reply fold. */
export async function serveCouncilRepliesApi(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  deps: CouncilRepliesDeps | undefined,
  session: Session | undefined,
): Promise<boolean> {
  if (path !== "/api/council/replies") return false;
  if (!deps) {
    sendJson(res, 200, { enabled: false });
    return true;
  }
  if ((req.method ?? "GET") === "GET") {
    const view = councilRepliesView(deps, session ? opaqueMemberId(session.email) : undefined);
    sendJson(res, 200, { enabled: true, ...view });
    return true;
  }
  await serveReplyPost(req, res, deps, session);
  return true;
}
