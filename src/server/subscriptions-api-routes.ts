import type { IncomingMessage, ServerResponse } from "node:http";
import { PLAYBOOK_MODES, type PlaybookMode } from "../domain/types.js";
import { playbookStoreView } from "../observatory/playbook-store-json-view.js";
import type { Session } from "./auth/session.js";
import { resolveOwnedIds } from "./dashboard-identity.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import {
  boundedString,
  parseJsonRecord,
  readJsonPost,
  requireGet,
  sendJson,
} from "./page-shell.js";

/**
 * THE PLAYBOOK STORE API (issue #885) — an account's own subscriptions, never another's.
 *
 *   GET  /api/playbook-store?id=<accountId>   → the catalog, merged with that account's own
 *                                                subscriptions IF the session owns it — otherwise
 *                                                the bare catalog (no cross-account visibility).
 *   POST /api/playbook-store/subscribe        → SubscriptionStore.subscribe (create or replace).
 *   POST /api/playbook-store/unsubscribe      → SubscriptionStore.unsubscribe.
 *   POST /api/playbook-store/set-enabled      → SubscriptionStore.setEnabled.
 *
 * Same posture as settings-api-routes.ts: bodies must be application/json, strict shape gate
 * (400, never coerce), size-capped, identity from the session and nowhere else — ownership is
 * `resolveOwnedIds(session, config).includes(id)`, exactly like the bot-control write.
 */

const BODY_CAP_BYTES = 4_096;

interface SubscribeBody {
  readonly id: string;
  readonly playbookId: string;
  readonly mode: PlaybookMode;
  readonly capitalAllocated: number;
  /** Symbol-targeting filter (#885) — optional, absent/empty means unrestricted. */
  readonly symbols?: readonly string[];
}

const MAX_SYMBOLS = 20;

/** An array of up to `MAX_SYMBOLS` non-empty tickers, uppercased; anything else (not an array, an
 *  empty array, a non-string entry, an over-long one) drops the whole filter to "unrestricted"
 *  rather than rejecting the request — the safe default (see `subscription-state.ts`'s parser). */
function parseSymbols(raw: unknown): readonly string[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_SYMBOLS) return undefined;
  const symbols = raw
    .map((s) => boundedString(s, 12))
    .filter((s): s is string => Boolean(s))
    .map((s) => s.toUpperCase());
  return symbols.length === raw.length ? symbols : undefined;
}

interface PlaybookRefBody {
  readonly id: string;
  readonly playbookId: string;
}

interface SetEnabledBody extends PlaybookRefBody {
  readonly enabled: boolean;
}

function parseSubscribeBody(raw: string): SubscribeBody | undefined {
  const body = parseJsonRecord(raw);
  if (!body) return undefined;
  const id = boundedString(body.id, 100);
  const playbookId = boundedString(body.playbookId, 60);
  const mode =
    typeof body.mode === "string" && PLAYBOOK_MODES.includes(body.mode as PlaybookMode)
      ? (body.mode as PlaybookMode)
      : undefined;
  const capitalAllocated =
    typeof body.capitalAllocated === "number" &&
    Number.isFinite(body.capitalAllocated) &&
    body.capitalAllocated >= 0
      ? body.capitalAllocated
      : undefined;
  const symbols = parseSymbols(body.symbols);
  return id && playbookId && mode && capitalAllocated !== undefined
    ? { id, playbookId, mode, capitalAllocated, ...(symbols ? { symbols } : {}) }
    : undefined;
}

function parsePlaybookRefBody(raw: string): PlaybookRefBody | undefined {
  const body = parseJsonRecord(raw);
  if (!body) return undefined;
  const id = boundedString(body.id, 100);
  const playbookId = boundedString(body.playbookId, 60);
  return id && playbookId ? { id, playbookId } : undefined;
}

function parseSetEnabledBody(raw: string): SetEnabledBody | undefined {
  const ref = parsePlaybookRefBody(raw);
  if (!ref) return undefined;
  const body = parseJsonRecord(raw);
  const enabled = typeof body?.enabled === "boolean" ? body.enabled : undefined;
  return enabled === undefined ? undefined : { ...ref, enabled };
}

function serveStoreIndex(
  req: IncomingMessage,
  res: ServerResponse,
  config: DashboardServerConfig,
  session: Session | undefined,
): void {
  if (!requireGet(req, res)) return;
  const id = new URL(req.url ?? "", "http://localhost").searchParams.get("id");
  const owns = Boolean(id) && config.auth && resolveOwnedIds(session, config).includes(id ?? "");
  const subscriptions = owns && id ? config.subscriptions?.load()[id] : undefined;
  sendJson(res, 200, playbookStoreView(subscriptions));
}

/** Handle `/api/playbook-store*`. Returns true when the request was answered. */
export async function serveSubscriptionsApi(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<boolean> {
  if (path === "/api/playbook-store") {
    serveStoreIndex(req, res, config, session);
    return true;
  }
  if (
    path !== "/api/playbook-store/subscribe" &&
    path !== "/api/playbook-store/unsubscribe" &&
    path !== "/api/playbook-store/set-enabled"
  ) {
    return false;
  }

  const raw = await readJsonPost(req, res, BODY_CAP_BYTES);
  if (raw === undefined) return true;
  if (!config.subscriptions) {
    sendJson(res, 200, { ok: false, error: "The Playbook Store isn't wired in this deployment." });
    return true;
  }
  const store = config.subscriptions;
  const ownedIds = config.auth ? resolveOwnedIds(session, config) : [];

  if (path === "/api/playbook-store/subscribe") {
    const body = parseSubscribeBody(raw);
    if (!body) {
      sendJson(res, 400, { error: "malformed subscribe body" });
      return true;
    }
    if (!ownedIds.includes(body.id)) {
      sendJson(res, 200, { ok: false, error: "You can only subscribe your own account." });
      return true;
    }
    store.subscribe(body.id, {
      playbookId: body.playbookId,
      mode: body.mode,
      capitalAllocated: body.capitalAllocated,
      enabled: true,
      ...(body.symbols ? { symbols: body.symbols } : {}),
    });
    sendJson(res, 200, { ok: true });
    return true;
  }

  if (path === "/api/playbook-store/unsubscribe") {
    const body = parsePlaybookRefBody(raw);
    if (!body) {
      sendJson(res, 400, { error: "malformed unsubscribe body" });
      return true;
    }
    if (!ownedIds.includes(body.id)) {
      sendJson(res, 200, { ok: false, error: "You can only unsubscribe your own account." });
      return true;
    }
    store.unsubscribe(body.id, body.playbookId);
    sendJson(res, 200, { ok: true });
    return true;
  }

  const body = parseSetEnabledBody(raw);
  if (!body) {
    sendJson(res, 400, { error: "malformed set-enabled body" });
    return true;
  }
  if (!ownedIds.includes(body.id)) {
    sendJson(res, 200, { ok: false, error: "You can only control your own subscriptions." });
    return true;
  }
  store.setEnabled(body.id, body.playbookId, body.enabled);
  sendJson(res, 200, { ok: true });
  return true;
}
