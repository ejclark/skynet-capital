import type { IncomingMessage, ServerResponse } from "node:http";
import { judgeTargetSplit } from "../observatory/target-split.js";
import type { Session } from "./auth/session.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { opaqueMemberId } from "./feedback-issue.js";
import { parseJsonRecord, readJsonPost, requireGet, sendJson } from "./page-shell.js";

/**
 * THE TARGET SPLIT API (#4607 slice 1) — a member's own target split, never another's.
 * Keyed by `opaqueMemberId(session.email)`, the identity `/api/saved-positions` uses.
 *
 *   GET  /api/target-split        → { wired, target: TargetSplit | null } for the signed-in member.
 *   POST /api/target-split/save   → { ok, target?, error? } — the error is the member's sentence.
 *   POST /api/target-split/clear  → { ok, error? }
 *
 * Same auth invariant as `saved-positions-api-routes.ts`: `!session` means the route doesn't exist
 * (`false`), before anything else runs. Bodies are application/json and size-capped
 * (`readJsonPost`); a body that is not a JSON object is a 400, and a split that breaks a rule (not
 * whole percents, not adding to 100) is a 200 carrying the sentence the form shows.
 */

const TARGET_SPLIT_BODY_CAP_BYTES = 1_024;

const PATHS = new Set(["/api/target-split", "/api/target-split/save", "/api/target-split/clear"]);

const UNREADABLE =
  "Your saved target couldn't be read just now, so nothing was changed. Try again.";

/** Handle `/api/target-split*`. True when the request was answered, false when the route doesn't
 *  apply (unauthenticated, or a different path). */
export async function serveTargetSplitApi(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<boolean> {
  if (!(session && PATHS.has(path))) return false;
  const store = config.targetSplits;
  const memberKey = opaqueMemberId(session.email);

  if (path === "/api/target-split") {
    if (!requireGet(req, res)) return true;
    sendJson(res, 200, { wired: store !== undefined, target: store?.get(memberKey) ?? null });
    return true;
  }

  const raw = await readJsonPost(req, res, TARGET_SPLIT_BODY_CAP_BYTES);
  if (raw === undefined) return true;
  const body = parseJsonRecord(raw);
  if (!body) {
    sendJson(res, 400, { error: "malformed target-split body" });
    return true;
  }
  if (!store) {
    sendJson(res, 200, { ok: false, error: "A target split isn't wired in this deployment." });
    return true;
  }

  if (path === "/api/target-split/save") {
    const judged = judgeTargetSplit(body);
    if (typeof judged === "string") {
      sendJson(res, 200, { ok: false, error: judged });
      return true;
    }
    const target = store.set(memberKey, judged);
    sendJson(res, 200, target ? { ok: true, target } : { ok: false, error: UNREADABLE });
    return true;
  }

  sendJson(res, 200, store.clear(memberKey) ? { ok: true } : { ok: false, error: UNREADABLE });
  return true;
}
