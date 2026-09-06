import type { IncomingMessage, ServerResponse } from "node:http";
import type { Session } from "./auth/session.js";
import { applyControlsAction, type ControlsDeps, fleetControls } from "./controls-form.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { parseJsonRecord, readJsonPost, sendJson } from "./page-shell.js";

/**
 * MISSION CONTROL AS DATA — the shell's twin of the desk's owner-only Settings
 * tab (`controls-form.ts`), as one endpoint:
 *
 *   GET  /api/controls → `{owner:false}` for everyone but env-allowlisted owners (the switchboard
 *                        leaks nothing, exactly as the HTML tab renders the plain desk to a
 *                        member); owners get the fleet — the global stand-down, one row per bot,
 *                        and the audit line.
 *   POST /api/controls → one switch flipped, through the SAME `applyControlsAction` authority the
 *                        HTML form calls — the action surface stays exactly what the page shows,
 *                        and every refusal is the authority's own sentence.
 *
 * The owner check is re-run here on every request, never inherited from the call site (the tab's
 * standing rule), and the editor stamped into the audit line is the SESSION's email. The JSON
 * posture (application/json only, via `readJsonPost`) replaces the form's Sec-Fetch-Site check as
 * the cross-site seam — a cookie-riding form post can't speak JSON.
 */

const CONTROLS_BODY_CAP_BYTES = 2_048;

interface ActionBody {
  readonly action: string;
  readonly bot?: string;
  readonly model?: string;
}

/** Strict shape gate: an action word, optionally a bot id or a model id — nothing else, nothing
 *  coerced. Which fields an action actually reads is `applyControlsAction`'s call, not this
 *  gate's — this only bounds shape and length. */
function parseActionBody(raw: string): ActionBody | undefined {
  const body = parseJsonRecord(raw);
  if (!body) return undefined;
  const action = body.action;
  if (typeof action !== "string" || action.length === 0 || action.length > 40) return undefined;
  const bot = body.bot;
  if (bot !== undefined && (typeof bot !== "string" || bot.length === 0 || bot.length > 100))
    return undefined;
  const model = body.model;
  if (model !== undefined && (typeof model !== "string" || model.length === 0 || model.length > 40))
    return undefined;
  return {
    action,
    ...(bot !== undefined ? { bot } : {}),
    ...(model !== undefined ? { model } : {}),
  };
}

function ownerEmail(
  controls: ControlsDeps | undefined,
  session: Session | undefined,
): string | undefined {
  // Lowercased to match requireOwner's check exactly — sessions arrive pre-lowercased today,
  // but the two surfaces must never be able to disagree about who an owner is.
  const email = session?.email.toLowerCase();
  return controls && email && controls.isOwner(email) ? email : undefined;
}

/** Handle `/api/controls`. Returns true when the request was answered. */
export async function serveControlsApi(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<boolean> {
  if (path !== "/api/controls") return false;
  const controls = config.controls;
  const editor = ownerEmail(controls, session);

  if ((req.method ?? "GET") === "GET") {
    sendJson(
      res,
      200,
      editor && controls ? { owner: true, fleet: fleetControls(controls) } : { owner: false },
    );
    return true;
  }

  const raw = await readJsonPost(req, res, CONTROLS_BODY_CAP_BYTES);
  if (raw === undefined) return true;
  if (!(editor && controls)) {
    sendJson(res, 403, { error: "Mission Control answers only to owners." });
    return true;
  }
  const body = parseActionBody(raw);
  if (!body) {
    sendJson(res, 400, { error: "malformed controls body" });
    return true;
  }
  const result = applyControlsAction(body.action, body.bot, editor, controls, body.model);
  sendJson(res, 200, { ok: result.ok, message: result.notice.message });
  return true;
}
