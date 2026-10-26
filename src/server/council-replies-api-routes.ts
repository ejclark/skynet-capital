import type { IncomingMessage, ServerResponse } from "node:http";
import type { Session } from "./auth/session.js";
import { COUNCIL_RETIRED } from "./council-api-routes.js";
import { type CouncilRepliesDeps, councilRepliesView } from "./council-replies-form.js";
import { opaqueMemberId } from "./feedback-issue.js";
import { sendJson } from "./page-shell.js";

/**
 * `/api/council/replies` — replies under each weekly Council line (#5097, #2224 option A), beside
 * the Council's own `/api/council`, and retired with it (#5992). The replies stay stored and this
 * GET stays until #5992 slice 3 buries it; every write — a new reply or taking one back — answers
 * 410. The commentary Eric asked for in #5097 moves onto a playbook's thesis (#5992 slice 2), not
 * out of the app.
 */

/** Handle `/api/council/replies`. Returns true when answered. Omit `deps` and a GET answers
 *  `{enabled:false}`. */
export function serveCouncilRepliesApi(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  deps: CouncilRepliesDeps | undefined,
  session: Session | undefined,
): boolean {
  if (path !== "/api/council/replies") return false;
  if ((req.method ?? "GET") !== "GET") {
    sendJson(res, 410, COUNCIL_RETIRED);
    return true;
  }
  if (!deps) {
    sendJson(res, 200, { enabled: false });
    return true;
  }
  const view = councilRepliesView(deps, session ? opaqueMemberId(session.email) : undefined);
  sendJson(res, 200, { enabled: true, ...view });
  return true;
}
