import type { IncomingMessage, ServerResponse } from "node:http";
import type { Session } from "./auth/session.js";
import { resolveCurrentId } from "./dashboard-identity.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { parseJsonRecord, readJsonPost, sendJson } from "./page-shell.js";

/**
 * THE JOURNEY'S WRITE HALF — the shell's twin of the `/trade`-riding academy
 * posts (`comprehension-routes.ts`), as two endpoints:
 *
 *   POST /api/learn/claim  → progression.acknowledge: bank the one-time celebration. The service
 *                            filters the ids against the real curriculum — ours, never trusted.
 *   POST /api/learn/check  → progression.submitCheck: grade one comprehension check. The browser
 *                            posts answer INDICES and is never asked, or believed, about the
 *                            verdict; only a pass is written, and the graded result — every
 *                            reason attached — comes back whole, because the result IS the
 *                            teaching.
 *
 * Same posture as the settings API: bodies must be application/json (closes cookie-carried
 * cross-site form posts), strict shape gate (400, never coerce), size-capped (413), and the
 * participant is the SESSION'S — resolved exactly as GET /api/learn resolves it, so a body can
 * never name someone else's journey. Refusals are honest sentences, rendered verbatim.
 */

const LEARN_BODY_CAP_BYTES = 8_192;

/** Claim: up to the whole curriculum's worth of ids, each a bounded string. */
function parseClaimIds(raw: string): readonly string[] | undefined {
  const body = parseJsonRecord(raw);
  if (!body) return undefined;
  if (!Array.isArray(body.ack)) return undefined;
  const ids = body.ack;
  const bounded = (v: unknown): v is string =>
    typeof v === "string" && v.length > 0 && v.length <= 100;
  return ids.length > 0 && ids.length <= 40 && ids.every(bounded) ? ids : undefined;
}

interface CheckBody {
  readonly milestoneId: string;
  /** Question id → posted option index, as strings — the grader owns interpretation. */
  readonly answers: ReadonlyMap<string, string>;
}

/** Check: one milestone id plus a small record of answer indices. Blanks simply stay absent. */
function parseCheckBody(raw: string): CheckBody | undefined {
  const body = parseJsonRecord(raw);
  if (!body) return undefined;
  const milestoneId = body.milestoneId;
  if (typeof milestoneId !== "string" || milestoneId.length === 0 || milestoneId.length > 100)
    return undefined;
  const answers = body.answers;
  if (typeof answers !== "object" || answers === null || Array.isArray(answers)) return undefined;
  const entries = Object.entries(answers);
  const fits = ([key, value]: [string, unknown]) =>
    key.length > 0 && key.length <= 100 && typeof value === "string" && value.length <= 10;
  if (entries.length > 20 || !entries.every(fits)) return undefined;
  return { milestoneId, answers: new Map(entries as [string, string][]) };
}

/** Handle `/api/learn/claim` and `/api/learn/check`. Returns true when answered. */
export async function serveLearnApi(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<boolean> {
  if (path !== "/api/learn/claim" && path !== "/api/learn/check") return false;
  const raw = await readJsonPost(req, res, LEARN_BODY_CAP_BYTES);
  if (raw === undefined) return true;
  if (!config.progression) {
    sendJson(res, 200, { ok: false, error: "The journey isn't wired in this deployment." });
    return true;
  }
  // The session's OWN journey — the same resolution GET /api/learn uses; the body names nobody.
  const id = config.auth ? resolveCurrentId(session, config.resolveOwnerId) : undefined;
  if (id === undefined) {
    sendJson(res, 200, {
      ok: false,
      error:
        "This session isn't linked to a desk yet — milestones are earned by orders filled on your own account.",
    });
    return true;
  }

  if (path === "/api/learn/claim") {
    const ids = parseClaimIds(raw);
    if (!ids) {
      sendJson(res, 400, { error: "malformed claim body" });
      return true;
    }
    const graduated = await config.progression.acknowledge(id, ids);
    // #469 slice 4: a course graduation rides the board's ceremony channel, same one delivery
    // seam `took_profit`/`deployed_capital` already use (`world-transitions.ts`). `acknowledge`
    // guarantees each level appears at most once ever for this participant, so this never
    // double-fires the fanfare for the same graduation.
    for (const level of graduated) {
      config.ceremonies?.emit({
        id: `graduated:${id}:${level}`,
        type: "graduated",
        participantId: id,
        level,
        at: new Date().toISOString(),
      });
    }
    sendJson(res, 200, { ok: true });
    return true;
  }

  const body = parseCheckBody(raw);
  if (!body) {
    sendJson(res, 400, { error: "malformed check body" });
    return true;
  }
  const result = await config.progression.submitCheck(id, body.milestoneId, body.answers);
  if (!result) {
    // No check gates that id — there was never anything to grade, so no verdict is invented.
    sendJson(res, 200, { ok: false, error: "That milestone gates nothing — no check to grade." });
    return true;
  }
  sendJson(res, 200, { ok: true, result });
  return true;
}
