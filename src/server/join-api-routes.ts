import type { IncomingMessage, ServerResponse } from "node:http";
import { ALLOWED_TIMEZONES } from "../participants/allowed-timezones.js";
import type { Session } from "./auth/session.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { boundedString, parseJsonRecord, readJsonPost, sendJson } from "./page-shell.js";
import { personaClasses } from "./persona-classes.js";

/**
 * JOIN THE BOARD (#738 phase 9c) — `/add`'s twin for the shell, as one endpoint:
 *
 *   GET  /api/join → whether joining is wired, the persona classes for the picker, and the
 *                    timezone choices — everything the page renders, nothing it decides.
 *   POST /api/join → addParticipant, with `/add`'s exact ownership rule (Eric's ruling,
 *                    2026-08-21, #466): whoever's signed in is who this account belongs to,
 *                    full stop — never a field the form could fill in on someone else's behalf.
 *
 * Credential discipline is the rotate API's: the pasted key pair is bounded, never logged or
 * echoed, and the SERVICE verifies it against Alpaca before anything is stored. Same JSON
 * posture as every settings write (application/json only, strict shape gate, size-capped),
 * refusals verbatim.
 */

const JOIN_BODY_CAP_BYTES = 4_096;

interface JoinBody {
  readonly displayName: string;
  readonly apiKey: string;
  readonly apiSecret: string;
  readonly kind: "human" | "bot";
  readonly personaId?: string;
  readonly timezone?: string;
}

/** Strict shape gate — exactly the join form's fields, everything else dropped. */
function parseJoinBody(raw: string): JoinBody | undefined {
  const body = parseJsonRecord(raw);
  if (!body) return undefined;
  const displayName = boundedString(body.displayName, 60);
  const apiKey = boundedString(body.apiKey, 200);
  const apiSecret = boundedString(body.apiSecret, 200);
  if (!(displayName && apiKey && apiSecret)) return undefined;
  const kind = body.kind === "bot" ? "bot" : body.kind === "human" ? "human" : undefined;
  if (!kind) return undefined;
  const personaId = body.personaId === undefined ? undefined : boundedString(body.personaId, 60);
  if (body.personaId !== undefined && personaId === undefined) return undefined;
  const timezone = body.timezone === undefined ? undefined : boundedString(body.timezone, 40);
  if (body.timezone !== undefined && timezone === undefined) return undefined;
  return {
    displayName,
    apiKey,
    apiSecret,
    kind,
    ...(personaId !== undefined ? { personaId } : {}),
    ...(timezone !== undefined ? { timezone } : {}),
  };
}

/** Handle `/api/join`. Returns true when the request was answered. */
export async function serveJoinApi(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<boolean> {
  if (path !== "/api/join") return false;

  if ((req.method ?? "GET") === "GET") {
    sendJson(res, 200, {
      wired: Boolean(config.addParticipant),
      classes: personaClasses(),
      timezones: ALLOWED_TIMEZONES,
    });
    return true;
  }

  const raw = await readJsonPost(req, res, JOIN_BODY_CAP_BYTES);
  if (raw === undefined) return true;
  if (!config.addParticipant) {
    sendJson(res, 200, { ok: false, error: "Joining isn't wired in this deployment." });
    return true;
  }
  const body = parseJoinBody(raw);
  if (!body) {
    sendJson(res, 400, { error: "malformed join body" });
    return true;
  }
  // The owner link: whoever's signed in is who this account belongs to, full stop (#466) —
  // assembled here from the session, never read from the body.
  sendJson(
    res,
    200,
    await config.addParticipant({
      ...body,
      ...(session?.email ? { ownerEmail: session.email } : {}),
    }),
  );
  return true;
}
