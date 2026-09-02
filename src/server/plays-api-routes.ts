import type { IncomingMessage, ServerResponse } from "node:http";
import { LADDER_GATE_NOTE, ladderNeighbor } from "../domain/progression.js";
import { TRADE_TYPES } from "../domain/trade-types.js";
import type { Session } from "./auth/session.js";
import { resolveCurrentId } from "./dashboard-identity.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { parseJsonRecord, readJsonPost, requireGet, sendJson } from "./page-shell.js";
import { playLocked } from "./progression-service.js";

/**
 * THE TICKET'S CATALOG AND LADDER — what the shell's trade page needs to know
 * before any order is drafted:
 *
 *   GET  /api/trade/plays  → the six trade types (`trade-types.ts`, verbatim: real broker term,
 *                            tldr, gloss) plus the VIEWER'S ladder — wheels on/off, each play's
 *                            locked state, and for a locked rung the one that opens it
 *                            (`ladderNeighbor`), so the locked panel can name the path.
 *   POST /api/trade/wheels → the training-wheels preference, the legacy `/trade` toggle's JSON
 *                            twin. Writes the SESSION'S own record only — the body carries a
 *                            boolean and names nobody.
 *
 * Locked/wheels resolution is exactly the legacy ticket's (`viewerProgression` + `playLocked`):
 * no progression service, or no linked desk, behaves as wheels-off — nothing restricted.
 */

const WHEELS_BODY_CAP_BYTES = 1_024;

async function servePlays(
  res: ServerResponse,
  config: DashboardServerConfig,
  requesterId: string | undefined,
): Promise<void> {
  const progression =
    requesterId && config.progression ? await config.progression.view(requesterId) : undefined;
  // The feedback gate (#1119): while it holds, every unearned rung is locked for ONE reason, so
  // the per-rung "opens after the rung below" is withheld — it would name the wrong remedy.
  const gate = progression?.ladderGate;
  sendJson(res, 200, {
    linked: requesterId !== undefined,
    wheels: progression?.wheels ?? false,
    ...(gate ? { gate: { reason: gate, note: LADDER_GATE_NOTE } } : {}),
    ...(progression?.nextUp ? { nextUp: progression.nextUp } : {}),
    plays: TRADE_TYPES.map((t) => {
      const locked = playLocked(t.code, progression);
      const prev = locked && !gate ? ladderNeighbor(t.code, -1) : undefined;
      return {
        code: t.code,
        id: t.id,
        name: t.name,
        tldr: t.tldr,
        kind: t.kind,
        side: t.side,
        ...(t.optionType ? { optionType: t.optionType } : {}),
        gloss: t.gloss,
        locked,
        ...(prev ? { opensAfter: { code: prev.code, name: prev.name } } : {}),
      };
    }),
  });
}

async function serveWheels(
  req: IncomingMessage,
  res: ServerResponse,
  config: DashboardServerConfig,
  requesterId: string | undefined,
): Promise<void> {
  const raw = await readJsonPost(req, res, WHEELS_BODY_CAP_BYTES);
  if (raw === undefined) return;
  const body = parseJsonRecord(raw);
  if (!body || typeof body.wheels !== "boolean") {
    sendJson(res, 400, { error: "malformed wheels body" });
    return;
  }
  if (!config.progression) {
    sendJson(res, 200, { ok: false, error: "The journey isn't wired in this deployment." });
    return;
  }
  if (!requesterId) {
    sendJson(res, 200, {
      ok: false,
      error: "This session isn't linked to a desk yet — the training wheels ride your own account.",
    });
    return;
  }
  await config.progression.setWheels(requesterId, body.wheels);
  sendJson(res, 200, { ok: true, wheels: body.wheels });
}

/** Handle `/api/trade/plays` and `/api/trade/wheels`. Returns true when answered. */
export async function servePlaysApi(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<boolean> {
  if (path !== "/api/trade/plays" && path !== "/api/trade/wheels") return false;
  // The session's own journey — the same resolution every trade surface uses.
  const requesterId = config.auth ? resolveCurrentId(session, config.resolveOwnerId) : undefined;
  if (path === "/api/trade/plays") {
    if (requireGet(req, res)) await servePlays(res, config, requesterId);
    return true;
  }
  await serveWheels(req, res, config, requesterId);
  return true;
}
