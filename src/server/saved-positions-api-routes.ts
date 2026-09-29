import type { IncomingMessage, ServerResponse } from "node:http";
import { cleanStake } from "../options/guidance-stake-parse.js";
import { UNDERLYING_PATTERN } from "../trading/option-symbols.js";
import type { Session } from "./auth/session.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { opaqueMemberId } from "./feedback-issue.js";
import {
  boundedString,
  parseJsonRecord,
  readJsonPost,
  requireGet,
  sendJson,
} from "./page-shell.js";

/**
 * THE SAVED POSITIONS API (#3968 slice 1b) — a member's own typed-in positions, never another's.
 * Keyed by `opaqueMemberId(session.email)`, the same per-member identity space `/api/companion`
 * uses — never a linked paper-desk id (a member may have zero or several).
 *
 *   GET  /api/saved-positions         → { positions: SavedPosition[] } for the signed-in member.
 *   POST /api/saved-positions/save    → { ok, position? , error? }
 *   POST /api/saved-positions/update  → { ok, error? }
 *   POST /api/saved-positions/delete  → { ok, error? }
 *
 * Same auth invariant as `companion-routes.ts`: `!session` means the route doesn't exist (`false`),
 * before anything else runs — `dashboard-server.ts` reaches this file only after `gateRequest`.
 */

const BODY_CAP_BYTES = 4_096;
const MAX_NAME = 60;
const MAX_ID = 40;

function parseName(raw: unknown): string | undefined {
  const s = boundedString(raw, MAX_NAME);
  return s?.trim() ? s.trim() : undefined;
}

interface SaveBody {
  readonly symbol: string;
  readonly name: string;
  readonly stake: unknown;
}

function parseSaveBody(raw: string): SaveBody | undefined {
  const body = parseJsonRecord(raw);
  if (!body) return undefined;
  const symbol =
    typeof body.symbol === "string" && UNDERLYING_PATTERN.test(body.symbol)
      ? body.symbol
      : undefined;
  const name = parseName(body.name);
  return symbol && name ? { symbol, name, stake: body.stake } : undefined;
}

interface UpdateBody {
  readonly id: string;
  readonly name?: string;
  readonly stake?: unknown;
}

function parseUpdateBody(raw: string): UpdateBody | undefined {
  const body = parseJsonRecord(raw);
  if (!body) return undefined;
  const id = boundedString(body.id, MAX_ID);
  if (!id) return undefined;
  const name = body.name === undefined ? undefined : parseName(body.name);
  if (body.name !== undefined && name === undefined) return undefined;
  const hasStake = body.stake !== undefined;
  if (name === undefined && !hasStake) return undefined;
  return {
    id,
    ...(name !== undefined ? { name } : {}),
    ...(hasStake ? { stake: body.stake } : {}),
  };
}

function parseIdBody(raw: string): { readonly id: string } | undefined {
  const body = parseJsonRecord(raw);
  if (!body) return undefined;
  const id = boundedString(body.id, MAX_ID);
  return id ? { id } : undefined;
}

/** Handle `/api/saved-positions*`. Returns true when the request was answered, false when the
 *  route doesn't apply (unauthenticated, or a different path) — mirrors `serveCompanionApi`. */
export async function serveSavedPositionsApi(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<boolean> {
  if (!session) return false;
  if (
    path !== "/api/saved-positions" &&
    path !== "/api/saved-positions/save" &&
    path !== "/api/saved-positions/update" &&
    path !== "/api/saved-positions/delete"
  ) {
    return false;
  }
  const store = config.savedPositions;
  if (!store) {
    if (path === "/api/saved-positions") {
      if (!requireGet(req, res)) return true;
      sendJson(res, 200, { positions: [] });
      return true;
    }
    const raw = await readJsonPost(req, res, BODY_CAP_BYTES);
    if (raw === undefined) return true;
    sendJson(res, 200, { ok: false, error: "Saved positions aren't wired in this deployment." });
    return true;
  }
  const accountKey = opaqueMemberId(session.email);

  if (path === "/api/saved-positions") {
    if (!requireGet(req, res)) return true;
    sendJson(res, 200, { positions: store.list(accountKey) });
    return true;
  }

  const raw = await readJsonPost(req, res, BODY_CAP_BYTES);
  if (raw === undefined) return true;

  if (path === "/api/saved-positions/save") {
    const body = parseSaveBody(raw);
    if (!body) {
      sendJson(res, 400, { error: "malformed save body" });
      return true;
    }
    const position = store.save(accountKey, {
      symbol: body.symbol,
      name: body.name,
      stake: cleanStake(body.stake),
    });
    sendJson(res, 200, { ok: true, position });
    return true;
  }

  if (path === "/api/saved-positions/update") {
    const body = parseUpdateBody(raw);
    if (!body) {
      sendJson(res, 400, { error: "malformed update body" });
      return true;
    }
    store.update(accountKey, body.id, {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.stake !== undefined ? { stake: cleanStake(body.stake) } : {}),
    });
    sendJson(res, 200, { ok: true });
    return true;
  }

  const body = parseIdBody(raw);
  if (!body) {
    sendJson(res, 400, { error: "malformed delete body" });
    return true;
  }
  store.delete(accountKey, body.id);
  sendJson(res, 200, { ok: true });
  return true;
}
