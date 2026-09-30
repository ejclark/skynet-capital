import type { IncomingMessage, ServerResponse } from "node:http";
import type { Session } from "./auth/session.js";
import { opaqueMemberId } from "./feedback-issue.js";
import { feedbackThrottled } from "./feedback-routes.js";
import {
  type FilingCommentsDeps,
  filingCommentsView,
  removeFilingComment,
  submitFilingComment,
} from "./filing-comments-form.js";
import { boundedString, parseJsonRecord, readJsonPost, sendJson } from "./page-shell.js";

/**
 * `/api/feedback/comments` — comments on another member's filing (issue #2224 shape 3). GET is the
 * league's view (every filing's comments, pseudonymous — `mine` is the only authorship it carries)
 * plus the viewer's own filing numbers; POST adds a comment, or `{remove}` takes back the
 * member's own. Behind the auth gate like every `/api/*` route, so only members read it.
 *
 * Never GitHub: see `filing-comments-form.ts` for why the deps carry no issue client at all.
 */
const SUBMIT_CAP_BYTES = 2_048;

async function serveSubmit(
  req: IncomingMessage,
  res: ServerResponse,
  deps: FilingCommentsDeps,
  session: Session | undefined,
): Promise<void> {
  const raw = await readJsonPost(req, res, SUBMIT_CAP_BYTES);
  if (raw === undefined) return;
  if (!session) {
    sendJson(res, 403, { ok: false, error: "Sign in to comment." });
    return;
  }
  if (feedbackThrottled(`filing-comment:${session.email}`)) {
    sendJson(res, 429, { ok: false, error: "Give it a moment before commenting again." });
    return;
  }
  const body = parseJsonRecord(raw);
  const issueNumber = body?.issueNumber;
  if (!(typeof issueNumber === "number" && Number.isInteger(issueNumber) && issueNumber > 0)) {
    sendJson(res, 400, { ok: false, error: "malformed comment body" });
    return;
  }
  const authorId = opaqueMemberId(session.email);
  const removeId = boundedString(body?.remove, 100);
  if (removeId !== undefined) {
    sendJson(res, 200, removeFilingComment(issueNumber, removeId, authorId, deps));
    return;
  }
  // Form-bounds only — submitFilingComment owns the real length rule.
  const text = boundedString(body?.text, 1_500);
  if (text === undefined) {
    sendJson(res, 400, { ok: false, error: "malformed comment body" });
    return;
  }
  sendJson(res, 200, await submitFilingComment(issueNumber, text, authorId, deps));
}

/** Handle `/api/feedback/comments`. Returns true when answered. Omit `deps` and every request
 *  answers `{enabled:false}` — the pulse then renders its cards with no comment fold. */
export async function serveFilingCommentsApi(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  deps: FilingCommentsDeps | undefined,
  session: Session | undefined,
): Promise<boolean> {
  if (path !== "/api/feedback/comments") return false;
  if (!deps) {
    sendJson(res, 200, { enabled: false });
    return true;
  }
  if ((req.method ?? "GET") === "GET") {
    const view = await filingCommentsView(
      deps,
      session ? opaqueMemberId(session.email) : undefined,
    );
    sendJson(res, 200, { enabled: true, ...view });
    return true;
  }
  await serveSubmit(req, res, deps, session);
  return true;
}
