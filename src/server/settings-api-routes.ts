import type { IncomingMessage, ServerResponse } from "node:http";
import { ALLOWED_TIMEZONES } from "../participants/allowed-timezones.js";
import { sessionNameCandidates } from "./account-forms.js";
import type { Session } from "./auth/session.js";
import { resolveCurrentId, resolveOwnedIds } from "./dashboard-identity.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { parseJsonRecord, readJsonPost, sendJson } from "./page-shell.js";

/**
 * THE SETTINGS API (#738 phase 5c) — the React shell's account settings, as three endpoints.
 *
 *   GET  /api/settings          → the accounts the SESSION owns (never anyone else's), each with
 *                                 its stored profile or the honest host-configured marker.
 *   POST /api/settings/profile  → accountAdmin.updateProfile, fed the SAME identity assembly the
 *                                 `/account` form route builds (requester resolution, session-name
 *                                 candidates, auth mode) — the browser supplies none of it.
 *   POST /api/settings/remove   → accountAdmin.removeAccount; the typed display-name confirmation
 *                                 is verified by the SERVICE, never trusted from the client.
 *
 * Same posture as trade-api-routes.ts: bodies must be application/json (closes cookie-carried
 * cross-site form posts), strict shape gate (400, never coerce), size-capped (413), identity from
 * the session and nowhere else. Every refusal is the service's own sentence, rendered verbatim.
 */

const SETTINGS_BODY_CAP_BYTES = 4_096;

interface ProfileBody {
  readonly id: string;
  readonly displayName?: string;
  readonly timezone?: string;
}

interface RemoveBody {
  readonly id: string;
  readonly confirmName: string;
}

interface RotateBody {
  readonly id: string;
  readonly apiKey: string;
  readonly apiSecret: string;
}

function boundedString(raw: unknown, max: number): string | undefined {
  return typeof raw === "string" && raw.length > 0 && raw.length <= max ? raw : undefined;
}

/** Strict shape gate: exactly the fields a profile edit needs, everything else dropped. */
function parseProfileBody(raw: string): ProfileBody | undefined {
  const body = parseJsonRecord(raw);
  if (!body) return undefined;
  const id = boundedString(body.id, 100);
  if (!id) return undefined;
  const displayName = boundedString(body.displayName, 60);
  // "" clears the timezone (the service's own contract); anything else is a bounded string.
  const timezone =
    body.timezone === ""
      ? ""
      : body.timezone === undefined
        ? undefined
        : boundedString(body.timezone, 40);
  if (body.timezone !== undefined && timezone === undefined) return undefined;
  return {
    id,
    ...(displayName !== undefined ? { displayName } : {}),
    ...(timezone !== undefined ? { timezone } : {}),
  };
}

/** Keys are pasted, never displayed back: the shape gate bounds them and nothing here logs
 *  or echoes a secret — the service verifies against Alpaca before anything is stored. */
function parseRotateBody(raw: string): RotateBody | undefined {
  const body = parseJsonRecord(raw);
  if (!body) return undefined;
  const id = boundedString(body.id, 100);
  const apiKey = boundedString(body.apiKey, 200);
  const apiSecret = boundedString(body.apiSecret, 200);
  return id && apiKey && apiSecret ? { id, apiKey, apiSecret } : undefined;
}

function parseRemoveBody(raw: string): RemoveBody | undefined {
  const body = parseJsonRecord(raw);
  if (!body) return undefined;
  const id = boundedString(body.id, 100);
  const confirmName = boundedString(body.confirmName, 80);
  return id && confirmName ? { id, confirmName } : undefined;
}

/**
 * The requester the service compares the target against — the `/account` route's exact rule:
 * the target itself when the session owns it, else the session's first human account, else its
 * first account at all. The service then enforces requester === target for human edits; feeding
 * it a non-owned target with an owned requester yields the same honest refusal the form gets.
 */
function requesterFor(
  targetId: string,
  ownedIds: readonly string[],
  config: DashboardServerConfig,
): string | undefined {
  if (ownedIds.includes(targetId)) return targetId;
  const board = config.hub.getState().participants;
  return ownedIds.find((id) => board.find((p) => p.id === id)?.kind === "human") ?? ownedIds[0];
}

function serveSettingsIndex(
  res: ServerResponse,
  config: DashboardServerConfig,
  session: Session | undefined,
): void {
  const authConfigured = Boolean(config.auth);
  const adminWired = Boolean(config.accountAdmin);
  const ownedIds = authConfigured ? resolveOwnedIds(session, config) : [];
  const board = config.hub.getState().participants;
  const roster = config.rosterIds?.() ?? new Set<string>();
  const accounts = ownedIds.map((id) => {
    const found = board.find((p) => p.id === id);
    const profile = config.accountAdmin?.profileFor(id);
    return {
      id,
      name: found?.displayName ?? id,
      kind: found?.kind ?? "human",
      hostConfigured: roster.has(id),
      profile: profile ?? null,
    };
  });
  sendJson(res, 200, {
    authConfigured,
    adminWired,
    accounts,
    timezones: ALLOWED_TIMEZONES,
  });
}

/** The rotate write, split out for the complexity gate — the /rotate route's exact requester
 *  assembly: the session's resolved id and email, both absent exactly when OAuth isn't
 *  configured. The browser supplies neither, and no secret is ever logged or echoed. */
async function serveRotate(
  req: IncomingMessage,
  res: ServerResponse,
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<void> {
  const raw = await readJsonPost(req, res, SETTINGS_BODY_CAP_BYTES);
  if (raw === undefined) return;
  if (!config.rotateCredentials) {
    sendJson(res, 200, { ok: false, error: "Credential rotation isn't wired in this deployment." });
    return;
  }
  const body = parseRotateBody(raw);
  if (!body) {
    sendJson(res, 400, { error: "malformed rotate body" });
    return;
  }
  const requesterId = config.auth ? resolveCurrentId(session, config.resolveOwnerId) : undefined;
  sendJson(
    res,
    200,
    await config.rotateCredentials({
      ...body,
      ...(requesterId !== undefined ? { requesterId } : {}),
      ...(config.auth && session ? { requesterEmail: session.email } : {}),
    }),
  );
}

/** Handle `/api/settings*`. Returns true when the request was answered. */
export async function serveSettingsApi(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<boolean> {
  if (path === "/api/settings") {
    serveSettingsIndex(res, config, session);
    return true;
  }
  if (path === "/api/settings/rotate") {
    await serveRotate(req, res, config, session);
    return true;
  }
  if (path !== "/api/settings/profile" && path !== "/api/settings/remove") return false;

  const raw = await readJsonPost(req, res, SETTINGS_BODY_CAP_BYTES);
  if (raw === undefined) return true;
  if (!config.accountAdmin) {
    sendJson(res, 200, { ok: false, error: "Account management isn't wired in this deployment." });
    return true;
  }
  const authConfigured = Boolean(config.auth);
  const ownedIds = authConfigured ? resolveOwnedIds(session, config) : [];

  if (path === "/api/settings/profile") {
    const body = parseProfileBody(raw);
    if (!body) {
      sendJson(res, 400, { error: "malformed profile body" });
      return true;
    }
    const requesterId = requesterFor(body.id, ownedIds, config);
    sendJson(
      res,
      200,
      await config.accountAdmin.updateProfile({
        ...body,
        ...(requesterId !== undefined ? { requesterId } : {}),
        ...(session ? { requesterEmail: session.email } : {}),
        sessionNames: sessionNameCandidates(session),
        authConfigured,
      }),
    );
    return true;
  }

  const body = parseRemoveBody(raw);
  if (!body) {
    sendJson(res, 400, { error: "malformed remove body" });
    return true;
  }
  const requesterId = requesterFor(body.id, ownedIds, config);
  sendJson(
    res,
    200,
    await config.accountAdmin.removeAccount({
      ...body,
      ...(requesterId !== undefined ? { requesterId } : {}),
      ...(session ? { requesterEmail: session.email } : {}),
      authConfigured,
    }),
  );
  return true;
}
