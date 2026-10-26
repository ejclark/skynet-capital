import type { IncomingMessage, ServerResponse } from "node:http";
import type { Session } from "./auth/session.js";
import { type CouncilDeps, councilWeekView } from "./council-form.js";
import { opaqueMemberId } from "./feedback-issue.js";
import { sendJson } from "./page-shell.js";

/**
 * `/api/council` — the Sunday Council's weekly thesis line (`docs/THE-GAME.md:117`, issue #2224
 * shape 1), RETIRED by #5992 (Eric, 2026-10-24: a weekly market call "encourages people to think
 * they can time the market", against an app that exists to teach). A thesis now lives in playbook
 * authoring, where it is shadow-tested before it trades.
 *
 * What stays: the stored lines (member-authored data is archived, never deleted, in that plan) and
 * this GET, which no surface reads any more — #5992 slice 3 buries it. What is gone: every write.
 * A POST, a retract included, answers 410 whether or not the store is wired, so an old tab or a
 * script can never add a line dated after the retirement (the plan's falsifier).
 */
export const COUNCIL_RETIRED = {
  ok: false,
  error: "The Council is retired — write your thesis into a playbook, where it gets tested.",
} as const;

/** Handle `/api/council`. Returns true when the request was answered. Omit `deps` (no store
 *  wired) and a GET answers `{enabled:false}` — the honest empty state. */
export function serveCouncilApi(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  deps: CouncilDeps | undefined,
  session: Session | undefined,
): boolean {
  if (path !== "/api/council") return false;
  if ((req.method ?? "GET") !== "GET") {
    sendJson(res, 410, COUNCIL_RETIRED);
    return true;
  }
  if (!deps) {
    sendJson(res, 200, { enabled: false });
    return true;
  }
  const view = councilWeekView(deps, session ? opaqueMemberId(session.email) : undefined);
  sendJson(res, 200, { enabled: true, ...view });
  return true;
}
